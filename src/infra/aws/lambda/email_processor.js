const { S3Client, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const https = require('https');

const s3Client = new S3Client();

exports.handler = async (event) => {
    try {
        const snsMessage = JSON.parse(event.Records[0].Sns.Message);

        // Get message ID from the email metadata
        const messageId = snsMessage.mail.messageId;
        const bucketName = process.env.S3_BUCKET_NAME;
        const objectKey = `${process.env.S3_OBJECT_PREFIX}${messageId}`;

        // Get email from S3
        const getCommand = new GetObjectCommand({
            Bucket: bucketName,
            Key: objectKey
        });
        const s3Response = await s3Client.send(getCommand);
        const emailBody = await s3Response.Body.transformToString('base64');

        // Send to API with complete email data and retry on 5xx
        const postData = JSON.stringify({
            emailBody: emailBody
        });

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'x-vercel-protection-bypass': process.env.VERCEL_PROTECTION_BYPASS,
                'x-curio-app-secret': process.env.CURIO_APP_SECRET
            }
        };

        const makeRequest = async (attempt = 1) => {
            const maxAttempts = 3;
            const baseDelay = 1000 * 60; // 1 minute

            try {
                const response = await new Promise((resolve, reject) => {
                    const req = https.request(process.env.API_ENDPOINT, options, (res) => {
                        let data = '';
                        res.on('data', chunk => { data += chunk; });
                        res.on('end', () => {
                            resolve({ statusCode: res.statusCode, data });
                        });
                    });

                    req.on('error', reject);
                    req.write(postData);
                    req.end();
                });

                if (response.statusCode >= 200 && response.statusCode < 300) {
                    // Delete processed email
                    const deleteCommand = new DeleteObjectCommand({
                        Bucket: bucketName,
                        Key: objectKey
                    });
                    await s3Client.send(deleteCommand);

                    return response.data;
                }

                // Retry on 5xx errors
                if (response.statusCode >= 500 && attempt < maxAttempts) {
                    const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
                    console.log(`Attempt ${attempt} failed with status ${response.statusCode}. Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return makeRequest(attempt + 1);
                }

                throw new Error(`API request failed with status ${response.statusCode}: ${response.data}`);
            } catch (error) {
                if (attempt < maxAttempts && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT')) {
                    const delay = baseDelay * Math.pow(2, attempt - 1);
                    console.log(`Attempt ${attempt} failed with error: ${error.message}. Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return makeRequest(attempt + 1);
                }
                throw error;
            }
        };

        await makeRequest();

        return {
            statusCode: 200,
            body: 'Email processed successfully'
        };
    } catch (error) {
        console.error('Error in processing email function:', error);
        // Don't throw the error to prevent SES retries
        return {
            statusCode: 200,
            body: 'Processed with errors'
        };
    }
};

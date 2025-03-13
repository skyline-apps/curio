const { S3Client, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const https = require('https');

const s3Client = new S3Client();

exports.handler = async (event) => {
    if (!event.Records || !event.Records[0] || !event.Records[0].s3) {
        console.error('Invalid event structure:', event);
        return {
            statusCode: 400,
            body: 'Invalid event structure'
        };
    }

    // Get bucket and key from the S3 event
    const bucketName = event.Records[0].s3.bucket.name;
    const objectKey = event.Records[0].s3.object.key;

    try {
        // Get email from S3
        const getCommand = new GetObjectCommand({
            Bucket: bucketName,
            Key: objectKey
        });
        const s3Response = await s3Client.send(getCommand);
        // Keep raw email content in MIME format for proper parsing by mailparser
        const chunks = [];
        for await (const chunk of s3Response.Body) {
            chunks.push(chunk);
        }
        const emailBody = Buffer.concat(chunks).toString('base64');

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

            return {
                statusCode: 200,
                body: `Email ${response.slug} processed successfully`
            };
        } else if (response.statusCode < 500) {
            // Return error status but don't throw to prevent S3 event retries
            return {
                statusCode: 401,
                body: 'Processed with errors'
            };
        }
        throw new Error(`API request failed with status ${response.statusCode}: ${response.data}`);
    } catch (error) {
        console.error(`Error processing email from S3 object ${objectKey || 'unknown'}:`, error);
        // Throw error to trigger Lambda's retry mechanism
        throw error;
    }
};

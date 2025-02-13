import { serve } from "https://deno.fresh.dev/std@v1/http/server.ts";

interface EmailPayload {
    commonHeaders: {
        from: string[];
        to: string[];
        subject: string;
        date: string;
    };
    receipt: {
        action: {
            bucketName: string;
            objectKey: string;
        };
    };
}

interface SESEvent {
    Records: [{
        eventVersion: string;
        ses: {
            receipt: any;
            mail: EmailPayload;
        };
    }];
}

serve(async (req: Request) => {
    try {
        const data = await req.json() as SESEvent;
        const email = data.Records[0].ses.mail;

        const response = await fetch(
            `${Deno.env.get('NEXTJS_API_URL')}/api/inbound-email`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Deno.env.get('API_SECRET_KEY')}`,
                },
                body: JSON.stringify({
                    from: email.commonHeaders.from[0],
                    to: email.commonHeaders.to[0],
                    subject: email.commonHeaders.subject,
                    receivedAt: email.commonHeaders.date,
                    rawData: data
                })
            }
        );

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        return new Response(
            JSON.stringify({ message: 'Email forwarded to API successfully' }),
            {
                headers: { 'Content-Type': 'application/json' },
                status: 200
            }
        );
    } catch (error) {
        console.error('Error processing email:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { 'Content-Type': 'application/json' },
                status: 500
            }
        );
    }
});
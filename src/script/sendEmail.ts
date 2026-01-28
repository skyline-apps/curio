import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.resolve(__dirname, '../../.env') });

import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { profiles, authUsers } from '@app/api/db/schema';
import { eq, and } from 'drizzle-orm';
import { readFileSync } from 'fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// Initialize AWS SES Client
const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-west-2',
  // Credentials will be loaded from default provider chain (env, ~/.aws/credentials, etc.)
  // if not explicitly provided here.
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
});

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option('template', {
      type: 'string',
      description: 'Path to HTML template file',
      demandOption: true,
    })
    .option('subject', {
      type: 'string',
      description: 'Email subject',
      demandOption: true,
    })
    .option('sender', {
      type: 'string',
      description: 'Sender email address',
      demandOption: true,
    })
    .option('dry-run', {
      type: 'boolean',
      description: 'Dry run (do not send emails)',
      default: false,
    })
    .argv;

  if (!process.env.POSTGRES_URL) {
    console.error('POSTGRES_URL environment variable is missing.');
    process.exit(1);
  }

  const client = postgres(process.env.POSTGRES_URL);
  const db = drizzle(client);

  try {
    console.log('Fetching users...');
    
    const users = await db
      .select({
        email: authUsers.email,
        profileId: profiles.id,
      })
      .from(profiles)
      .innerJoin(authUsers, eq(profiles.userId, authUsers.id))
      .where(eq(profiles.emailBounced, false)); // Only send to non-bounced emails

    console.log(`Found ${users.length} active users.`);

    const htmlTemplate = readFileSync(argv.template, 'utf-8');

    for (const user of users) {
      if (argv.dryRun) {
        console.log(`[Dry Run] Would send to: ${user.email}`);
        continue;
      }

      console.log(`Sending to: ${user.email}`);

      const command = new SendEmailCommand({
        Source: argv.sender,
        Destination: {
          ToAddresses: [user.email],
        },
        Message: {
          Subject: {
            Data: argv.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: htmlTemplate,
              Charset: 'UTF-8',
            },
          },
        },
      });

      try {
        await sesClient.send(command);
        console.log(`Successfully sent to ${user.email}`);
      } catch (error) {
        console.error(`Failed to send to ${user.email}:`, error);
      }
      
      // Simple rate limiting to be safe (e.g., 100ms delay)
      await new Promise(resolve => setTimeout(resolve, 100));
    }

  } catch (error) {
    console.error('Error in script:', error);
  } finally {
    await client.end();
  }
}

main().catch(console.error);

import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: process.env.DOTENV_CONFIG_PATH });
console.log('Loading .env from:', process.env.DOTENV_CONFIG_PATH);

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
    .option('batch-size', {
      type: 'number',
      description: 'Number of emails to send concurrently',
      default: 10,
    })
    .option('to', {
      type: 'string',
      description: 'Specific email address to send to',
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
    
    const whereConditions = [
      eq(profiles.emailBounced, false),
      eq(profiles.marketingEmails, true),
    ];

    if (argv.to) {
      whereConditions.push(eq(authUsers.email, (argv as any).to as string));
    }

    const users = await db
      .select({
        email: authUsers.email,
        profileId: profiles.id,
      })
      .from(profiles)
      .innerJoin(authUsers, eq(profiles.userId, authUsers.id))
      .where(and(...whereConditions));

    console.log(`Found ${users.length} active users.`);

    const htmlTemplate = readFileSync(argv.template, 'utf-8');

    const batchSize = argv.batchSize as number;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} users)...`);

      await Promise.all(batch.map(async (user) => {
        if (argv.dryRun) {
          console.log(`[Dry Run] Would send to: ${user.email}`);
          return;
        }

        console.log(`Sending to: ${user.email}`);

        const htmlBody = htmlTemplate.replace(/{{profileId}}/g, user.profileId);

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
                Data: htmlBody,
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
      }));
      
      if (!argv.dryRun && i + batchSize < users.length) {
        // Simple rate limiting between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

  } catch (error) {
    console.error('Error in script:', error);
  } finally {
    await client.end();
  }
}

main().catch(console.error);

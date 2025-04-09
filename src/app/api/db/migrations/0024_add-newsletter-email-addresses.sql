ALTER TABLE "profiles" ADD COLUMN "newsletter_email" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_newsletter_email_unique" UNIQUE("newsletter_email");
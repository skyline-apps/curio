ALTER TABLE "profile_items" ALTER COLUMN "saved_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "profile_items" ALTER COLUMN "saved_at" DROP NOT NULL;
ALTER TABLE "profile_items" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "profile_items" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "profile_items" ADD COLUMN "author" text;--> statement-breakpoint
ALTER TABLE "profile_items" ADD COLUMN "thumbnail" text;--> statement-breakpoint
ALTER TABLE "profile_items" ADD COLUMN "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "items" DROP COLUMN "title";--> statement-breakpoint
ALTER TABLE "items" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "items" DROP COLUMN "author";--> statement-breakpoint
ALTER TABLE "items" DROP COLUMN "thumbnail";--> statement-breakpoint
ALTER TABLE "items" DROP COLUMN "published_at";
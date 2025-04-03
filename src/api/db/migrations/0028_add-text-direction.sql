CREATE TYPE "public"."text_direction" AS ENUM('ltr', 'rtl');--> statement-breakpoint
ALTER TABLE "profile_items" ADD COLUMN "text_direction" text_direction DEFAULT 'ltr' NOT NULL;
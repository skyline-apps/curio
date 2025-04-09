CREATE TYPE "public"."item_source" AS ENUM('email');--> statement-breakpoint
ALTER TABLE "profile_items" ADD COLUMN "source" "item_source";
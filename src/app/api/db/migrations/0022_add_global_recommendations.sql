CREATE TYPE "public"."recommendation_type" AS ENUM('popular');--> statement-breakpoint
ALTER TYPE "public"."recommendation_section_type" RENAME TO "personal_recommendation_type";--> statement-breakpoint
CREATE TABLE "item_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"type" "recommendation_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "item_recommendations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profile_item_recommendations" RENAME COLUMN "section_type" TO "type";--> statement-breakpoint
DROP INDEX "unique_profile_section_item";--> statement-breakpoint
ALTER TABLE "item_recommendations" ADD CONSTRAINT "recommendations_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_item" ON "item_recommendations" USING btree ("item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_profile_section_item" ON "profile_item_recommendations" USING btree ("profile_id","type","item_id");--> statement-breakpoint
ALTER TABLE "profile_item_recommendations" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "public"."profile_item_recommendations" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DELETE FROM "public"."profile_item_recommendations" WHERE "type" = 'popular';--> statement-breakpoint
DROP TYPE "public"."personal_recommendation_type";--> statement-breakpoint
CREATE TYPE "public"."personal_recommendation_type" AS ENUM('newsletter', 'favorite_author', 'favorites');--> statement-breakpoint
ALTER TABLE "public"."profile_item_recommendations" ALTER COLUMN "type" SET DATA TYPE "public"."personal_recommendation_type" USING "type"::"public"."personal_recommendation_type";
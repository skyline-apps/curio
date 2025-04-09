CREATE TYPE "public"."recommendation_section_type" AS ENUM('popular', 'newsletter', 'favorite_author', 'favorites');--> statement-breakpoint
CREATE TABLE "profile_item_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"profile_item_id" uuid,
	"section_type" "recommendation_section_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profile_item_recommendations" ADD CONSTRAINT "profile_item_recommendations_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "profile_item_recommendations" ADD CONSTRAINT "profile_item_recommendations_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "profile_item_recommendations" ADD CONSTRAINT "profile_item_recommendations_profile_item_id_fk" FOREIGN KEY ("profile_item_id") REFERENCES "public"."profile_items"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_profile_section_item" ON "profile_item_recommendations" USING btree ("profile_id","section_type","item_id");
ALTER TABLE "item_recommendations" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "profile_item_recommendations" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "item_recommendations" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "profile_item_recommendations" DROP COLUMN "created_at";
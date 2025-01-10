ALTER TABLE "items" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_slug_unique" UNIQUE("slug");
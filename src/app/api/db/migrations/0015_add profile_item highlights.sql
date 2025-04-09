CREATE TABLE "profile_item_highlights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_item_id" uuid NOT NULL,
	"start_offset" integer NOT NULL,
	"end_offset" integer NOT NULL,
	"text" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profile_item_highlights" ADD CONSTRAINT "profile_item_highlights_profile_item_id_fk" FOREIGN KEY ("profile_item_id") REFERENCES "public"."profile_items"("id") ON DELETE cascade ON UPDATE cascade;
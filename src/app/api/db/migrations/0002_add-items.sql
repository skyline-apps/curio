CREATE TYPE "public"."item_state" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"slug" text,
	"title" text,
	"description" text,
	"author" text,
	"thumbnail" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "items_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "profile_item_labels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_item_id" uuid NOT NULL,
	"label_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"state" "item_state" DEFAULT 'active' NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"reading_progress" integer DEFAULT 0 NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	"last_read_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "profile_labels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "profile_item_labels" ADD CONSTRAINT "profile_item_labels_profile_item_id_fk" FOREIGN KEY ("profile_item_id") REFERENCES "public"."profile_items"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "profile_item_labels" ADD CONSTRAINT "profile_item_labels_label_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."profile_labels"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "profile_items" ADD CONSTRAINT "profile_items_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "profile_items" ADD CONSTRAINT "profile_items_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "profile_labels" ADD CONSTRAINT "profile_labels_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "url_index" ON "items" USING btree ("url");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_profile_item_label" ON "profile_item_labels" USING btree ("profile_item_id","label_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_profile_item" ON "profile_items" USING btree ("profile_id","item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_profile_label" ON "profile_labels" USING btree ("profile_id","name");
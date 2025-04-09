DO $$ BEGIN
 CREATE TYPE "public"."color_scheme" AS ENUM('auto', 'light', 'dark');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "color_scheme" "color_scheme" DEFAULT 'auto' NOT NULL;
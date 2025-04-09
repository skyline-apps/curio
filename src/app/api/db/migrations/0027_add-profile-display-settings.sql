CREATE TYPE "public"."display_font" AS ENUM('monospace', 'sans-serif', 'serif');--> statement-breakpoint
CREATE TYPE "public"."display_font_size" AS ENUM('sm', 'md', 'lg', 'xl');--> statement-breakpoint
CREATE TYPE "public"."display_line_height" AS ENUM('sm', 'md', 'lg');--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "display_font" "display_font" DEFAULT 'sans-serif' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "display_font_size" "display_font_size" DEFAULT 'md' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "display_line_height" "display_line_height" DEFAULT 'sm' NOT NULL;
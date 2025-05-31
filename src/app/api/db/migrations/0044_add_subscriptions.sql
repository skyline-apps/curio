CREATE TYPE "public"."subscription_status" AS ENUM('active', 'inactive', 'in_grace_period', 'paused', 'expired');--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"app_user_id" text NOT NULL,
	"original_transaction_id" text,
	"status" "subscription_status" NOT NULL,
	"product_id" text NOT NULL,
	"purchase_date" timestamp with time zone NOT NULL,
	"expiration_date" timestamp with time zone NOT NULL,
	"auto_renew_status" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "is_premium" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "premium_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_profile_subscription" ON "subscriptions" USING btree ("profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_transaction_id" ON "subscriptions" USING btree ("original_transaction_id") WHERE "subscriptions"."original_transaction_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "active_subscriptions_idx" ON "subscriptions" USING btree ("status") WHERE "subscriptions"."status" = 'active'::subscription_status;
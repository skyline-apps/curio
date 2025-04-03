CREATE INDEX "profile_items_is_favorite_idx" ON "profile_items" USING btree ("is_favorite");--> statement-breakpoint
CREATE INDEX "profile_items_state_idx" ON "profile_items" USING btree ("state");--> statement-breakpoint
CREATE INDEX "profile_items_state_updated_at_idx" ON "profile_items" USING btree ("state_updated_at");--> statement-breakpoint
ALTER TABLE "profile_items" ADD CONSTRAINT "profile_items_state_updated_at_unique" UNIQUE("state_updated_at");
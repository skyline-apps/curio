DROP INDEX "unique_item";--> statement-breakpoint
CREATE UNIQUE INDEX "unique_section_item" ON "item_recommendations" USING btree ("type","item_id");
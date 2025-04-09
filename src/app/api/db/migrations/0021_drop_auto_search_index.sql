--> statement-breakpoint
DROP TRIGGER IF EXISTS searchindex_trigger_update ON profile_items;

--> statement-breakpoint
DROP TRIGGER IF EXISTS searchindex_trigger_create ON profile_items;

--> statement-breakpoint
DROP FUNCTION IF EXISTS update_searchindex();

--> statement-breakpoint
DROP FUNCTION IF EXISTS create_searchindex();
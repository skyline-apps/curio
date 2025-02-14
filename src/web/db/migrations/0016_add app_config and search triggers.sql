CREATE TABLE "app_config" (
    "key" text PRIMARY KEY NOT NULL,
    "value" text NOT NULL
);

--> statement-breakpoint
CREATE OR REPLACE PROCEDURE create_search_functions()
LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
        EXECUTE $func$
        CREATE OR REPLACE FUNCTION update_searchindex()
        RETURNS trigger AS $trigger$
        DECLARE
            payload jsonb;
            search_endpoint_url text;
            search_api_key text;
            full_url text;
            numeric_state int;
            numeric_is_favorite int;
            filter_condition text;
            update_function text;
        BEGIN
            SELECT value INTO search_endpoint_url FROM app_config WHERE key = 'SEARCH_ENDPOINT_URL';
            SELECT value INTO search_api_key FROM app_config WHERE key = 'SEARCH_API_KEY';

            numeric_state := CASE NEW.state
                WHEN 'active' THEN 1
                WHEN 'archived' THEN 2
                WHEN 'deleted' THEN 3
                ELSE 0
            END;

            numeric_is_favorite := CASE WHEN NEW.is_favorite THEN 1 ELSE 0 END;

            filter_condition := 'profileItemId = "' || NEW.id || '"';

            update_function := '
                doc.title = "' || replace(NEW.title, '"', '\"') || '";
                doc.author = "' || replace(COALESCE(NEW.author, ''), '"', '\"') || '";
                doc.description = "' || replace(COALESCE(NEW.description, ''), '"', '\"') || '";
                doc.state = ' || numeric_state || ';
                doc.isFavorite = ' || numeric_is_favorite || ';
            ';

            payload := jsonb_build_object(
                'function', update_function,
                'filter', filter_condition
            );

            full_url := search_endpoint_url || '/indexes/items/documents/edit';

            PERFORM net.http_post(
                url := full_url,
                body := payload::jsonb,
                params := '{}'::jsonb,
                headers := jsonb_build_object(
                    'Authorization', 'Bearer ' || search_api_key,
                    'Content-Type', 'application/json'
                ),
                timeout_milliseconds := 5000
            );
            RETURN NEW;
        END;
        $trigger$ LANGUAGE plpgsql;
        $func$;

        EXECUTE $func$
        CREATE OR REPLACE FUNCTION create_searchindex()
        RETURNS trigger AS $trigger$
        DECLARE
            payload jsonb;
            search_endpoint_url text;
            search_api_key text;
            full_url text;
        BEGIN
            SELECT value INTO search_endpoint_url FROM app_config WHERE key = 'SEARCH_ENDPOINT_URL';
            SELECT value INTO search_api_key FROM app_config WHERE key = 'SEARCH_API_KEY';

            payload := jsonb_build_object(
                'profileItemId', NEW.id
            );

            full_url := search_endpoint_url || '/indexes/items/documents';

            PERFORM net.http_post(
                url := full_url,
                body := payload::jsonb,
                params := '{}'::jsonb,
                headers := jsonb_build_object(
                    'Authorization', 'Bearer ' || search_api_key,
                    'Content-Type', 'application/json'
                ),
                timeout_milliseconds := 5000
            );
            RETURN NEW;
        END;
        $trigger$ LANGUAGE plpgsql;
        $func$;
    END IF;
END;
$$;

--> statement-breakpoint
CREATE OR REPLACE PROCEDURE create_search_triggers()
LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
        EXECUTE $trig$
        CREATE OR REPLACE TRIGGER searchindex_trigger_update
        AFTER UPDATE ON profile_items
        FOR EACH ROW
        WHEN (
            OLD.saved_at IS DISTINCT FROM NEW.saved_at OR
            OLD.state IS DISTINCT FROM NEW.state OR
            OLD.is_favorite IS DISTINCT FROM NEW.is_favorite
        )
        EXECUTE FUNCTION update_searchindex();
        $trig$;

        EXECUTE $trig$
        CREATE OR REPLACE TRIGGER searchindex_trigger_create
        AFTER INSERT ON profile_items
        FOR EACH ROW
        EXECUTE FUNCTION create_searchindex();
        $trig$;
    END IF;
END;
$$;

--> statement-breakpoint
CALL create_search_functions();

--> statement-breakpoint
CALL create_search_triggers();
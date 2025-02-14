CREATE TABLE "app_config" (
    "key" text PRIMARY KEY NOT NULL,
    "value" text NOT NULL
);

-- Human generated
create or replace function update_searchindex()
returns trigger as $$
declare
    payload jsonb;
    search_endpoint_url text;
    search_api_key text;
    full_url text;
    numeric_state int;
    numeric_is_favorite int;
    filter_condition text;
    update_function text;
begin
    select value into search_endpoint_url from app_config where key = 'SEARCH_ENDPOINT_URL';
    select value into search_api_key from app_config where key = 'SEARCH_API_KEY';

    numeric_state := case NEW.state
        when 'active' then 1
        when 'archived' then 2
        when 'deleted' then 3
        else 0
    end;

    numeric_is_favorite := case when NEW.is_favorite then 1 else 0 end;

    filter_condition := 'profileItemId = "' || NEW.id || '"';

    update_function := '
        doc.title = "' || NEW.title || '";
        doc.author = "' || coalesce(NEW.author, '') || '";
        doc.description = "' || coalesce(NEW.description, '') || '";
        doc.state = ' || numeric_state || ';
        doc.isFavorite = ' || numeric_is_favorite || ';
    ';

    payload := jsonb_build_object(
        'function', update_function,
        'filter', filter_condition
    );

    full_url := search_endpoint_url || '/indexes/items/documents/edit';

    perform net.http_post(
        url := full_url,
        body := payload::jsonb,
        params := '{}'::jsonb,
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || search_api_key,
            'Content-Type', 'application/json'
        ),
        timeout_milliseconds := 5000
    );


    return NEW;
end;
$$ language plpgsql;

create or replace function create_searchindex()
returns trigger as $$
declare
    payload jsonb;
    search_endpoint_url text;
    search_api_key text;
    full_url text;
begin
    select value into search_endpoint_url from app_config where key = 'SEARCH_ENDPOINT_URL';
    select value into search_api_key from app_config where key = 'SEARCH_API_KEY';

    payload := jsonb_build_object(
        'profileItemId', NEW.id
    );

    full_url := search_endpoint_url || '/indexes/items/documents';

    perform net.http_post(
        url := full_url,
        body := payload::jsonb,
        params := '{}'::jsonb,
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || search_api_key,
            'Content-Type', 'application/json'
        ),
        timeout_milliseconds := 5000
    );
    return NEW;
end;
$$ language plpgsql;

create or replace trigger searchindex_trigger_update
after update on profile_items
for each row
when (
    OLD.saved_at is distinct from NEW.saved_at or
    OLD.state is distinct from NEW.state or
    OLD.is_favorite is distinct from NEW.is_favorite
)
execute function update_searchindex();

create or replace trigger searchindex_trigger_create
after insert on profile_items
for each row
execute function create_searchindex();
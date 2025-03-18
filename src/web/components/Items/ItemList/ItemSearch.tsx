import React, { useCallback, useContext, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

import Input from "@/components/ui/Input";
import { ItemsContext } from "@/providers/ItemsProvider";

import ItemSearchFilters from "./ItemSearchFilters";

interface ItemSearchProps {
  itemCount: number;
}

const ItemSearch: React.FC<ItemSearchProps> = ({
  itemCount,
}: ItemSearchProps): React.ReactElement => {
  const [searchString, setSearchString] = useState<string>("");
  const { fetchItems, setSearchQuery, currentFilters } =
    useContext(ItemsContext);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearchQuery(value);
    fetchItems(false, { search: value, filters: currentFilters });
  }, 300);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchString(value);
      debouncedSearch(value);
    },
    [setSearchString, debouncedSearch],
  );

  return (
    <div className="flex gap-2 grow items-center">
      <Input
        className="grow"
        value={searchString}
        onChange={(ev) => handleSearchChange(ev.target.value)}
        placeholder={
          itemCount ? `Search ${itemCount} items...` : "Search items..."
        }
        isClearable
        onClear={() => {
          setSearchString("");
          fetchItems(false, { search: "", filters: currentFilters });
        }}
      />
      <ItemSearchFilters />
    </div>
  );
};
export default ItemSearch;

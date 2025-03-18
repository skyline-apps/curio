import React, { useCallback, useContext, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

import Input from "@/components/ui/Input";
import { ItemsContext } from "@/providers/ItemsProvider";

const ItemSearch: React.FC = (): React.ReactElement => {
  const [searchString, setSearchString] = useState<string>("");
  const { fetchItems, setSearchQuery } = useContext(ItemsContext);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearchQuery(value);
    fetchItems(false, { search: value });
  }, 300);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchString(value);
      debouncedSearch(value);
    },
    [setSearchString, debouncedSearch],
  );

  return (
    <div className="grow">
      <Input
        className="grow"
        value={searchString}
        onChange={(ev) => handleSearchChange(ev.target.value)}
        placeholder="Search items..."
        isClearable
        onClear={() => {
          setSearchString("");
          fetchItems(false, {});
        }}
      />
    </div>
  );
};
export default ItemSearch;

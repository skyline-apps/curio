import React, { useCallback, useContext, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

import Input from "@web/components/ui/Input";
import { HighlightsContext } from "@web/providers/HighlightsProvider";

interface HighlightSearchProps {
  highlightCount: number;
}

const HighlightSearch: React.FC<HighlightSearchProps> = ({
  highlightCount,
}: HighlightSearchProps): React.ReactElement => {
  const [searchString, setSearchString] = useState<string>("");
  const { fetchHighlights, setSearchQuery } = useContext(HighlightsContext);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearchQuery(value);
    fetchHighlights(false, { search: value });
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
          highlightCount
            ? `Search ${highlightCount} highlights...`
            : "Search highlights..."
        }
        isClearable
        onClear={() => {
          setSearchString("");
          setSearchQuery("");
          fetchHighlights(false, { search: "" });
        }}
      />
    </div>
  );
};

export default HighlightSearch;

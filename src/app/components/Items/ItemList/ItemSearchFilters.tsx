import Labels from "@app/components/Labels";
import Button from "@app/components/ui/Button";
import { Checkbox } from "@app/components/ui/Checkbox";
import { Divider } from "@app/components/ui/Divider";
import Form from "@app/components/ui/Form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@app/components/ui/Popover";
import { Switch } from "@app/components/ui/Switch";
import { ItemsContext } from "@app/providers/Items";
import { useSettings } from "@app/providers/Settings";
import { Label } from "@app/schemas/v1/user/labels";
import { useCallback, useContext, useState } from "react";
import { HiOutlineAdjustmentsHorizontal } from "react-icons/hi2";

const ItemSearchFilters: React.FC = (): React.ReactElement => {
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [selectedLabels, setSelectedLabels] = useState<Label[]>([]);
  const [applyAnd, setApplyAnd] = useState<boolean>(false);
  const { currentFilters, searchQuery, fetchItems } = useContext(ItemsContext);
  const { labels } = useSettings();

  const clearFilters = useCallback(async (): Promise<void> => {
    setIsFavorite(false);
    setSelectedLabels([]);
    setApplyAnd(false);
    await fetchItems(true, {
      search: searchQuery,
      filters: {},
    });
  }, [fetchItems, searchQuery]);

  const handleAddLabel = useCallback(
    async (label: Label): Promise<void> => {
      setSelectedLabels((prev) => [...prev, label]);
    },
    [setSelectedLabels],
  );

  const handleDeleteLabel = useCallback(
    async (labelId: string): Promise<void> => {
      setSelectedLabels((prev) => prev.filter((l) => l.id !== labelId));
    },
    [setSelectedLabels],
  );

  const applyFilters = useCallback(async (): Promise<void> => {
    const operator: "and" | "or" = applyAnd ? "and" : "or";
    const filters = {
      state: currentFilters?.state, // Carry over existing state filter from the page
      isFavorite: isFavorite ? true : undefined,
      labels: {
        ids: selectedLabels.map((l) => l.id),
        operator,
      },
    };
    await fetchItems(true, { search: searchQuery, filters });
  }, [
    isFavorite,
    selectedLabels,
    applyAnd,
    searchQuery,
    currentFilters,
    fetchItems,
  ]);

  const hasFiltersApplied = useCallback((): boolean => {
    return isFavorite || selectedLabels.length > 0 || applyAnd;
  }, [isFavorite, selectedLabels, applyAnd]);

  return (
    <Popover>
      <PopoverTrigger>
        <Button
          variant={hasFiltersApplied() ? "solid" : "flat"}
          color={hasFiltersApplied() ? "primary" : "default"}
          size="sm"
          isIconOnly
        >
          <HiOutlineAdjustmentsHorizontal />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex items-start w-72 p-2">
        <h2 className="text-sm font-semibold mb-2">Advanced filters</h2>
        <Form className="w-full">
          <Checkbox
            id="isFavorite"
            isSelected={isFavorite}
            onValueChange={setIsFavorite}
            size="sm"
          >
            Favorited
          </Checkbox>
          <Divider />
          <h3 className="text-xs">Labels</h3>
          <Labels
            availableLabels={labels || []}
            labels={selectedLabels}
            mode="picker"
            onAdd={handleAddLabel}
            onDelete={handleDeleteLabel}
          />
          <Switch
            id="applyAnd"
            isSelected={applyAnd}
            onValueChange={setApplyAnd}
            size="xs"
          >
            All labels required
          </Switch>
          <div className="flex self-end gap-2">
            <Button
              size="sm"
              variant="light"
              color="danger"
              className="self-end"
              onPress={clearFilters}
            >
              Clear
            </Button>
            <Button size="sm" className="self-end" onPress={applyFilters}>
              Apply
            </Button>
          </div>
        </Form>
      </PopoverContent>
    </Popover>
  );
};

export default ItemSearchFilters;

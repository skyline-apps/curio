import { type Highlight } from "@shared/v1/items/highlights";
import { type Item } from "providers/Items";
import { createContext, useContext } from "react";

export type ItemUpdate = { slug: string } & {
  metadata?: Partial<Item["metadata"]>;
  labels?: Item["labels"];
  highlights?: Highlight[];
};

export type HighlightUpdate = { id: string } & {
  note: string | null;
};

export type CacheContextType = {
  invalidateCache: (slug?: string) => void;
  optimisticUpdateItems: (items: ItemUpdate[]) => void;
  optimisticRemoveItems: (itemSlugs: string[]) => void;
  optimisticUpdateHighlights: (highlights: HighlightUpdate[]) => void;
  optimisticRemoveHighlights: (highlightIds: string[]) => void;
};

export const CacheContext = createContext<CacheContextType>({
  invalidateCache: () => {},
  optimisticUpdateItems: () => {},
  optimisticRemoveItems: () => {},
  optimisticUpdateHighlights: () => {},
  optimisticRemoveHighlights: () => {},
});

export const useCache = (): CacheContextType => useContext(CacheContext);

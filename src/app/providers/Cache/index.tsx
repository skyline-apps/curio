import { type Item } from "@app/providers/Items";
import { type Highlight } from "@app/schemas/v1/items/highlights";
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
  invalidateCache: (slug?: string) => Promise<void>;
  optimisticUpdateItems: (items: ItemUpdate[]) => void;
  optimisticRemoveItems: (itemSlugs: string[]) => void;
  optimisticUpdateHighlights: (highlights: HighlightUpdate[]) => void;
  optimisticRemoveHighlights: (highlightIds: string[]) => void;
};

export const CacheContext = createContext<CacheContextType>({
  invalidateCache: async () => {},
  optimisticUpdateItems: () => {},
  optimisticRemoveItems: () => {},
  optimisticUpdateHighlights: () => {},
  optimisticRemoveHighlights: () => {},
});

export const useCache = (): CacheContextType => useContext(CacheContext);

export const pendingRemovedItemSlugs = new Set<string>();

export function addPendingRemovedItemSlugs(slugs: string[]): void {
  slugs.forEach((slug) => {
    pendingRemovedItemSlugs.add(slug);
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        pendingRemovedItemSlugs.delete(slug);
      }, 5000);
    }
  });
}

export function releasePendingRemovedItemSlugs(slugs: string[]): void {
  slugs.forEach((slug) => pendingRemovedItemSlugs.delete(slug));
}

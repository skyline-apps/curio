"use client";
import { useContext } from "react";

import { UpdateFavoriteResponse } from "@/app/api/v1/items/favorite/validation";
import { UpdateStateResponse } from "@/app/api/v1/items/state/validation";
import { ItemState } from "@/db/schema";
import { ItemsContext } from "@/providers/ItemsProvider";
import { handleAPIResponse } from "@/utils/api";

interface UseItemUpdate {
  updateItemsState: (
    slugs: string[],
    state: ItemState,
  ) => Promise<UpdateStateResponse>;
  updateItemsFavorite: (
    slugs: string[],
    favorite: boolean,
  ) => Promise<UpdateFavoriteResponse>;
}

export const useItemUpdate = (): UseItemUpdate => {
  const { invalidateCache } = useContext(ItemsContext);

  const updateItemsState = async (
    slugs: string[],
    state: ItemState,
  ): Promise<UpdateStateResponse> => {
    return await fetch("/api/v1/items/state", {
      method: "POST",
      body: JSON.stringify({ slugs: slugs.join(","), state }),
    })
      .then(handleAPIResponse<UpdateStateResponse>)
      .then((response) => {
        invalidateCache();
        return response;
      });
  };

  const updateItemsFavorite = async (
    slugs: string[],
    favorite: boolean,
  ): Promise<UpdateFavoriteResponse> => {
    return await fetch("/api/v1/items/favorite", {
      method: "POST",
      body: JSON.stringify({ slugs: slugs.join(","), favorite }),
    })
      .then(handleAPIResponse<UpdateFavoriteResponse>)
      .then((response) => {
        invalidateCache();
        return response;
      });
  };

  return {
    updateItemsState,
    updateItemsFavorite,
  };
};

"use client";
import { UpdateFavoriteResponse } from "@/app/api/v1/items/favorite/validation";
import { UpdateStateResponse } from "@/app/api/v1/items/state/validation";
import { ItemState } from "@/db/schema";
import { handleAPIResponse } from "@/utils/api";

export const updateItemsState = async (
  slugs: string[],
  state: ItemState,
): Promise<UpdateStateResponse> => {
  return await fetch("/api/v1/items/state", {
    method: "POST",
    body: JSON.stringify({ slugs: slugs.join(","), state }),
  }).then(handleAPIResponse<UpdateStateResponse>);
};

export const updateItemsFavorite = async (
  slugs: string[],
  favorite: boolean,
): Promise<UpdateFavoriteResponse> => {
  return await fetch("/api/v1/items/favorite", {
    method: "POST",
    body: JSON.stringify({ slugs: slugs.join(","), favorite }),
  }).then(handleAPIResponse<UpdateFavoriteResponse>);
};

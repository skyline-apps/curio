import { type Item } from "@app/providers/Items";
import { ItemState } from "@app/schemas/db";
import { SwipeAction } from "@app/utils/displayStorage";
import React from "react";
import {
  HiArchiveBox,
  HiCheck,
  HiOutlineArchiveBox,
  HiOutlineEnvelope,
  HiOutlineStar,
  HiOutlineTrash,
  HiStar,
  HiTrash,
} from "react-icons/hi2";

export const SWIPE_THRESHOLD = 75;

export interface SwipeActionDetails {
  action: SwipeAction;
  label: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
}

export function getSwipeActionDetails(
  action: SwipeAction,
  item: Item,
): SwipeActionDetails | null {
  const isRead = item.metadata.lastReadAt !== null;
  const isArchived = item.metadata.state === ItemState.ARCHIVED;
  const isDeleted = item.metadata.state === ItemState.DELETED;
  const isFavorite = !!item.metadata.isFavorite;

  switch (action) {
    case SwipeAction.ARCHIVE:
      return {
        action,
        label: isArchived ? "Unarchive" : "Archive",
        icon: isArchived ? (
          <HiArchiveBox className="text-xl shrink-0" />
        ) : (
          <HiOutlineArchiveBox className="text-xl shrink-0" />
        ),
        bgColor: "bg-success",
        textColor: "text-success-foreground",
      };
    case SwipeAction.DELETE:
      return {
        action,
        label: isDeleted ? "Restore" : "Delete",
        icon: isDeleted ? (
          <HiTrash className="text-xl shrink-0" />
        ) : (
          <HiOutlineTrash className="text-xl shrink-0" />
        ),
        bgColor: "bg-danger",
        textColor: "text-danger-foreground",
      };
    case SwipeAction.MARK_READ:
      return {
        action,
        label: isRead ? "Mark unread" : "Mark read",
        icon: isRead ? (
          <HiOutlineEnvelope className="text-xl shrink-0" />
        ) : (
          <HiCheck className="text-xl shrink-0" />
        ),
        bgColor: "bg-primary",
        textColor: "text-primary-foreground",
      };
    case SwipeAction.FAVORITE:
      return {
        action,
        label: isFavorite ? "Unfavorite" : "Favorite",
        icon: isFavorite ? (
          <HiStar className="text-xl shrink-0" />
        ) : (
          <HiOutlineStar className="text-xl shrink-0" />
        ),
        bgColor: "bg-warning",
        textColor: "text-warning-foreground",
      };
    case SwipeAction.NONE:
    default:
      return null;
  }
}

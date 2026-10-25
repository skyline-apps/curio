import ItemRow from "@app/components/Items/ItemRow";
import Button from "@app/components/ui/Button";
import { FormSection } from "@app/components/ui/Form";
import { Radio, RadioGroup } from "@app/components/ui/Radio";
import { type Item } from "@app/providers/Items";
import { useSwipeSettings } from "@app/providers/Settings";
import { useToast } from "@app/providers/Toast";
import { ItemSource, ItemState, TextDirection } from "@app/schemas/db";
import { DEFAULT_SWIPE_SETTINGS, SwipeAction } from "@app/utils/displayStorage";
import React, { useState } from "react";
import {
  HiArrowPath,
  HiArrowUturnLeft,
  HiOutlineHandThumbUp,
} from "react-icons/hi2";

const SWIPE_ACTION_OPTIONS = [
  {
    value: SwipeAction.ARCHIVE,
    label: "Archive",
    description: "Move item to Archive or restore from Archive",
  },
  {
    value: SwipeAction.DELETE,
    label: "Delete",
    description: "Move item to Trash or restore from Trash",
  },
  {
    value: SwipeAction.MARK_READ,
    label: "Mark as read / unread",
    description: "Toggle read status",
  },
  {
    value: SwipeAction.FAVORITE,
    label: "Favorite / Unfavorite",
    description: "Toggle starred status",
  },
  {
    value: SwipeAction.NONE,
    label: "None",
    description: "Disable swipe gesture in this direction",
  },
];

const INITIAL_SAMPLE_ITEM: Item = {
  id: "swipe-preview-item-id",
  profileItemId: "swipe-preview-profile-item-id",
  slug: "swipe-preview-item",
  url: "https://curi.ooo/demo",
  createdAt: new Date().toISOString(),
  excerpt:
    "Swipe left or right on this card to preview your configured actions.",
  labels: [{ id: "label-demo", name: "Preview", color: "#6366f1" }],
  metadata: {
    title: "Interactive Swipe Preview",
    description:
      "Swipe left or right on this card to preview your configured actions.",
    source: ItemSource.EMAIL,
    thumbnail: null,
    favicon: "",
    textDirection: TextDirection.LTR,
    textLanguage: "en",
    state: ItemState.ACTIVE,
    isFavorite: false,
    lastReadAt: null,
    readingProgress: 0,
    versionName: null,
  },
};

const SwipeSettings: React.FC = () => {
  const { swipeSettings, updateSwipeSettings } = useSwipeSettings();
  const { showToast } = useToast();

  const [sampleItem, setSampleItem] = useState<Item>(INITIAL_SAMPLE_ITEM);
  const [lastActionTriggered, setLastActionTriggered] = useState<string | null>(
    null,
  );

  const handleUpdate = (
    direction: "swipeLeftAction" | "swipeRightAction",
    value: string,
  ): void => {
    const action = value as SwipeAction;
    updateSwipeSettings({ [direction]: action });
    showToast("Swipe settings saved.", {
      disappearing: true,
      dismissable: true,
    });
  };

  const handleResetDefaults = (): void => {
    updateSwipeSettings(DEFAULT_SWIPE_SETTINGS);
    setSampleItem(INITIAL_SAMPLE_ITEM);
    setLastActionTriggered(null);
    showToast("Reset swipe settings to defaults.", {
      disappearing: true,
      dismissable: true,
    });
  };

  const handleSampleAction = (action: SwipeAction): void => {
    let actionName = "";
    setSampleItem((prev) => {
      const next = { ...prev, metadata: { ...prev.metadata } };
      switch (action) {
        case SwipeAction.ARCHIVE:
          const willArchive = next.metadata.state !== ItemState.ARCHIVED;
          next.metadata.state = willArchive
            ? ItemState.ARCHIVED
            : ItemState.ACTIVE;
          actionName = willArchive ? "Archived" : "Unarchived";
          break;
        case SwipeAction.DELETE:
          const willDelete = next.metadata.state !== ItemState.DELETED;
          next.metadata.state = willDelete
            ? ItemState.DELETED
            : ItemState.ACTIVE;
          actionName = willDelete ? "Deleted" : "Restored";
          break;
        case SwipeAction.MARK_READ:
          const willRead = next.metadata.lastReadAt === null;
          next.metadata.lastReadAt = willRead ? new Date().toISOString() : null;
          actionName = willRead ? "Marked as read" : "Marked as unread";
          break;
        case SwipeAction.FAVORITE:
          next.metadata.isFavorite = !next.metadata.isFavorite;
          actionName = next.metadata.isFavorite ? "Favorited" : "Unfavorited";
          break;
        case SwipeAction.NONE:
        default:
          actionName = "None";
          break;
      }
      return next;
    });

    setLastActionTriggered(actionName);
  };

  return (
    <div className="space-y-4" data-testid="swipe-settings-section">
      <FormSection
        title="Swipe Right Action"
        description="Action performed when swiping an item card to the right."
      >
        <RadioGroup
          orientation="vertical"
          value={swipeSettings.swipeRightAction}
          onValueChange={(val) => handleUpdate("swipeRightAction", val)}
          aria-label="Swipe Right Action"
        >
          {SWIPE_ACTION_OPTIONS.map((opt) => (
            <Radio key={`right-${opt.value}`} value={opt.value}>
              <div className="flex flex-col">
                <span className="font-medium text-sm">{opt.label}</span>
                <span className="text-xs text-secondary">
                  {opt.description}
                </span>
              </div>
            </Radio>
          ))}
        </RadioGroup>
      </FormSection>

      <FormSection
        title="Swipe Left Action"
        description="Action performed when swiping an item card to the left."
      >
        <RadioGroup
          orientation="vertical"
          value={swipeSettings.swipeLeftAction}
          onValueChange={(val) => handleUpdate("swipeLeftAction", val)}
          aria-label="Swipe Left Action"
        >
          {SWIPE_ACTION_OPTIONS.map((opt) => (
            <Radio key={`left-${opt.value}`} value={opt.value}>
              <div className="flex flex-col">
                <span className="font-medium text-sm">{opt.label}</span>
                <span className="text-xs text-secondary">
                  {opt.description}
                </span>
              </div>
            </Radio>
          ))}
        </RadioGroup>
      </FormSection>

      <FormSection
        title="Test Gesture Preview"
        description="Swipe the card below left or right to try out your configured gestures (works with touch and mouse drag)."
      >
        <div className="w-full flex flex-col gap-3">
          <div className="w-full border border-divider rounded-md p-2 bg-background-200">
            <ItemRow
              item={sampleItem}
              index={0}
              enablePointerDrag={true}
              onSwipeAction={handleSampleAction}
            />
          </div>

          <div className="flex flex-row items-center justify-between text-xs text-secondary">
            {lastActionTriggered ? (
              <span
                className="text-success font-medium flex items-center gap-1"
                data-testid="swipe-preview-feedback"
              >
                <HiOutlineHandThumbUp className="text-sm" /> Triggered:{" "}
                {lastActionTriggered}
              </span>
            ) : (
              <span>Swipe the card above to test.</span>
            )}
            <Button
              size="sm"
              variant="flat"
              startContent={<HiArrowPath />}
              onPress={() => {
                setSampleItem(INITIAL_SAMPLE_ITEM);
                setLastActionTriggered(null);
              }}
            >
              Reset sample
            </Button>
          </div>
        </div>
      </FormSection>

      <div className="flex justify-end pt-2">
        <Button
          variant="light"
          size="sm"
          startContent={<HiArrowUturnLeft />}
          onPress={handleResetDefaults}
        >
          Reset swipe actions to defaults
        </Button>
      </div>
    </div>
  );
};

export default SwipeSettings;

import Button from "@app/components/ui/Button";
import Icon from "@app/components/ui/Icon";
import { CurrentItemContext } from "@app/providers/CurrentItem";
import type { Item, PublicItem } from "@app/providers/Items";
import { useSettings } from "@app/providers/Settings";
import React, { useCallback, useContext, useState } from "react";
import { HiMiniSparkles } from "react-icons/hi2";
import { Link } from "react-router-dom";

interface PremiumActionsProps {
  item?: Item | PublicItem;
}

const PremiumActions = ({ item }: PremiumActionsProps): React.ReactElement => {
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);
  const { isEditable, fetchItemSummary } = useContext(CurrentItemContext);
  const { isPremium } = useSettings();

  const fetchSummary = useCallback(async () => {
    if (!item) return;
    setIsSummaryLoading(true);
    await fetchItemSummary(
      item.slug,
      isEditable(item) ? item.metadata.versionName : undefined,
    )
      .then(() => {
        setIsSummaryLoading(false);
      })
      .catch(() => {
        setIsSummaryLoading(false);
      });
  }, [item, fetchItemSummary, isEditable]);

  const summaryButton = isPremium ? (
    <Button
      size="sm"
      variant="faded"
      color="primary"
      tooltip="Summarize this item."
      isLoading={isSummaryLoading}
      onPress={fetchSummary}
    >
      <Icon icon={<HiMiniSparkles />} className="text-primary" />
      Summary
    </Button>
  ) : (
    <Button
      size="sm"
      variant="faded"
      color="secondary"
      tooltip={
        <p className="inline">
          <Link to="/settings?section=subscription" className="underline">
            Upgrade to Premium
          </Link>{" "}
          to use this feature.
        </p>
      }
      disabled
      onPress={() => {}}
    >
      <Icon icon={<HiMiniSparkles />} className="text-default" />
      Summary
    </Button>
  );

  return <>{summaryButton}</>;
};

export default PremiumActions;

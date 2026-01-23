import Button from "@app/components/ui/Button";
import Icon from "@app/components/ui/Icon";
import { CurrentItemContext } from "@app/providers/CurrentItem";
import type { Item, PublicItem } from "@app/providers/Items";
import { useSettings } from "@app/providers/Settings";
import { useToast } from "@app/providers/Toast";
import React, { useCallback, useContext } from "react";
import { HiMiniSparkles, HiOutlineDocumentText } from "react-icons/hi2";
import { Link, useNavigate } from "react-router-dom";

interface PremiumActionsProps {
  item?: Item | PublicItem;
}

const PremiumActions = ({ item }: PremiumActionsProps): React.ReactElement => {
  const {
    fetchItemSummary,
    itemSummaryLoading,
    viewingSummary,
    setViewingSummary,
  } = useContext(CurrentItemContext);
  const { isPremium } = useSettings();
  const navigate = useNavigate();

  const fetchSummary = useCallback(async () => {
    if (!item) return;
    if (!window.location.pathname.includes("/item/")) {
      navigate(`/item/${item.slug}?summary=true`);
    }
    await fetchItemSummary();
  }, [item, fetchItemSummary, navigate]);

  const { showToast } = useToast();

  const handlePress = (): void => {
    if (!isPremium) {
      showToast(
        <p className="inline">
          <Link to="/settings?section=subscription" className="underline">
            Upgrade to Premium
          </Link>{" "}
          to use this feature.
        </p>,
      );
      return;
    }

    if (viewingSummary && !itemSummaryLoading) {
      setViewingSummary(false);
    } else {
      fetchSummary();
    }
  };

  const buttonIcon =
    isPremium && viewingSummary && !itemSummaryLoading ? (
      <HiOutlineDocumentText />
    ) : (
      <HiMiniSparkles />
    );
  const buttonText =
    isPremium && viewingSummary && !itemSummaryLoading
      ? "View full"
      : "Summary";
  const buttonColor = !isPremium ? "secondary" : "primary";

  const summaryButton = (
    <Button
      size="sm"
      variant="faded"
      color={buttonColor}
      tooltip={!isPremium ? "Premium feature" : "Summarize this item."}
      isLoading={isPremium && itemSummaryLoading}
      onPress={handlePress}
    >
      <Icon
        icon={buttonIcon}
        className={isPremium ? `text-primary` : `text-default`}
      />
      {buttonText}
    </Button>
  );

  return <>{summaryButton}</>;
};

export default PremiumActions;

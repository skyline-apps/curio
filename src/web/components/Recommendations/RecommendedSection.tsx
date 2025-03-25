import { RecommendationSection } from "@web/app/api/v1/items/recommended/validation";
import ItemCard from "@web/components/Items/ItemCard";
import Icon from "@web/components/ui/Icon";
import { PersonalRecommendationType, RecommendationType } from "@web/db/schema";
import { CurrentItemContext } from "@web/providers/CurrentItemProvider";
import Link from "next/link";
import React, { useContext } from "react";
import { LuMail } from "react-icons/lu";

interface RecommendedSectionProps {
  section: RecommendationSection;
}

const SECTION_HEADERS = {
  [RecommendationType.POPULAR]: "Popular this week",
  [PersonalRecommendationType.NEWSLETTER]: "From your newsletters",
  [PersonalRecommendationType.FAVORITE_AUTHOR]:
    "More from your favorite authors",
  [PersonalRecommendationType.FAVORITES]: "Some old favorites",
};

const RecommendedSection: React.FC<RecommendedSectionProps> = ({
  section,
}: RecommendedSectionProps) => {
  const { sectionType, items } = section;
  const { previewItem } = useContext(CurrentItemContext);

  const getEmptyMessage = (
    sectionType: RecommendationType | PersonalRecommendationType,
  ): React.ReactElement | null => {
    switch (sectionType) {
      case RecommendationType.POPULAR:
        return null;
      case PersonalRecommendationType.NEWSLETTER:
        return (
          <>
            <Icon className="text-secondary-700" icon={<LuMail />} />
            <p>
              Sign up for newsletters with your{" "}
              <Link className="underline" href="/settings">
                curi.ooo email
              </Link>
              .
            </p>
          </>
        );
      case PersonalRecommendationType.FAVORITE_AUTHOR:
        return null;
      case PersonalRecommendationType.FAVORITES:
        return null;
      default:
        return null;
    }
  };

  const emptyMessage = getEmptyMessage(sectionType);

  return items.length || !!emptyMessage ? (
    <div className="p-2">
      <h2 className="text-lg text-secondary mb-2">
        {SECTION_HEADERS[sectionType]}
      </h2>
      <div className="flex flex-row gap-2 overflow-x-auto overflow-y-hidden">
        {!items.length ? (
          <div className="flex items-center text-secondary-700 text-sm gap-2">
            {getEmptyMessage(sectionType)}
          </div>
        ) : (
          items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onPress={() => previewItem(item)}
              hideThumbnail={
                sectionType === PersonalRecommendationType.NEWSLETTER
              }
            />
          ))
        )}
      </div>
    </div>
  ) : null;
};

export default RecommendedSection;

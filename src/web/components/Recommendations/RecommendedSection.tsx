import Link from "next/link";
import React, { useContext } from "react";
import { LuMail } from "react-icons/lu";

import { RecommendationSection } from "@/app/api/v1/items/recommended/validation";
import ItemCard from "@/components/Items/ItemCard";
import Icon from "@/components/ui/Icon";
import { RecommendationSectionType } from "@/db/schema";
import { CurrentItemContext } from "@/providers/CurrentItemProvider";

interface RecommendedSectionProps {
  section: RecommendationSection;
}

const SECTION_HEADERS = {
  [RecommendationSectionType.POPULAR]: "Popular this week",
  [RecommendationSectionType.NEWSLETTER]: "From your newsletters",
  [RecommendationSectionType.FAVORITE_AUTHOR]:
    "More from your favorite authors",
  [RecommendationSectionType.FAVORITES]: "Some old favorites",
};

const RecommendedSection: React.FC<RecommendedSectionProps> = ({
  section,
}: RecommendedSectionProps) => {
  const { section: sectionType, items } = section;
  const { previewItem } = useContext(CurrentItemContext);

  const getEmptyMessage = (
    sectionType: RecommendationSectionType,
  ): React.ReactElement | null => {
    switch (sectionType) {
      case RecommendationSectionType.POPULAR:
        return null;
      case RecommendationSectionType.NEWSLETTER:
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
      case RecommendationSectionType.FAVORITE_AUTHOR:
        return null;
      case RecommendationSectionType.FAVORITES:
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
      <div className="flex flex-row gap-2 overflow-x-auto">
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
            />
          ))
        )}
      </div>
    </div>
  ) : null;
};

export default RecommendedSection;

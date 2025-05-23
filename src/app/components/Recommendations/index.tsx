import Spinner from "@app/components/ui/Spinner";
import React, { useEffect, useState } from "react";

import RecommendedSection from "./RecommendedSection";
import { useRecommendations } from "./useRecommendations";

const Recommendations: React.FC = () => {
  const [initializing, setInitializing] = useState<boolean>(true);
  const { recommendations, isLoading, error, fetchItems } =
    useRecommendations();

  useEffect(() => {
    fetchItems(true);
    setInitializing(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (initializing || (isLoading && !recommendations.length)) {
    return <Spinner centered />;
  }

  if (!recommendations.length || error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-sm text-secondary-700">
        Oops! There was an issue loading this page.
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {recommendations.map((section) => (
        <RecommendedSection key={section.sectionType} section={section} />
      ))}
    </div>
  );
};

export default Recommendations;

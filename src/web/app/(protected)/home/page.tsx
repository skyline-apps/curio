"use client";
import React, { useContext, useEffect } from "react";

import Recommendations from "@/components/Recommendations";
import { CurrentItemContext } from "@/providers/CurrentItemProvider";

const HomePage: React.FC = () => {
  const { clearSelectedItems } = useContext(CurrentItemContext);

  useEffect(() => {
    clearSelectedItems();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex-1 w-full h-full flex flex-col p-2">
      <Recommendations />
    </div>
  );
};

export default HomePage;

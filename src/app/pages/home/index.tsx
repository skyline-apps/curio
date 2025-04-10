import Recommendations from "@app/components/Recommendations";
import { CurrentItemContext } from "@app/providers/CurrentItem";
import React, { useContext, useEffect } from "react";

const HomePage: React.FC = () => {
  const { clearSelectedItems } = useContext(CurrentItemContext);

  useEffect(() => {
    clearSelectedItems();
    document.title = `Curio - Home`;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex-1 w-full h-full flex flex-col p-2">
      <Recommendations />
    </div>
  );
};

export default HomePage;

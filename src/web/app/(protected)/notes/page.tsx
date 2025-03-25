"use client";
import React, { useContext, useEffect } from "react";

import HighlightList from "@web/components/Highlights/HighlightList";
import { HighlightsContext } from "@web/providers/HighlightsProvider";

const NotesPage: React.FC = () => {
  const { fetchHighlights } = useContext(HighlightsContext);

  useEffect(() => {
    fetchHighlights(true);
    document.title = `Curio - Notes`;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex-1 w-full h-full flex flex-col">
      <HighlightList />
    </div>
  );
};

export default NotesPage;

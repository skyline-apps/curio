"use client";
import { useParams } from "next/navigation";
import React, { useContext, useEffect } from "react";

import MarkdownViewer from "@/components/MarkdownViewer";
import Spinner from "@/components/ui/Spinner";
import { CurrentItemContext } from "@/providers/CurrentItemProvider";

const ItemPage: React.FC = () => {
  const { fetchContent, loading, loadingError, currentItem } =
    useContext(CurrentItemContext);
  const { slug } = useParams();

  useEffect(() => {
    if (typeof slug === "string") {
      fetchContent(slug);
    } else if (Array.isArray(slug)) {
      fetchContent(slug[0]);
    }
  }, [fetchContent, slug]);

  return (
    <div className="flex-1 w-full h-full flex flex-col">
      {loading ? (
        <Spinner centered />
      ) : loadingError ? (
        <>
          <p className="text-sm text-danger">{loadingError}</p>
        </>
      ) : (
        currentItem && (
          <MarkdownViewer className="max-w-5xl p-4">
            {currentItem.content}
          </MarkdownViewer>
        )
      )}
    </div>
  );
};

export default ItemPage;

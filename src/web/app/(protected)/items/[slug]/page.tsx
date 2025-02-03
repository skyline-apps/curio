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

  const { metadata } = currentItem?.item || {};

  return (
    <div className="flex-1 w-full h-full flex flex-col">
      {loading ? (
        <Spinner centered />
      ) : currentItem ? (
        <div className="max-w-4xl mx-auto">
          <h1 className="text-lg font-medium mb-2">{metadata?.title}</h1>
          {loadingError ? (
            <p className="text-sm text-danger">{loadingError}</p>
          ) : (
            <MarkdownViewer className="py-4">
              {currentItem.content}
            </MarkdownViewer>
          )}
          <hr className="my-4" />
          <p className="text-sm text-secondary italic py-4">
            {metadata?.savedAt &&
              `Saved on ${new Date(metadata.savedAt).toLocaleString()}`}
          </p>
        </div>
      ) : (
        loadingError && <p className="text-sm text-danger">{loadingError}</p>
      )}
    </div>
  );
};

export default ItemPage;

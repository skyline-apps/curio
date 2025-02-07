"use client";
import { useParams } from "next/navigation";
import React, { useContext, useEffect } from "react";

import MarkdownViewer from "@/components/Article/MarkdownViewer";
import Spinner from "@/components/ui/Spinner";
import { CurrentItemContext } from "@/providers/CurrentItemProvider";

const ItemPage: React.FC = () => {
  const { fetchContent, loading, loadingError, loadedItem } =
    useContext(CurrentItemContext);
  const { slug } = useParams();

  useEffect(() => {
    if (typeof slug === "string") {
      fetchContent(slug);
    } else if (Array.isArray(slug)) {
      fetchContent(slug[0]);
    }
  }, [fetchContent, slug]);

  const { metadata } = loadedItem?.item || {};

  return (
    <div className="flex-1 w-full h-full flex flex-col">
      {loading ? (
        <Spinner centered />
      ) : loadedItem ? (
        <div className="w-full lg:w-4xl max-w-4xl mx-auto">
          <h1 className="text-lg font-medium mb-2">{metadata?.title}</h1>
          {loadingError ? (
            <p className="text-sm text-danger">{loadingError}</p>
          ) : loadedItem.content ? (
            <MarkdownViewer className="py-4">
              {loadedItem.content}
            </MarkdownViewer>
          ) : (
            <p className="text-sm text-secondary italic py-4">
              Content unavailable.
            </p>
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

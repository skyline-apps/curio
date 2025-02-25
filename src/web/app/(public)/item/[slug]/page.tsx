"use client";
import { useParams } from "next/navigation";
import React, { useContext, useEffect } from "react";

import Article from "@/components/Article";
import { Progress } from "@/components/ui/Progress";
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
    <>
      {loading && (
        <Progress
          aria-label="Loading..."
          size="sm"
          isIndeterminate
          classNames={{
            base: "mb-4 absolute top-0 left-0",
            track: "rounded-none",
            indicator: "bg-gradient-to-r from-success to-primary",
          }}
        />
      )}
      <div className="flex-1 w-full h-full flex flex-col">
        {!loading && loadedItem ? (
          <div className="w-full lg:w-4xl max-w-4xl self-start pl-6 mx-auto">
            <h1 className="text-lg font-medium mb-2">{metadata?.title}</h1>
            {loadingError ? (
              <p className="text-sm text-danger">{loadingError}</p>
            ) : loadedItem.content ? (
              <Article content={loadedItem.content} />
            ) : (
              <p className="text-sm text-secondary italic py-4">
                Content unavailable.
              </p>
            )}
            <hr className="border-secondary my-4" />
            <p className="text-sm text-secondary italic py-4">
              {metadata?.savedAt &&
                `Saved on ${new Date(metadata.savedAt).toLocaleString()}`}
            </p>
          </div>
        ) : (
          loadingError && <p className="text-sm text-danger">{loadingError}</p>
        )}
      </div>
    </>
  );
};

export default ItemPage;

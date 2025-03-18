"use client";

import { useParams } from "next/navigation";
import React, { useContext, useEffect } from "react";

import Article from "@/components/Article";
import {
  displayFontSizeClass,
  displayHeaderSizeClass,
  getDisplayFontClass,
} from "@/components/Article/displaySettings";
import { Progress } from "@/components/ui/Progress";
import { DisplayFont, DisplayFontSize, TextDirection } from "@/db/schema";
import { CurrentItemContext } from "@/providers/CurrentItemProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { cn } from "@/utils/cn";

const ItemPage: React.FC = () => {
  const { fetchContent, loading, loadingError, loadedItem } =
    useContext(CurrentItemContext);
  const { slug } = useParams();
  const { settings } = useSettings();
  const { displayFont, displayFontSize } = settings || {};

  const fontClass = getDisplayFontClass(
    displayFont || DisplayFont.SANS,
    loadedItem?.item.metadata.textLanguage || "",
  );

  const headerSizeClass =
    displayHeaderSizeClass[displayFontSize || DisplayFontSize.MD];
  const proseSizeClass =
    displayFontSizeClass[displayFontSize || DisplayFontSize.MD];

  useEffect(() => {
    if (typeof slug === "string") {
      fetchContent(slug);
    } else if (Array.isArray(slug)) {
      fetchContent(slug[0]);
    }
  }, [fetchContent, slug]);

  const { metadata } = loadedItem?.item || {};

  useEffect(() => {
    if (metadata?.title) {
      document.title = `Curio - ${metadata.title}`;
    }
  }, [metadata?.title]);

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
          <div
            className={cn(
              "w-full lg:w-4xl max-w-4xl self-start pl-6 pt-4 mx-auto",
              fontClass,
            )}
          >
            <h1
              className={cn("font-medium mb-2", headerSizeClass)}
              dir={metadata?.textDirection}
            >
              {metadata?.title}
            </h1>
            {loadingError ? (
              <p className="text-sm text-danger">{loadingError}</p>
            ) : loadedItem.content ? (
              <Article
                content={loadedItem.content}
                className={cn(proseSizeClass)}
              />
            ) : (
              <p className="text-sm text-secondary italic py-4">
                Content unavailable.
              </p>
            )}
            <hr className="border-secondary my-4" />
            <p
              className={cn(
                "text-sm text-secondary italic py-4",
                metadata?.textDirection === TextDirection.RTL && "text-right",
              )}
            >
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

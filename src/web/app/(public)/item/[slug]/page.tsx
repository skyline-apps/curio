"use client";

import Article from "@web/components/Article";
import {
  displayFontSizeClass,
  displayHeaderSizeClass,
  getDisplayFontClass,
} from "@web/components/Article/displaySettings";
import KeyboardShortcuts from "@web/components/KeyboardShortcuts";
import { Progress } from "@web/components/ui/Progress";
import { DisplayFont, DisplayFontSize, TextDirection } from "@web/db/schema";
import { CurrentItemContext } from "@web/providers/CurrentItemProvider";
import { useSettings } from "@web/providers/SettingsProvider";
import { cn } from "@web/utils/cn";
import { useParams } from "next/navigation";
import React, { useContext, useEffect, useMemo } from "react";

const ItemPage: React.FC = () => {
  const { fetchContent, loading, loadingError, loadedItem } =
    useContext(CurrentItemContext);
  const { slug } = useParams();
  const { settings } = useSettings();
  const { displayFont, displayFontSize } = settings || {};
  const metadata = loadedItem?.item.metadata;

  const fontClass = getDisplayFontClass(
    displayFont || DisplayFont.SANS,
    metadata?.textLanguage || "",
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

  useEffect(() => {
    if (metadata?.title) {
      document.title = `Curio - ${metadata.title}`;
    }
  }, [metadata?.title]);

  const articleContent = useMemo(() => {
    if (!loadedItem?.content || !metadata?.title) return null;

    return (
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
        <Article content={loadedItem?.content} className={cn(proseSizeClass)} />
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
    );
  }, [
    loadedItem?.content,
    metadata?.title,
    metadata?.textDirection,
    metadata?.savedAt,
    headerSizeClass,
    proseSizeClass,
    fontClass,
  ]);

  return (
    <>
      <KeyboardShortcuts />
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
          loadingError ? (
            <p className="text-sm text-danger">{loadingError}</p>
          ) : loadedItem.content ? (
            articleContent
          ) : (
            <p className="text-sm text-secondary italic py-4">
              Content unavailable.
            </p>
          )
        ) : (
          loadingError && <p className="text-sm text-danger">{loadingError}</p>
        )}
      </div>
    </>
  );
};

export default ItemPage;

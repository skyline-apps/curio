import Article from "@app/components/Article";
import {
  displayFontSizeClass,
  displayHeaderSizeClass,
  getDisplayFontClass,
} from "@app/components/Article/displaySettings";
import KeyboardShortcuts from "@app/components/KeyboardShortcuts";
import { Progress } from "@app/components/ui/Progress";
import { useAppLayout } from "@app/providers/AppLayout";
import { CurrentItemContext } from "@app/providers/CurrentItem";
import { useSettings } from "@app/providers/Settings";
import { DisplayFont, DisplayFontSize, TextDirection } from "@app/schemas/db";
import { cn } from "@app/utils/cn";
import React, { useContext, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";

const ItemPage: React.FC = () => {
  const { fetchContent, loading, loadingError, loadedItem } =
    useContext(CurrentItemContext);
  const { slug } = useParams();
  const { settings } = useSettings();
  const { updateAppLayout } = useAppLayout();
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
    if (typeof window !== "undefined") {
      if (window.innerWidth < 1048) {
        updateAppLayout({ rightSidebarOpen: false, leftSidebarOpen: false });
      } else {
        updateAppLayout({ rightSidebarOpen: true });
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
          "w-full lg:w-4xl max-w-4xl self-start pl-2 pt-4 mx-auto",
          fontClass,
        )}
      >
        <h1
          className={cn("font-medium mb-2 select-text", headerSizeClass)}
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
        {!loading &&
          (loadingError ? (
            <p className="text-sm text-danger p-4">{loadingError}</p>
          ) : loadedItem?.content ? (
            articleContent
          ) : (
            <p className="text-sm text-secondary italic p-4">
              Content unavailable.
            </p>
          ))}
      </div>
    </>
  );
};

export default ItemPage;

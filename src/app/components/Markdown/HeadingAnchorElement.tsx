import Button from "@app/components/ui/Button";
import { useToast } from "@app/providers/Toast";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HiMiniLink } from "react-icons/hi2";

import { childrenToText } from "./utils";

interface HeadingAnchorElementProps {
  tag: HeadingTag;
  children: React.ReactNode;
  anchor: string;
  portalRef?: React.RefObject<HTMLElement | null>;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
  "data-start-offset"?: number;
  "data-end-offset"?: number;
}

const HeadingAnchorElement = React.forwardRef<
  HTMLHeadingElement,
  HeadingAnchorElementProps
>(
  (
    {
      tag,
      children,
      anchor,
      portalRef,
      className,
      style,
      "data-start-offset": dataStartOffset,
      "data-end-offset": dataEndOffset,
    },
    ref,
  ) => {
    const { showToast } = useToast();
    const HeadingTag = tag;
    const childrenText = childrenToText(children);
    const [portalMounted, setPortalMounted] = useState<boolean>(false);

    useEffect(() => {
      // Force a re-render when the portal ref becomes available
      if (portalRef?.current) {
        setPortalMounted(true);
      }
    }, [portalRef]);

    return (
      <>
        <HeadingTag
          id={anchor}
          ref={ref}
          className={className}
          style={style}
          data-start-offset={dataStartOffset}
          data-end-offset={dataEndOffset}
        >
          {children}
          <Button
            size="xs"
            variant="ghost"
            tooltip="Copy link to heading"
            onPress={() => {
              const url = new URL(window.location.href);
              url.hash = `#${anchor}`;
              navigator.clipboard.writeText(url.toString());
              showToast("Link copied to clipboard", { disappearing: true });
            }}
            className="ml-2"
          >
            <HiMiniLink className="text-primary" />
          </Button>
        </HeadingTag>
        {portalRef?.current &&
          portalMounted &&
          createPortal(
            <a
              className="truncate"
              role="button"
              style={{ cursor: "pointer" }}
              href={`#${anchor}`}
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById(anchor);
                if (element) {
                  element.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                  // Update URL hash without jumping
                  window.history.replaceState(null, "", `#${anchor}`);
                }
              }}
            >
              {childrenText}
            </a>,
            portalRef.current,
          )}
      </>
    );
  },
);

HeadingAnchorElement.displayName = "HeadingAnchorElement";

export default HeadingAnchorElement;

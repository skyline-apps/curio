import Button from "@app/components/ui/Button";
import { useAppLayout } from "@app/providers/AppLayout";
import {
  SWIPE_THRESHOLD_DISTANCE,
  SWIPE_THRESHOLD_VELOCITY,
} from "@app/providers/AppLayout/useSidebarSwipe";
import { cn } from "@app/utils/cn";
import { motion } from "framer-motion";
import React, { useRef } from "react";
import { HiMiniBars4 } from "react-icons/hi2";
import { useLocation } from "react-router-dom";
import { useDrag } from "react-use-gesture";

import { AppPageContext } from "./";

export const AppPageProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const articleFixedInfoRef = useRef<HTMLDivElement>(null);
  const [hasChildren, setHasChildren] = React.useState(false);
  const [showArticleFixedInfo, setShowArticleFixedInfo] = React.useState(false);
  const { pathname } = useLocation();
  const {
    appLayout: { leftSidebarOpen, rightSidebarOpen },
    updateAppLayout,
  } = useAppLayout();

  React.useEffect(() => {
    const node = articleFixedInfoRef.current;
    if (!node) return;
    const update = (): void => {
      const hasNodes = !!node && node.hasChildNodes();
      setHasChildren(hasNodes);
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(node, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
    };
  }, []);

  React.useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const onScroll = (): void => setShowArticleFixedInfo(false);
    node.addEventListener("scroll", onScroll);
    return () => node.removeEventListener("scroll", onScroll);
  }, [containerRef]);

  const bind = useDrag(
    ({ axis, last, movement: [mx], velocity, direction: [dx] }) => {
      if (axis === "y") return;
      if (!last) return;
      const isSwipeRight = dx > 0;
      const isSwipeLeft = dx < 0;
      const meetsThreshold =
        Math.abs(mx) > SWIPE_THRESHOLD_DISTANCE ||
        velocity > SWIPE_THRESHOLD_VELOCITY;

      if (!meetsThreshold) return;

      if (isSwipeRight) {
        if (!leftSidebarOpen) {
          updateAppLayout({ leftSidebarOpen: true });
        } else if (rightSidebarOpen) {
          updateAppLayout({ rightSidebarOpen: false });
        }
      } else if (isSwipeLeft) {
        if (!rightSidebarOpen) {
          updateAppLayout({ rightSidebarOpen: true });
        } else if (leftSidebarOpen) {
          updateAppLayout({ leftSidebarOpen: false });
        }
      }
    },
    { axis: "x", filterTaps: true, preventDefault: true },
  );

  return (
    <AppPageContext.Provider value={{ containerRef, articleFixedInfoRef }}>
      <div className="relative w-full h-full overflow-x-hidden">
        <motion.div
          ref={containerRef}
          {...bind()}
          className="h-full p-2 overflow-y-auto grow"
          key={pathname}
          initial={{ opacity: 0.8, x: -2 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            scrollBehavior: "smooth",
          }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          {children}
        </motion.div>
        {hasChildren && !showArticleFixedInfo && (
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            className="absolute top-2 right-3"
            onPress={() => setShowArticleFixedInfo((v) => !v)}
            onMouseEnter={() => setShowArticleFixedInfo(true)}
          >
            <HiMiniBars4 />
          </Button>
        )}
        <motion.div
          className={cn(
            "absolute text-right top-0 right-0 lg:right-80 w-80 flex flex-col items-end gap-1 p-2 text-xs max-h-80 overflow-x-hidden overflow-y-auto text-secondary-600 *:bg-background-700 *:shrink-0",
            rightSidebarOpen ? "lg:right-0" : "lg:right-0",
            !showArticleFixedInfo ? "pointer-events-none" : "",
          )}
          ref={articleFixedInfoRef}
          initial={false}
          animate={{
            opacity: showArticleFixedInfo ? 1 : 0,
            x: showArticleFixedInfo ? 0 : 20,
          }}
          transition={{ duration: 0.2 }}
        />
      </div>
    </AppPageContext.Provider>
  );
};

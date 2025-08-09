import Button from "@app/components/ui/Button";
import Icon from "@app/components/ui/Icon";
import { useAppLayout } from "@app/providers/AppLayout";
import { useSidebarSwipe } from "@app/providers/AppLayout/useSidebarSwipe";
import { cn } from "@app/utils/cn";
import React from "react";
import { HiChevronDoubleLeft, HiChevronDoubleRight } from "react-icons/hi2";

interface RightSidebarProps {
  content?: React.ReactNode;
  endContent?: React.ReactNode;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ content, endContent }) => {
  const {
    appLayout: { rightSidebarOpen },
    updateAppLayout,
  } = useAppLayout();

  const sidebarOpen = rightSidebarOpen;

  const bind = useSidebarSwipe({
    isOpen: sidebarOpen,
    onOpen: () => updateAppLayout({ rightSidebarOpen: true }),
    onClose: () => updateAppLayout({ rightSidebarOpen: false }),
    side: "right",
  });

  const toggleSidebar = (): void => {
    updateAppLayout({ rightSidebarOpen: !sidebarOpen });
  };

  return (
    <aside
      {...bind()}
      id="right-sidebar"
      className={cn(
        "flex flex-col justify-between border-l-1 border-divider transition-all duration-300 ease-in-out fixed right-0 top-0 bottom-0 lg:relative bg-background-400 shadow-lg z-20",
        "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] h-full",
        rightSidebarOpen
          ? "w-80 max-w-full pointer-events-auto"
          : "w-0 pointer-events-none lg:w-16",
      )}
    >
      <div className="flex-1 overflow-hidden relative">
        <div
          className={cn(
            "h-full w-80 max-w-full transition-all duration-300 ease-in-out transform",
            rightSidebarOpen
              ? "translate-x-0 opacity-100"
              : "translate-x-full opacity-0 invisible",
          )}
        >
          {content}
        </div>
      </div>
      {endContent}
      <Button
        isIconOnly
        size="sm"
        variant="flat"
        onPress={toggleSidebar}
        aria-label={rightSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        className={cn(
          "flex-none m-2 z-10 pointer-events-auto",
          rightSidebarOpen
            ? ""
            : "fixed right-0 bottom-[env(safe-area-inset-bottom)] lg:bottom-0 lg:relative lg:self-center",
        )}
      >
        <Icon
          icon={
            rightSidebarOpen ? (
              <HiChevronDoubleRight />
            ) : (
              <HiChevronDoubleLeft />
            )
          }
        />
      </Button>
    </aside>
  );
};

export default RightSidebar;

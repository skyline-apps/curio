import Button from "@app/components/ui/Button";
import Icon from "@app/components/ui/Icon";
import { useAppLayout } from "@app/providers/AppLayout";
import { useSidebarSwipe } from "@app/providers/AppLayout/useSidebarSwipe";
import { cn } from "@app/utils/cn";
import React from "react";
import { HiChevronDoubleLeft, HiChevronDoubleRight } from "react-icons/hi2";

interface LeftSidebarProps {
  content?: React.ReactNode; // Top of the sidebar
  endContent?: React.ReactNode; // Pushed to the bottom of the sidebar
  bottomContent?: React.ReactNode; // Adjacent to toggle button
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  content,
  endContent,
  bottomContent,
}) => {
  const { appLayout, updateAppLayout } = useAppLayout();

  const sidebarOpen = appLayout.leftSidebarOpen;

  const toggleSidebar = (): void => {
    updateAppLayout({
      leftSidebarOpen: !sidebarOpen,
    });
  };

  const bind = useSidebarSwipe({
    isOpen: sidebarOpen,
    onOpen: () => updateAppLayout({ leftSidebarOpen: true }),
    onClose: () => updateAppLayout({ leftSidebarOpen: false }),
    side: "left",
  });

  return (
    <aside
      {...bind()}
      className={cn(
        "flex flex-col justify-between h-full border-r-1 border-divider transition-all duration-300 ease-in-out",
        "w-16 md:w-64",
        { "overflow-hidden w-0 md:w-16": !sidebarOpen },
      )}
    >
      {content}
      <div className="flex flex-col overflow-hidden">
        {endContent}
        <div
          className={cn(
            "flex items-center min-h-12 justify-end overflow-hidden",
            sidebarOpen ? "flex-col md:flex-row gap-2" : "flex-col",
          )}
        >
          {bottomContent}

          <Button
            isIconOnly
            size="sm"
            variant="flat"
            onPress={toggleSidebar}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className={cn(
              "flex-none m-2 z-10",
              sidebarOpen
                ? ""
                : "fixed left-0 bottom-[env(safe-area-inset-bottom)] md:bottom-0 md:relative",
            )}
          >
            <Icon
              icon={
                sidebarOpen ? <HiChevronDoubleLeft /> : <HiChevronDoubleRight />
              }
            />
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default LeftSidebar;

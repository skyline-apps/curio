"use client";
import React, { useContext } from "react";
import { HiChevronDoubleLeft, HiChevronDoubleRight } from "react-icons/hi2";

import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { CurrentItemContext } from "@/providers/CurrentItemProvider";
import { cn } from "@/utils/cn";

import ItemMetadata from "./ItemMetadata";

const RightSidebar: React.FC = () => {
  const { currentItem, sidebarOpen, setSidebarOpen } =
    useContext(CurrentItemContext);

  const toggleSidebar = (): void => {
    setSidebarOpen(!sidebarOpen);
  };

  // TODO: Add transition for content appearing
  return (
    <aside
      className={cn(
        "h-screen border-l-1 border-divider transition-all duration-300 ease-in-out absolute right-0 md:relative bg-background",
        sidebarOpen ? "w-72" : "w-16",
      )}
    >
      <div className="flex flex-col justify-between h-full">
        <div className="grow">
          {sidebarOpen && <ItemMetadata item={currentItem?.item} />}
        </div>
        <Button
          isIconOnly
          variant="light"
          onPress={toggleSidebar}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          className={cn("flex-none w-10 m-2 flex")}
        >
          <Icon
            icon={
              sidebarOpen ? <HiChevronDoubleRight /> : <HiChevronDoubleLeft />
            }
          />
        </Button>
      </div>
    </aside>
  );
};

export default RightSidebar;

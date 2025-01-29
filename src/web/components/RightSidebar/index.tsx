"use client";
import React, { useState } from "react";
import { HiChevronDoubleLeft, HiChevronDoubleRight } from "react-icons/hi2";

import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { cn } from "@/utils/cn";

const RightSidebar: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  const toggleSidebar = (): void => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <aside
      className={cn(
        "h-screen border-l-1 border-divider transition-all duration-300 ease-in-out absolute right-0 md:relative bg-background",
        sidebarOpen ? "w-72" : "w-16",
      )}
    >
      <div className="flex flex-col justify-between h-full">
        <div className="grow">sidebar</div>
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

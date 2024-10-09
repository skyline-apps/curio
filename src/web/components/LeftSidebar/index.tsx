"use client";
import { usePathname, useRouter } from "next/navigation";
import React, { useContext, useState } from "react";
import { HiArrowRightOnRectangle, HiOutlineCog6Tooth } from "react-icons/hi2";

import Button from "@/components/Button";
import CurioBrand from "@/components/CurioBrand";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@/components/Dropdown";
import Icon from "@/components/Icon";
import { Tab, Tabs } from "@/components/Tabs";
import { User } from "@/components/User";
import { useLogout } from "@/hooks/useLogout";
import { UserContext } from "@/providers/UserProvider";
import { cn } from "@/utils/cn";

const LeftSidebar: React.FC = () => {
  const router = useRouter();
  const { user } = useContext(UserContext);
  // TODO(Kim): Implement collapsible and mobile-friendly sidebar
  const [sidebarOpen] = useState(true);
  const pathname = usePathname();

  const handleLogout = useLogout();

  const handleSettings = (): void => {
    router.push("/settings");
  };

  // TODO(Kim): Fix animation on tabs
  return (
    <aside
      className={cn(
        "flex flex-col justify-between flex-none h-screen w-64 border-r-1 border-divider transform transition-transform duration-300 ease-in-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      )}
    >
      <div className="grow">
        <div className="flex flex-none h-16 items-center px-4">
          <CurioBrand />
        </div>
        <nav className="flex flex-col p-2">
          <Tabs
            classNames={{ tab: "justify-start" }}
            isVertical
            fullWidth
            variant="light"
            selectedKey={pathname}
            aria-label="Navigation"
          >
            <Tab key="/home" href="/home" title="Home" />
            <Tab key="/archive" href="/archive" title="Archive" />
            <Tab key="/favorites" href="/favorites" title="Favorites" />
          </Tabs>
        </nav>
      </div>
      <div className="flex-none">
        <Dropdown>
          <DropdownTrigger className="mx-auto py-2">
            <Button variant="light" disableRipple className="w-full h-full">
              <User name={user.username} description={user.email} />
            </Button>
          </DropdownTrigger>
          <DropdownMenu>
            <DropdownItem
              startContent={<Icon icon={<HiOutlineCog6Tooth />} />}
              onPress={handleSettings}
            >
              Settings
            </DropdownItem>
            <DropdownItem
              startContent={<Icon icon={<HiArrowRightOnRectangle />} />}
              onPress={handleLogout}
            >
              Log Out
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    </aside>
  );
};

export default LeftSidebar;

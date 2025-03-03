"use client";
import { Navbar, NavbarBrand, NavbarContent } from "@heroui/navbar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useContext } from "react";
import { HiOutlineUser } from "react-icons/hi2";

import { CurioBrand } from "@/components/CurioBrand";
import Button from "@/components/ui/Button";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@/components/ui/Dropdown";
import Icon from "@/components/ui/Icon";
import { useLogout } from "@/hooks/useLogout";
import { UserContext } from "@/providers/UserProvider";

const CurioNavbar: React.FC = () => {
  const router = useRouter();
  const { user } = useContext(UserContext);
  const handleLogout = useLogout();

  const handleLogin = (): void => {
    router.push("/login");
  };

  return (
    <Navbar classNames={{ wrapper: "px-4" }} isBordered maxWidth="full">
      <NavbarBrand>
        <CurioBrand />
      </NavbarBrand>
      <NavbarContent justify="end">
        {user.id ? (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly variant="flat">
                <Icon icon={<HiOutlineUser />} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem
                key="logout"
                onPress={handleLogout}
                description={user.username}
              >
                Log Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ) : (
          <Link href="/login">
            <Button onPress={handleLogin}>Log In</Button>
          </Link>
        )}
      </NavbarContent>
    </Navbar>
  );
};

export default CurioNavbar;

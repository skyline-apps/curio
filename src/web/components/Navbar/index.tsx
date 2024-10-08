"use client";
import { Navbar, NavbarBrand, NavbarContent } from "@nextui-org/navbar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useContext } from "react";
import { HiOutlineUser } from "react-icons/hi2";

import Button from "@/components/Button";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@/components/Dropdown";
import { UserContext } from "@/providers/UserProvider";
import CurioColored from "@/public/logo/curio_colored.svg";
import { createLogger } from "@/utils/logger";
import { createClient } from "@/utils/supabase/client";

const log = createLogger("Navbar");

const CurioNavbar: React.FC = () => {
  const router = useRouter();
  const { user, clearUser } = useContext(UserContext);
  const supabase = createClient();

  const handleLogin = (): void => {
    router.push("/login");
  };

  const handleSettings = (): void => {
    router.push("/settings");
  };

  const handleLogout = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      log.error("Error with logout:", error);
      return;
    }
    // Clear the current user from the UserContext.
    clearUser();
    // Redirect to the landing page.
    router.push("/");
  };

  const homeLink = user.id ? "/home" : "/";

  return (
    <Navbar isBordered maxWidth="full">
      <NavbarBrand>
        <Link href={homeLink}>
          <CurioColored height="56px" />
        </Link>
      </NavbarBrand>
      <NavbarContent justify="end">
        {user.id ? (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly>
                <HiOutlineUser />
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem onPress={handleSettings}>Settings</DropdownItem>
              <DropdownItem onPress={handleLogout} description={user.username}>
                Log Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ) : (
          <Link href="/login">
            <Button onClick={handleLogin}>Log In</Button>
          </Link>
        )}
      </NavbarContent>
    </Navbar>
  );
};

export default CurioNavbar;

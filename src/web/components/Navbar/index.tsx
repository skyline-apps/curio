"use client";
import { Navbar, NavbarBrand, NavbarContent } from "@nextui-org/navbar";
import React, { useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@/components/Dropdown";
import Button from "@/components/Button";
import { createClient } from "@/utils/supabase/client";
import CurioColored from "@/public/logo/curio_colored.svg";
import { UserContext } from "@/providers/UserProvider";

const CurioNavbar: React.FC = () => {
  const router = useRouter();
  const { user, clearUser } = useContext(UserContext);
  const supabase = createClient();

  const handleLogin = (): void => {
    router.push("/login");
  };

  const handleLogout = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
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
              <Button>{user.username}</Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem onPress={handleLogout}>Log Out</DropdownItem>
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

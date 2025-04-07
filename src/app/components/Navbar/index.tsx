import { CurioBrand } from "@app/components/CurioBrand";
import Button from "@app/components/ui/Button";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@app/components/ui/Dropdown";
import Icon from "@app/components/ui/Icon";
import { useUser } from "@app/providers/User";
import { Navbar, NavbarBrand, NavbarContent } from "@heroui/navbar";
import React from "react";
import { HiOutlineUser } from "react-icons/hi2";

const CurioNavbar: React.FC = () => {
  const { user, handleLogout } = useUser();

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
                Log out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ) : (
          <Button href="/login">Log in</Button>
        )}
      </NavbarContent>
    </Navbar>
  );
};

export default CurioNavbar;

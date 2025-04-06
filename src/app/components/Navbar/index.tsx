import { CurioBrand } from "@app/components/CurioBrand";
import Button from "@app/components/ui/Button";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@app/components/ui/Dropdown";
import Icon from "@app/components/ui/Icon";
import { UserContext } from "@app/providers/User";
import { Navbar, NavbarBrand, NavbarContent } from "@heroui/navbar";
import React, { useContext } from "react";
import { HiOutlineUser } from "react-icons/hi2";

const CurioNavbar: React.FC = () => {
  const { user } = useContext(UserContext);

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
                onPress={() => void /* TODO: Implement logout */}
                description={user.username}
              >
                Log Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ) : (
          <Button href="/login">Log In</Button>
        )}
      </NavbarContent>
    </Navbar>
  );
};

export default CurioNavbar;

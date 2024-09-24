"use client";
import { Navbar, NavbarBrand, NavbarContent } from "@nextui-org/navbar";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Button from "@/components/Button";

const CurioNavbar: React.FC = () => {
  const router = useRouter();
  const handleLogin = (): void => {
    router.push("/login");
  };

  return (
    <Navbar isBordered maxWidth="full">
      <NavbarBrand>
        <Link href="/">
          <h1 className="text-2xl font-bold">Curio</h1>
        </Link>
      </NavbarBrand>
      <NavbarContent justify="end">
        <Link href="/login">
          <Button onClick={handleLogin}>Log In</Button>
        </Link>
      </NavbarContent>
    </Navbar>
  );
};

export default CurioNavbar;

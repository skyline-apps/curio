import Link from "next/link";
import React, { useContext } from "react";

import { UserContext } from "@/providers/UserProvider";
import CurioDark from "@/public/logo/curio_dark.svg";
import CurioLight from "@/public/logo/curio_light.svg";
import CurioLogoDark from "@/public/logo/curio_logo_dark.svg";
import CurioLogoLight from "@/public/logo/curio_logo_light.svg";
import CurioNameDark from "@/public/logo/curio_name_dark.svg";
import CurioNameLight from "@/public/logo/curio_name_light.svg";

export const CurioBrand: React.FC = () => {
  const { user } = useContext(UserContext);

  const homeLink = user.id ? "/home" : "/";
  return (
    <div className="my-2">
      <Link href={homeLink}>
        <CurioDark height="40px" className="block dark:hidden" />
        <CurioLight height="40px" className="hidden dark:block" />
      </Link>
    </div>
  );
};

export const CurioName: React.FC = () => {
  return (
    <>
      <CurioNameDark className="block dark:hidden" />
      <CurioNameLight className="hidden dark:block" />
    </>
  );
};

export const CurioLogo: React.FC = () => {
  return (
    <>
      <CurioLogoDark className="block dark:hidden" />
      <CurioLogoLight className="hidden dark:block" />
    </>
  );
};

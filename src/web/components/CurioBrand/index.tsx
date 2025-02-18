import Link from "next/link";
import React, { useContext } from "react";

import { UserContext } from "@/providers/UserProvider";
import CurioDark from "@/public/logo/curio_dark.svg";
import CurioLight from "@/public/logo/curio_light.svg";
import CurioLogoSquare from "@/public/logo/curio_logo.svg";
import CurioNameDark from "@/public/logo/curio_name_dark.svg";
import CurioNameLight from "@/public/logo/curio_name_light.svg";
import { cn } from "@/utils/cn";

interface CurioProps {
  className?: string;
}

export const CurioBrand: React.FC<CurioProps> = ({ className }) => {
  const { user } = useContext(UserContext);

  const homeLink = user.id ? "/home" : "/";
  return (
    <div className={cn("my-2", className)}>
      <Link href={homeLink}>
        <CurioDark height="40px" className="block dark:hidden" />
        <CurioLight height="40px" className="hidden dark:block" />
      </Link>
    </div>
  );
};

export const CurioHomeLogo: React.FC<CurioProps> = ({ className }) => {
  const { user } = useContext(UserContext);

  const homeLink = user.id ? "/home" : "/";
  return (
    <div className={cn("w-10 h-10", className)}>
      <Link href={homeLink}>
        <CurioLogo />
      </Link>
    </div>
  );
};

export const CurioName: React.FC<CurioProps> = ({ className }) => {
  return (
    <>
      <CurioNameDark className={cn("block dark:hidden", className)} />
      <CurioNameLight className={cn("hidden dark:block", className)} />
    </>
  );
};

export const CurioLogo: React.FC<CurioProps> = ({ className }) => {
  return (
    <>
      <CurioLogoSquare className={cn("block", className)} />
    </>
  );
};

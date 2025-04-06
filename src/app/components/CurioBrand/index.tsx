import CurioDark from "@app/assets/curio_dark.svg";
import CurioLight from "@app/assets/curio_light.svg";
import CurioLogoSquare from "@app/assets/curio_logo.svg";
import CurioNameDark from "@app/assets/curio_name_dark.svg";
import CurioNameLight from "@app/assets/curio_name_light.svg";
import { useUser } from "@app/providers/User";
import { cn } from "@app/utils/cn";
import React from "react";
import { Link } from "react-router-dom";

interface CurioProps {
  className?: string;
}

export const CurioBrand: React.FC<CurioProps> = ({ className }) => {
  const { user } = useUser();

  const homeLink = user.id ? "/home" : "/";
  return (
    <div className={cn("my-2", className)}>
      <Link to={homeLink}>
        <CurioDark height="40px" className="block dark:hidden" />
        <CurioLight height="40px" className="hidden dark:block" />
      </Link>
    </div>
  );
};

export const CurioHomeLogo: React.FC<CurioProps> = ({ className }) => {
  const { user } = useUser();

  const homeLink = user.id ? "/home" : "/";
  return (
    <div className={cn("w-10 h-10", className)}>
      <Link to={homeLink}>
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

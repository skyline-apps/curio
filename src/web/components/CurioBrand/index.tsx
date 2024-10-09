import Link from "next/link";
import React, { useContext } from "react";

import { UserContext } from "@/providers/UserProvider";
import CurioDark from "@/public/logo/curio_dark.svg";
import CurioLight from "@/public/logo/curio_light.svg";

const CurioBrand: React.FC = () => {
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
export default CurioBrand;

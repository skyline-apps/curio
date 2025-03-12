import Link from "next/link";
import { FaChrome, FaDesktop, FaFirefoxBrowser } from "react-icons/fa6";

import Icon from "@/components/ui/Icon";
import config from "@/lib/config.json";

interface AppLinkProps {
  href: string;
  icon: React.ReactNode;
}

const AppLink: React.FC<AppLinkProps> = ({ href, icon }: AppLinkProps) => {
  return (
    <Link
      href={href}
      target="_blank"
      className="text-success-600 hover:text-success-700"
    >
      <Icon icon={icon} />
    </Link>
  );
};

const AppLinks: React.FC = () => {
  return (
    <div className="flex gap-8">
      <AppLink
        key="web"
        href={process.env.NEXT_PUBLIC_CURIO_URL || "/"}
        icon={<FaDesktop size={48} />}
      />
      {config.chromeExtensionLink && (
        <AppLink
          key="chrome"
          href={config.chromeExtensionLink}
          icon={<FaChrome size={48} />}
        />
      )}
      {config.firefoxExtensionLink && (
        <AppLink
          key="firefox"
          href={config.firefoxExtensionLink}
          icon={<FaFirefoxBrowser size={48} />}
        />
      )}
    </div>
  );
};

export default AppLinks;

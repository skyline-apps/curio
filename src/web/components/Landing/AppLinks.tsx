import Link from "next/link";
import {
  FaAndroid,
  FaApple,
  FaChrome,
  FaDesktop,
  FaFirefoxBrowser,
} from "react-icons/fa6";

import Icon from "@/components/ui/Icon";
import config from "@/lib/config.json";

interface AppLinkProps {
  href?: string;
  icon: React.ReactNode;
}

const ICON_SIZE = 40;

const AppLink: React.FC<AppLinkProps> = ({ href, icon }: AppLinkProps) => {
  return (
    <div className="opacity-80 hover:opacity-100">
      {!!href ? (
        <Link
          href={href}
          target="_blank"
          className="text-success-600 hover:text-success-700"
        >
          <Icon icon={icon} />
        </Link>
      ) : (
        <Icon icon={icon} />
      )}
    </div>
  );
};

const AppLinks: React.FC = () => {
  return (
    <div className="flex gap-8">
      <AppLink
        key="web"
        href={process.env.NEXT_PUBLIC_CURIO_URL || "/"}
        icon={<FaDesktop size={ICON_SIZE} />}
      />
      {config.chromeExtensionLink && (
        <AppLink
          key="chrome"
          href={config.chromeExtensionLink}
          icon={<FaChrome size={ICON_SIZE} />}
        />
      )}
      {config.firefoxExtensionLink && (
        <AppLink
          key="firefox"
          href={config.firefoxExtensionLink}
          icon={<FaFirefoxBrowser size={ICON_SIZE} />}
        />
      )}
      <AppLink key="android" icon={<FaAndroid size={ICON_SIZE} />} />
      <AppLink key="ios" icon={<FaApple size={ICON_SIZE} />} />
    </div>
  );
};

export default AppLinks;

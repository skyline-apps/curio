import Icon from "@app/components/ui/Icon";
import { cn } from "@app/utils/cn";
import config from "@app/utils/config.json";
import {
  FaAndroid,
  FaApple,
  FaChrome,
  FaDesktop,
  FaFirefoxBrowser,
} from "react-icons/fa6";
import { Link } from "react-router-dom";

interface AppLinkProps {
  href?: string;
  icon: React.ReactNode;
}

const ICON_SIZE = 40;

const AppLink: React.FC<AppLinkProps> = ({ href, icon }: AppLinkProps) => {
  return (
    <div className={cn(!!href ? "opacity-80 hover:opacity-100" : "opacity-50")}>
      {!!href ? (
        <Link
          to={href}
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

interface AppLinksProps {
  size?: number;
  className?: string;
}

const AppLinks: React.FC<AppLinksProps> = ({
  size = ICON_SIZE,
  className,
}: AppLinksProps) => {
  return (
    <div
      className={cn(
        "flex py-4",
        size >= ICON_SIZE ? "gap-8" : "gap-4",
        className,
      )}
    >
      <AppLink
        key="web"
        href={import.meta.env.VITE_CURIO_URL || "/"}
        icon={<FaDesktop size={size} />}
      />
      {config.chromeExtensionLink && (
        <AppLink
          key="chrome"
          href={config.chromeExtensionLink}
          icon={<FaChrome size={size} />}
        />
      )}
      {config.firefoxExtensionLink && (
        <AppLink
          key="firefox"
          href={config.firefoxExtensionLink}
          icon={<FaFirefoxBrowser size={size} />}
        />
      )}
      {config.androidLink && (
        <AppLink
          key="android"
          href={config.androidLink}
          icon={<FaAndroid size={size} />}
        />
      )}
      {config.iosLink && (
        <AppLink
          key="ios"
          href={config.iosLink}
          icon={<FaApple size={size} />}
        />
      )}
    </div>
  );
};

export default AppLinks;

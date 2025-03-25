import Icon from "@web/components/ui/Icon";
import React, { useState } from "react";
import { HiOutlineDocument } from "react-icons/hi2";

interface FaviconProps {
  className?: string;
  url?: string | null;
}

const Favicon: React.FC<FaviconProps> = ({ className, url }: FaviconProps) => {
  const [failedLoading, setFailedLoading] = useState<boolean>(false);

  const handleImageError = (): void => {
    setFailedLoading(true);
  };

  return url && !failedLoading ? ( // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={url}
      width={12}
      height={12}
      onError={handleImageError}
      alt="favicon"
    />
  ) : (
    <Icon
      className={className}
      icon={<HiOutlineDocument width={12} height={12} />}
    />
  );
};

export default Favicon;

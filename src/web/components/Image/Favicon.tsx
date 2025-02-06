import React, { useState } from "react";
import { HiOutlineDocument } from "react-icons/hi2";

import Icon from "@/components/ui/Icon";

interface FaviconProps {
  url?: string | null;
}

const Favicon: React.FC<FaviconProps> = ({ url }: FaviconProps) => {
  const [failedLoading, setFailedLoading] = useState<boolean>(false);

  const handleImageError = (): void => {
    setFailedLoading(true);
  };

  return url && !failedLoading ? (
    <img
      src={url}
      width={12}
      height={12}
      onError={handleImageError}
      alt="favicon"
    />
  ) : (
    <Icon icon={<HiOutlineDocument width={12} height={12} />} />
  );
};

export default Favicon;

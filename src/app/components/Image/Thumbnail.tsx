import Icon from "@app/components/ui/Icon";
import React, { useState } from "react";
import { HiOutlinePhoto } from "react-icons/hi2";

interface ThumbnailProps {
  thumbnail?: string;
}

const Thumbnail: React.FC<ThumbnailProps> = ({ thumbnail }: ThumbnailProps) => {
  const [failedLoading, setFailedLoading] = useState<boolean>(false);

  const handleImageError = (): void => {
    setFailedLoading(true);
  };

  return thumbnail && !failedLoading ? (
    <div className="w-full h-48 p-2">
      <img
        alt="item thumbnail"
        className="object-contain w-full h-full"
        src={thumbnail}
        onError={handleImageError}
      />
    </div>
  ) : (
    <div className="flex items-center justify-center w-full h-48 p-2">
      <Icon className="text-secondary w-12 h-12" icon={<HiOutlinePhoto />} />
    </div>
  );
};

export default Thumbnail;

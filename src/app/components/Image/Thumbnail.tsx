import Icon from "@app/components/ui/Icon";
import { cn } from "@app/utils/cn";
import React, { useState } from "react";
import { HiOutlinePhoto } from "react-icons/hi2";

interface ThumbnailProps {
  thumbnail?: string;
  size?: "sm" | "lg";
}

const Thumbnail: React.FC<ThumbnailProps> = ({
  thumbnail,
  size = "lg",
}: ThumbnailProps) => {
  const [failedLoading, setFailedLoading] = useState<boolean>(false);

  const handleImageError = (): void => {
    setFailedLoading(true);
  };

  return thumbnail && !failedLoading ? (
    <div
      className={cn(
        "p-2",
        size === "sm" ? "h-24 w-24 sm:h-48 sm:w-full" : "h-48 w-full",
      )}
    >
      <img
        alt="item thumbnail"
        className="object-contain w-full h-full"
        src={thumbnail}
        onError={handleImageError}
      />
    </div>
  ) : (
    <div
      className={cn(
        "flex items-center justify-center",
        size === "sm" ? "h-24 w-24 sm:h-48 sm:w-full" : "h-48 w-full",
      )}
    >
      <Icon className="text-secondary w-12 h-12" icon={<HiOutlinePhoto />} />
    </div>
  );
};

export default Thumbnail;

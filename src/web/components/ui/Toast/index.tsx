import React, { useEffect, useState } from "react";
import { HiXMark } from "react-icons/hi2";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { cn } from "@/utils/cn";

const ANIMATION_DURATION = 300;
const DEFAULT_TOAST_DURATION = 3000;

interface ToastProps extends React.PropsWithChildren {
  className?: string;
  dismissable?: boolean;
  disappearing?: boolean;
}

const Toast: React.FC<ToastProps> = ({
  children,
  className,
  dismissable = true,
  disappearing = true,
}: ToastProps) => {
  const [visible, setVisible] = useState<boolean>(true);
  const [isExiting, setIsExiting] = useState<boolean>(false);

  useEffect(() => {
    setVisible(true);
    setIsExiting(false);
  }, [children]);

  const startSnackbarTimer = (): (() => void) => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setVisible(false);
      }, ANIMATION_DURATION);
    }, DEFAULT_TOAST_DURATION);

    return () => clearTimeout(timer);
  };

  useEffect(() => {
    if (disappearing && visible) {
      return startSnackbarTimer();
    }
  }, [disappearing, visible]);

  return (
    <Card
      className={cn(
        "flex flex-row items-center gap-2 text-sm fixed bottom-4 right-4 z-10 transition-opacity duration-300 py-2 px-4",
        visible
          ? isExiting
            ? "animate-slide-out opacity-0"
            : "animate-slide-in opacity-100"
          : "opacity-0",
        className,
      )}
    >
      {children}
      {dismissable && (
        <Button
          size="sm"
          variant="light"
          isIconOnly
          onPress={() => {
            setIsExiting(true);
            setTimeout(() => setVisible(false), ANIMATION_DURATION);
          }}
        >
          <Icon icon={<HiXMark />} />
        </Button>
      )}
    </Card>
  );
};

export default Toast;

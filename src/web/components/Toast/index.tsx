import React, { useEffect, useState } from "react";
import { HiXMark } from "react-icons/hi2";

import Button from "@/components/Button";
import Card from "@/components/Card";
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
      startSnackbarTimer();
    }
  }, [disappearing, visible]);

  return (
    <Card
      className={cn(
        "flex flex-row items-center gap-2 text-sm fixed bottom-4 right-4 z-10 transition-opacity duration-300",
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
          onClick={() => {
            setIsExiting(true);
            setTimeout(() => setVisible(false), ANIMATION_DURATION);
          }}
        >
          <HiXMark />
        </Button>
      )}
    </Card>
  );
};

export default Toast;

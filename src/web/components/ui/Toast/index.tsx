import Button from "@web/components/ui/Button";
import Card from "@web/components/ui/Card";
import Icon from "@web/components/ui/Icon";
import { cn } from "@web/utils/cn";
import React, { useEffect, useState } from "react";
import { HiXMark } from "react-icons/hi2";

const ANIMATION_DURATION = 300;
const DEFAULT_TOAST_DURATION = 3000;

export type ToastType = "error";

interface ToastProps extends React.PropsWithChildren {
  className?: string;
  dismissable?: boolean;
  disappearing?: boolean;
  type?: ToastType;
}

const Toast: React.FC<ToastProps> = ({
  children,
  className,
  dismissable = true,
  disappearing = true,
  type,
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
        type === "error" && "text-danger",
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

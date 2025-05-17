import Button from "@app/components/ui/Button";
import { Tooltip } from "@app/components/ui/Tooltip";
import { BrowserMessageContext } from "@app/providers/BrowserMessage";
import { useUser } from "@app/providers/User";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface LinkInfoProps extends React.PropsWithChildren {
  href: string;
}

const LinkInfo: React.FC<LinkInfoProps> = ({
  children,
  href,
}: LinkInfoProps) => {
  const { user } = useUser();
  const { saveItemContent } = useContext(BrowserMessageContext);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handlePressStart = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = setTimeout(() => {
      setIsTooltipOpen(true);
    }, 700);
  }, []);

  const handlePressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handlePressCancel = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleScroll = (): void => {
      if (isTooltipOpen) {
        setIsTooltipOpen(false);
      }
    };

    if (isTooltipOpen) {
      window.addEventListener("scroll", handleScroll, true);
    }

    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isTooltipOpen]);

  return (
    <Tooltip
      isOpen={isTooltipOpen}
      onOpenChange={setIsTooltipOpen}
      content={
        <span className="flex items-center gap-1 justify-between max-w-60 p-1 overflow-x-hidden select-none">
          <a
            href={href}
            target="_blank"
            className="underline text-xs truncate text-ellipsis"
          >
            {`${new URL(href).hostname}${new URL(href).pathname}`}
          </a>
          {user.id && (
            <Button
              className="shrink-0"
              size="xs"
              color="primary"
              onPress={() => href && saveItemContent(href)}
            >
              Save to Curio
            </Button>
          )}
        </span>
      }
    >
      <span
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressCancel}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onTouchMove={handlePressCancel}
        role="button"
        tabIndex={0}
      >
        {children}
      </span>
    </Tooltip>
  );
};

export default LinkInfo;

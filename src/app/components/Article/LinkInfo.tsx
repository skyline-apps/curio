import Button from "@app/components/ui/Button";
import { Tooltip } from "@app/components/ui/Tooltip";
import { BrowserMessageContext } from "@app/providers/BrowserMessage";
import { useUser } from "@app/providers/User";
import React, { useContext } from "react";

interface LinkInfoProps extends React.PropsWithChildren {
  href: string;
}

const LinkInfo: React.FC<LinkInfoProps> = ({
  children,
  href,
}: LinkInfoProps) => {
  const { user } = useUser();
  const { saveItemContent } = useContext(BrowserMessageContext);

  return (
    <Tooltip
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
      {children}
    </Tooltip>
  );
};

export default LinkInfo;

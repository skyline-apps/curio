import { createLogger } from "@app/utils/logger";
import { App, URLOpenListenerEvent } from "@capacitor/app";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const log = createLogger("AppUrlListener");

type AppUrlListenerProps = Record<never, never>;

const AppUrlListener: React.FC<AppUrlListenerProps> = () => {
  const navigate = useNavigate();
  useEffect(() => {
    App.addListener("appUrlOpen", (event: URLOpenListenerEvent) => {
      try {
        const url = new URL(event.url);
        const path = url.pathname + url.search + url.hash;
        if (path && path !== "/") {
          navigate(path);
        }
      } catch (e) {
        if (e instanceof Error) {
          log.error(e.message);
        }
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};

export default AppUrlListener;

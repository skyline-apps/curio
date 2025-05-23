import { sampleSlug } from "@app/components/Landing/sampleData";
import { useAppLayout } from "@app/providers/AppLayout";
import { BrowserMessageContext } from "@app/providers/BrowserMessage";
import { useSettings } from "@app/providers/Settings";
import { isMobileBrowser, isNativePlatform } from "@app/utils/platform";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { LuCat, LuHeart, LuLampDesk, LuSprout, LuWaves } from "react-icons/lu";
import { ACTIONS, type CallBackProps, EVENTS, STATUS } from "react-joyride";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { WalkthroughContext, WalkthroughStep } from ".";

export interface WalkthroughProviderProps {
  children: React.ReactNode;
}

export const WalkthroughProvider = ({
  children,
}: WalkthroughProviderProps): React.ReactNode => {
  const { settings, updateSettings } = useSettings();
  const { updateAppLayout } = useAppLayout();
  const { getExtensionLink } = useContext(BrowserMessageContext);
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [run, setRun] = useState<boolean>(
    settings ? settings.completedWalkthrough === false : false,
  );

  const retrySetRunTrue = useCallback(
    (target: string | HTMLElement | undefined, attempt = 0) => {
      if (!target) {
        setRun(true);
        return;
      }
      if (typeof target === "string") {
        if (document.querySelector(target)) {
          setRun(true);
          return;
        }
      } else if (target instanceof HTMLElement) {
        if (document.body.contains(target)) {
          setRun(true);
          return;
        }
      }
      if (attempt < 8) {
        setTimeout(() => retrySetRunTrue(target, attempt + 1), 200);
      }
    },
    [],
  );

  useEffect(() => {
    setRun(settings ? settings.completedWalkthrough === false : false);
  }, [settings]);

  const extensionLink = getExtensionLink();
  const [steps] = useState<WalkthroughStep[]>([
    {
      target: "body",
      title: "Welcome to Curio!",
      content: (
        <p>
          Before you get started, let me quickly show you around. If you're
          ready to dive in, feel free to skip this introduction.
        </p>
      ),
      placement: "center",
      data: { next: `/item/${sampleSlug}` },
      icon: <LuSprout className="text-success" size={24} />,
      disableBeacon: true,
    },
    {
      target: "#app-page",
      title: "A focused reading experience",
      content: (
        <>
          <p>
            Curio provides a distraction-free reading experience. You can also
            add notes and highlights to your saved articles.
          </p>
          <p>Articles you've opened will be saved for offline reading.</p>
        </>
      ),
      data: { prev: "/home", next: "/inbox" },
      icon: <LuLampDesk className="text-warning" size={24} />,
      disableBeacon: true,
    },
    {
      target: "#infinite-list",
      title: "View your reading list",
      content: (
        <p>
          Your reading list is displayed in your inbox. Treat it like a stream,
          not a to-do list.
        </p>
      ),
      data: { prev: `/item/${sampleSlug}` },
      icon: <LuWaves className="text-primary" size={24} />,
      disableBeacon: true,
    },
    {
      target: "#new-item",
      title: "Save your favorite pages",
      content: (
        <>
          <p>Save pages you come across to read later.</p>
          <p>
            {isNativePlatform() ? (
              <>
                Add links via this Curio app or by sharing links from your other
                apps.
              </>
            ) : extensionLink ? (
              <>
                Curio captures page contents from within your browser, so you'll
                need to install the {extensionLink} before you can save any
                links.
              </>
            ) : isMobileBrowser() ? (
              <>
                On mobile, you'll need to use our dedicated Android or iOS app
                to save pages. They're coming soon!
              </>
            ) : (
              <>
                Curio captures pages directly from your browser, but currently
                only Chrome and Firefox are supported.
              </>
            )}
          </p>
        </>
      ),
      icon: <LuHeart className="!text-danger" size={24} />,
      disableBeacon: true,
    },
    {
      target: "body",
      title: "Happy reading!",
      content: (
        <p>
          You're all set! If you have any other questions or feedback, feel free
          to contact us at{" "}
          <Link className="hover:underline" to="mailto:team@curi.ooo">
            team@curi.ooo
          </Link>
          .
        </p>
      ),
      placement: "center",
      icon: <LuCat className="text-warning" size={24} />,
      disableBeacon: true,
    },
  ]);

  const navigate = useNavigate();
  const location = useLocation();

  const handleComplete = useCallback(async () => {
    await updateSettings("completedWalkthrough", true);
    setRun(false);
    setStepIndex(0);
  }, [updateSettings]);

  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { action, index, step, type, status } = data;
      const next = step?.data?.next;
      const prev = step?.data?.prev;

      const isLastStep = index === steps.length - 1;
      if (
        (type === EVENTS.STEP_AFTER && isLastStep && action === ACTIONS.NEXT) ||
        (type === EVENTS.STEP_AFTER && action === ACTIONS.SKIP) ||
        type === EVENTS.TOUR_END ||
        status === STATUS.FINISHED ||
        status === STATUS.SKIPPED
      ) {
        handleComplete();
        return;
      }

      if (type === EVENTS.STEP_AFTER) {
        if (action === ACTIONS.PREV) {
          setRun(false);
          if (typeof prev === "string") {
            navigate(prev);
          } else if (index > 0) {
            setStepIndex(index - 1);
            const prevStep = steps[index - 1];
            retrySetRunTrue(prevStep?.target);
          }
        } else if (action === ACTIONS.NEXT) {
          setRun(false);
          if (typeof next === "string") {
            navigate(next);
          } else if (index < steps.length - 1) {
            setStepIndex(index + 1);
            const nextStep = steps[index + 1];
            retrySetRunTrue(nextStep?.target);
            updateAppLayout({
              leftSidebarOpen: true,
              rightSidebarOpen: false,
            });
          }
        } else if (index === steps.length - 1) {
          setRun(false);
          setStepIndex(0);
        }
      }
    },
    [navigate, handleComplete, updateAppLayout, retrySetRunTrue, steps],
  );

  useEffect(() => {
    if (run) return;

    const currentStep = steps[stepIndex];
    const nextPath = currentStep?.data?.next;
    const prevPath = currentStep?.data?.prev;

    if (
      typeof nextPath === "string" &&
      nextPath === location.pathname &&
      stepIndex < steps.length - 1
    ) {
      setRun(true);
      setStepIndex(stepIndex + 1);
    } else if (
      typeof prevPath === "string" &&
      prevPath === location.pathname &&
      stepIndex > 0
    ) {
      setRun(true);
      setStepIndex(stepIndex - 1);
    }
  }, [location.pathname, steps, stepIndex, run]);

  const value = useMemo(
    () => ({
      run,
      setRun,
      stepIndex,
      setStepIndex,
      steps,
      handleJoyrideCallback,
    }),
    [run, stepIndex, steps, handleJoyrideCallback],
  );

  return (
    <WalkthroughContext.Provider value={value}>
      {children}
    </WalkthroughContext.Provider>
  );
};

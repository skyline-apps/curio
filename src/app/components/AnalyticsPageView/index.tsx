import { usePostHog } from "posthog-js/react";
import { Suspense, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";

const PostHogPageView = (): null => {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const posthog = usePostHog();

  // Track pageviews
  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = url + "?" + searchParams.toString();
      }

      posthog.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams, posthog]);

  return null;
};

// Wrap this in Suspense to avoid the useSearchParams usage above
// from de-opting the whole app into client-side rendering
// See: https://nextjs.org/docs/messages/deopted-into-client-rendering
const SuspendedPostHogPageView = (): React.ReactElement => {
  return (
    <Suspense fallback={null}>
      <PostHogPageView />
    </Suspense>
  );
};

export default SuspendedPostHogPageView;

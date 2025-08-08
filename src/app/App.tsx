import AppUrlListener from "@app/components/AppUrlListener";
import ErrorBoundary from "@app/components/ui/ErrorBoundary";
import Spinner from "@app/components/ui/Spinner";
import ProtectedLayout from "@app/layouts/ProtectedLayout";
import PublicLayout from "@app/layouts/PublicLayout";
import RootLayout from "@app/layouts/RootLayout";
import MainPage from "@app/pages";
import ArchivePage from "@app/pages/archive";
import AuthCallback from "@app/pages/auth/callback";
import ContentPage from "@app/pages/content";
import DocsPage from "@app/pages/docs";
import HomePage from "@app/pages/home";
import InboxPage from "@app/pages/inbox";
import LoginPage from "@app/pages/login";
import MobileLoginPage from "@app/pages/login/mobile";
import RedirectPage from "@app/pages/login/redirect";
import NotFound from "@app/pages/not-found";
import NotesPage from "@app/pages/notes";
import PrivacyPage from "@app/pages/privacy";
import SettingsPage from "@app/pages/settings";
import TermsPage from "@app/pages/terms";
import UserPage from "@app/pages/user";
import { SidebarKey } from "@app/providers/AppLayout";
import { useUser } from "@app/providers/User";
import { getStoredRootPage } from "@app/utils/displayStorage";
import { isNativePlatform } from "@app/utils/platform";
import React, { useEffect } from "react";
import {
  BrowserRouter,
  Outlet,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

const RequireAuth = ({
  children,
}: React.PropsWithChildren): React.ReactNode => {
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.id) {
      navigate("/");
    }
  }, [user?.id, navigate]);

  return user?.id ? <>{children}</> : null;
};

const RootPageRedirect = (): React.ReactNode => {
  const navigate = useNavigate();
  useEffect(() => {
    const rootPage = getStoredRootPage();
    if (
      rootPage &&
      rootPage !== SidebarKey.NONE &&
      rootPage !== SidebarKey.PROFILE
    ) {
      navigate(rootPage, { replace: true });
    } else {
      navigate("/home", { replace: true });
    }
  }, [navigate]);
  return null;
};

export const App = (): React.ReactNode => {
  const { user, isLoading } = useUser();

  const isNative = isNativePlatform();

  if (isLoading) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="*"
            element={
              <div className="h-dvh">
                <Spinner centered />
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppUrlListener />
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            element={
              <RootLayout>
                <Outlet />
              </RootLayout>
            }
          >
            <Route
              path="/"
              element={
                user?.id ? (
                  <RootPageRedirect />
                ) : isNative ? (
                  <MobileLoginPage />
                ) : (
                  <MainPage />
                )
              }
            />
            <Route
              path="/login"
              element={
                user?.id ? (
                  <RootPageRedirect />
                ) : isNative ? (
                  <MobileLoginPage />
                ) : (
                  <LoginPage />
                )
              }
            />
            <Route
              path="/login/redirect"
              element={user?.id ? <RootPageRedirect /> : <RedirectPage />}
            />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route
              element={
                <RequireAuth>
                  <ProtectedLayout>
                    <Outlet />
                  </ProtectedLayout>
                </RequireAuth>
              }
            >
              <Route path="/home" element={<HomePage />} />
              <Route path="/inbox" element={<InboxPage />} />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/archive" element={<ArchivePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route
              element={
                <PublicLayout>
                  <Outlet />
                </PublicLayout>
              }
            >
              <Route path="/u/:username" element={<UserPage />} />
              <Route path="/item/:slug" element={<ContentPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

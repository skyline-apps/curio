import ProtectedLayout from "@app/layouts/ProtectedLayout";
import PublicLayout from "@app/layouts/PublicLayout";
import RootLayout from "@app/layouts/RootLayout";
import MainPage from "@app/pages";
import ArchivePage from "@app/pages/archive";
import AuthCallback from "@app/pages/auth/callback";
import ContentPage from "@app/pages/content";
import HomePage from "@app/pages/home";
import InboxPage from "@app/pages/inbox";
import LoginPage from "@app/pages/login";
import RedirectPage from "@app/pages/login/redirect";
import NotFound from "@app/pages/not-found";
import NotesPage from "@app/pages/notes";
import PrivacyPage from "@app/pages/privacy";
import ProfilePage from "@app/pages/profile";
import SettingsPage from "@app/pages/settings";
import TermsPage from "@app/pages/terms";
import { useUser } from "@app/providers/User";
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

const HomeRedirect = (): React.ReactNode => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/home", { replace: true });
  }, [navigate]);
  return null;
};

export const App = (): React.ReactNode => {
  const { user } = useUser();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <RootLayout>
              <Outlet />
            </RootLayout>
          }
        >
          <Route
            path="/"
            element={user?.id ? <HomeRedirect /> : <MainPage />}
          />
          <Route
            path="/login"
            element={user?.id ? <HomeRedirect /> : <LoginPage />}
          />
          <Route
            path="/login/redirect"
            element={user?.id ? <HomeRedirect /> : <RedirectPage />}
          />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
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
            <Route path="/u/:username" element={<ProfilePage />} />
            <Route path="/item/:slug" element={<ContentPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

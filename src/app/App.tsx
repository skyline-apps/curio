import ProtectedLayout from "@app/layouts/ProtectedLayout";
import RootLayout from "@app/layouts/RootLayout";
import MainPage from "@app/pages";
import ArchivePage from "@app/pages/archive";
import AuthCallback from "@app/pages/auth/callback";
import HomePage from "@app/pages/home";
import InboxPage from "@app/pages/inbox";
import LoginPage from "@app/pages/login";
import NotFound from "@app/pages/not-found";
import NotesPage from "@app/pages/notes";
import PrivacyPage from "@app/pages/privacy";
import SettingsPage from "@app/pages/settings";
import TermsPage from "@app/pages/terms";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";

export const App = (): React.ReactNode => {
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
          <Route path="/" element={<MainPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route
            element={
              <ProtectedLayout>
                <Outlet />
              </ProtectedLayout>
            }
          >
            <Route path="/home" element={<HomePage />} />
            <Route path="/inbox" element={<InboxPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/archive" element={<ArchivePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

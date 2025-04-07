import RootLayout from "@app/layouts/RootLayout";
import MainPage from "@app/pages";
import AuthCallback from "@app/pages/auth/callback";
import LoginPage from "@app/pages/login";
import PrivacyPage from "@app/pages/privacy";
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

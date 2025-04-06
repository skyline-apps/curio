import RootLayout from "@app/layouts/RootLayout";
import MainPage from "@app/pages";
import AuthCallback from "@app/pages/auth/callback";
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

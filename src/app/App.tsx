import RootLayout from "@app/layouts/RootLayout";
import MainPage from "@app/pages";
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

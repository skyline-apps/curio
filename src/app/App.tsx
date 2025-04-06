import RootLayout from "@app/layouts/RootLayout";
import { BrowserRouter, Route, Routes, Outlet } from "react-router-dom";
import MainPage from "@app/pages"

export const App = (): React.ReactNode => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout><Outlet /></RootLayout>}>
          <Route path="/" element={<MainPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

import RootLayout from "@app/layouts/RootLayout";
import { BrowserRouter, Route, Routes } from "react-router-dom";

export const App = (): React.ReactNode => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<div>Home Page</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

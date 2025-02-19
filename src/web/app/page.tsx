import React from "react";

import Footer from "@/components/Landing/Footer";
import LandingPage from "@/components/Landing/LandingPage";
import Navbar from "@/components/Navbar";

const MainPage: React.FC = () => {
  return (
    <>
      <Navbar />
      <LandingPage />
      <Footer />
    </>
  );
};

export default MainPage;

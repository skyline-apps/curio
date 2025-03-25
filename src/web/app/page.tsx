import Footer from "@web/components/Landing/Footer";
import LandingPage from "@web/components/Landing/LandingPage";
import Navbar from "@web/components/Navbar";
import React from "react";

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

import Footer from "@app/components/Landing/Footer";
import LandingPage from "@app/components/Landing/LandingPage";
import Navbar from "@app/components/Navbar";
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

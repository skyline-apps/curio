import Footer from "@app/components/Landing/Footer";
import Navbar from "@app/components/Navbar";
import React from "react";
import { Link } from "react-router-dom";

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col w-full h-dvh">
      <Navbar />
      <div className="flex flex-col h-full justify-center items-center gap-4">
        <h2 className="text-xl">Oops!</h2>
        <p>Page not found</p>
        <Link className="underline" to="/">
          Return home.
        </Link>
      </div>
      <Footer />
    </div>
  );
};

export default NotFound;

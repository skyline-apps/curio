import React from "react";
import {
  HiOutlineBookmarkSquare,
  HiOutlineBookOpen,
  HiOutlineStar,
} from "react-icons/hi2";

import Button from "@/components/Button";
import Card from "@/components/Card";
import CurioNameDark from "@/public/logo/curio_name_dark.svg";
import CurioNameLight from "@/public/logo/curio_name_light.svg";

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const Feature: React.FC<FeatureProps> = ({
  icon,
  title,
  description,
}: FeatureProps) => (
  <Card className="p-4">
    <div className="flex items-center">
      {icon}
      <h4 className="ml-2 text-lg font-semibold">{title}</h4>
    </div>
    <p className="mt-2">{description}</p>
  </Card>
);

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow container mx-auto px-4 py-12">
        <CurioNameDark className="h-24 mx-auto block dark:hidden" />
        <CurioNameLight className="h-24 mx-auto hidden dark:block" />
        <h2 className="text-2xl text-center mb-8">Curate your inspirations</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Feature
            icon={<HiOutlineBookmarkSquare className="text-primary" />}
            title="Save Anything"
            description="Save any link from the internet, whether it's an article, book, movie, podcast, or song."
          />
          <Feature
            icon={<HiOutlineStar className="text-warning" />}
            title="Organize"
            description="Favorite, tag, highlight, and add notes to saved items."
          />
          <Feature
            icon={<HiOutlineBookOpen className="text-success" />}
            title="Read Later"
            description="Read your articles later with a clean, focused viewer."
          />
        </div>

        <div className="text-center">
          <Button href="/login" color="primary" size="lg">
            Get Started
          </Button>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;

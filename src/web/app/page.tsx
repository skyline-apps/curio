import { LuBookMarked, LuBookOpen, LuStar } from "react-icons/lu";
import { Card } from "@nextui-org/react";
import Link from "next/link";
import React from "react";

import Button from "@/components/Button";

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

const Home: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-4">Curio</h1>
        <h2 className="text-2xl text-center mb-8">Curate your inspirations</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Feature
            icon={<LuBookMarked className="text-blue-500" />}
            title="Save Anything"
            description="Save any link from the internet, whether it's an article, book, movie, podcast, or song."
          />
          <Feature
            icon={<LuStar className="text-yellow-500" />}
            title="Organize"
            description="Favorite, tag, highlight, and add notes to saved items."
          />
          <Feature
            icon={<LuBookOpen className="text-green-500" />}
            title="Read Later"
            description="Read your articles later with a clean, focused viewer."
          />
        </div>

        <div className="text-center">
          <Link href="/login">
            <Button color="primary" size="lg" className="px-8 py-2">
              Get Started
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Home;

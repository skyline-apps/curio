import React from "react";

import { CurioName } from "@/components/CurioBrand";
import Navbar from "@/components/Navbar";
import Button from "@/components/ui/Button";
import LandingPageDark from "@/public/assets/landing_page_dark.svg";
import LandingPageLight from "@/public/assets/landing_page_light.svg";
import { cn } from "@/utils/cn";

interface FeatureProps {
  title: string;
  description: string;
  isReversed?: boolean;
}

const Feature: React.FC<FeatureProps> = ({
  title,
  description,
  isReversed,
}: FeatureProps) => (
  <div
    className={cn(
      "flex flex-col items-center gap-4",
      isReversed ? "md:flex-row-reverse" : "md:flex-row",
    )}
  >
    <div
      className={cn(
        "flex flex-col text-center grow",
        isReversed
          ? "md:items-start md:text-left"
          : "md:items-end md:text-right",
      )}
    >
      <h4 className="italic text-lg">{title}</h4>
      <p className="mt-2 text-secondary">{description}</p>
    </div>
    <div className="bg-background-400 h-40 w-60 shrink-0"></div>
  </div>
);

const LandingPage: React.FC = () => {
  return (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col">
        <main className="w-full relative overflow-hidden">
          <div className="h-[calc(100vh-4rem)] relative flex justify-center">
            <div className="flex flex-col items-center justify-end h-1/2 z-10">
              <CurioName className="h-20" />
              <h2 className="text-xl text-center">Curate your inspirations.</h2>
            </div>
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 160 90"
              preserveAspectRatio="xMidYMax slice"
            >
              <path
                d="M0,50 L160,80 L160,90 L0,90 Z"
                className="fill-background-600"
              />
              <path
                d="M16,53.5 Q80,65.5,80,65.45 L128,74.6 Q129,74.7,130,75.0 L128,74.7 L16,53.6 Q16,53.5,15,53.5 Z"
                className="fill-black"
              />
            </svg>
            <div className="absolute inset-0 flex justify-center overflow-hidden">
              <LandingPageLight
                className="h-full block dark:hidden"
                preserveAspectRatio="xMidYMax slice"
              />
              <LandingPageDark
                className="h-full hidden dark:block"
                preserveAspectRatio="xMidYMax slice"
              />
            </div>
          </div>
          <div className="flex flex-col items-center mx-auto my-24 p-4 md:p-8 gap-8">
            <h3 className="text-xl text-center font-medium">
              Curate your corner of the internet.
            </h3>
            <p className="max-w-lg text-center text-secondary">
              Curio is a platform for saving what sparks your curiosity as you
              browse the web. With thoughtfully designed spaces for collecting,
              organizing, and focused reading, Curio helps you build meaning
              from the content that matters to you. Best of all, it&rsquo;s free
              and open-source&mdash;and yes, that means no ads.
            </p>
            <div className="grid grid-cols-1 gap-6 my-8 max-w-2xl">
              <Feature
                title="Curate"
                description="Capture content that matters, all in one place. Save any link from the internet, and send email newsletters straight to your Curio inbox."
                isReversed
              />
              <Feature
                title="Organize"
                description="Your ideas, beautifully organized. Tag, favorite, highlight, and add notes to build your personal library of insights."
              />
              <Feature
                title="Focus"
                description="Read on your terms, free from distractions. Dive into articles in a clean, streamlined markdown viewer that works online and offline."
                isReversed
              />
            </div>

            <div className="text-center">
              <Button href="/login" size="lg">
                Get started
              </Button>
            </div>
          </div>
        </main>
        <footer className="mt-auto py-8 text-secondary-700 bg-background-400">
          <div className="flex justify-between items-end mx-auto px-4 md:px-16">
            <div>
              <p className="text-left text-sm">
                Curio © {new Date().getFullYear()}
              </p>
            </div>
            <div>
              <p className="text-right text-sm">
                <a
                  href="https://github.com/kimberli/curio"
                  target="_blank"
                  rel="noreferrer"
                >
                  We&rsquo;re open source!
                </a>
              </p>
              <p className="text-right text-sm">
                <a href="/privacy-policy">Privacy policy</a>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;

import React from "react";

import { CurioName } from "@/components/CurioBrand";
import Button from "@/components/ui/Button";
import LandingPageDark from "@/public/assets/landing_page_dark.svg";
import LandingPageLight from "@/public/assets/landing_page_light.svg";

import AppLinks from "./AppLinks";
import LandingPageFeatures from "./LandingPageFeatures";

const LandingPage: React.FC = () => {
  return (
    <>
      <div className="min-h-dvh flex flex-col">
        <main className="w-full relative overflow-hidden">
          <div className="h-[calc(100dvh-4rem)] relative flex justify-center">
            <div className="flex flex-col items-center justify-end h-1/2 z-10">
              <CurioName className="h-20" />
              <h2 className="text-xl text-center">Feed your curiosity.</h2>
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
                data-testid="landing-page-light"
                className="h-full block dark:hidden"
                preserveAspectRatio="xMidYMax slice"
              />
              <LandingPageDark
                data-testid="landing-page-dark"
                className="h-full hidden dark:block"
                preserveAspectRatio="xMidYMax slice"
              />
            </div>
          </div>
          <div className="my-12 p-8">
            <div className="flex flex-col items-center mx-auto gap-4 max-w-lg">
              <h3 className="text-xl text-center font-medium mb-4">
                Curate your corner of the internet.
              </h3>
              <p className="max-w-lg text-center text-secondary">
                I&rsquo;ve always been an avid reader, and most of my education
                has come from the Internet. For a long time, I&rsquo;ve used
                read-it-later apps to keep track of what I&rsquo;ve read and
                highlight the most memorable parts. I built Curio as a passion
                project to make my reading experience even better, and I&rsquo;m
                excited to share it with you.
              </p>
              <p className="self-end text-secondary">- Kim</p>
            </div>
          </div>
          <div className="flex flex-col items-center w-full my-12 p-8 bg-background-400">
            <div className="grid grid-cols-1 gap-6 my-8 max-w-2xl">
              <LandingPageFeatures />
            </div>
          </div>
          <div className="flex flex-col justify-center items-center gap-8 w-full my-12 p-8">
            <p className="max-w-2xl text-center">
              Curio is currently in open beta, and I&rsquo;d love to hear your
              feedback. It&rsquo;s free to use, though future features may come
              with a small monthly subscription to cover hosting costs.
            </p>
            <div className="flex flex-col gap-4 max-w-2xl">
              <div>
                <h3 className="text-lg font-medium text-center">
                  Available today
                </h3>
                <ul className="list-disc ml-4 text-sm">
                  <li>Save any link via browser extension</li>
                  <li>Extract text content for a focused reading experience</li>
                  <li>Add notes, highlights, and labels to your items</li>
                  <li>Send email newsletters to your Curio inbox</li>
                  <li>Search over your entire article library</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-center">Coming soon</h3>
                <ul className="list-disc ml-4 text-sm">
                  <li>Skim AI-powered summaries and memorable quotes</li>
                  <li>Android & iOS apps with offline reading support</li>
                  <li>PDF content extraction</li>
                  <li>Additional integrations and webhooks</li>
                </ul>
              </div>
            </div>
            <AppLinks />
            <Button href="/login" color="success" size="lg">
              Get started now
            </Button>
          </div>
        </main>
      </div>
    </>
  );
};

export default LandingPage;

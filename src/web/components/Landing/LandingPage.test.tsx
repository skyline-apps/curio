import { render, screen } from "@testing-library/react";
import React from "react";

import LandingPage from "./LandingPage";

// Mock CurioBrand components
jest.mock("@/components/CurioBrand", () => ({
  __esModule: true,
  CurioLogo: () => <div data-testid="curio-logo">CurioLogo</div>,
  CurioName: () => <div data-testid="curio-name">CurioName</div>,
}));

// Mock LandingPageFeatures component
jest.mock("@/components/Landing/LandingPageFeatures", () => ({
  __esModule: true,
  default: () => <div data-testid="landing-page-features">Features</div>,
}));

describe("LandingPage", () => {
  beforeEach(() => {
    render(<LandingPage />);
  });

  describe("Hero Section", () => {
    it("renders the main branding and tagline", () => {
      expect(screen.getByTestId("curio-name")).toBeInTheDocument();
      expect(screen.getByText("Feed your curiosity.")).toBeInTheDocument();
    });

    it("renders both light and dark mode illustrations", () => {
      const lightIllustration = screen.getByTestId("landing-page-light");
      const darkIllustration = screen.getByTestId("landing-page-dark");

      expect(lightIllustration).toHaveClass("h-full", "block", "dark:hidden");
      expect(darkIllustration).toHaveClass("h-full", "hidden", "dark:block");
    });
  });

  describe("Introduction Section", () => {
    it("renders the introduction heading and content", () => {
      expect(
        screen.getByText("Curate your corner of the internet."),
      ).toBeInTheDocument();
      expect(
        screen.getByText((content) =>
          content.startsWith("I’ve always been an avid reader"),
        ),
      ).toBeInTheDocument();
      expect(screen.getByText("- Kim")).toBeInTheDocument();
    });
  });

  describe("Features Section", () => {
    it("renders the features component", () => {
      expect(screen.getByTestId("landing-page-features")).toBeInTheDocument();
    });
  });

  describe("Available Features Section", () => {
    it("renders the available features list", () => {
      expect(screen.getByText("Available today")).toBeInTheDocument();
      expect(
        screen.getByText("Save any link via browser extension"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Extract text content for a focused reading experience",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Add notes, highlights, and labels to your items"),
      ).toBeInTheDocument();
    });
  });

  describe("Coming Soon Section", () => {
    it("renders the upcoming features list", () => {
      expect(screen.getByText("Coming soon")).toBeInTheDocument();
      expect(
        screen.getByText("Send email newsletters to your Curio inbox"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Skim AI-powered summaries and memorable quotes"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Android & iOS apps with offline reading support"),
      ).toBeInTheDocument();
      expect(screen.getByText("PDF content extraction")).toBeInTheDocument();
      expect(
        screen.getByText("Additional integrations and webhooks"),
      ).toBeInTheDocument();
    });
  });

  describe("Call to Action", () => {
    it("renders the get started button with correct link", () => {
      const button = screen.getByTestId("button");
      expect(button).toHaveAttribute("href", "/login");
      expect(button).toHaveTextContent("Get started now");
    });

    it("renders the Curio logo at the bottom", () => {
      expect(screen.getByTestId("curio-logo")).toBeInTheDocument();
    });
  });
});

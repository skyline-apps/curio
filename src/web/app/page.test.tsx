import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import fetchMock from "jest-fetch-mock";

import Page from "./page";

// Mock the SVG imports
jest.mock("@/public/logo/curio_name_dark.svg", () => ({
  __esModule: true,
  default: () => <div data-testid="curio-name-dark" />,
}));

jest.mock("@/public/logo/curio_name_light.svg", () => ({
  __esModule: true,
  default: () => <div data-testid="curio-name-light" />,
}));

// Mock react-icons
jest.mock("react-icons/hi2", () => ({
  HiOutlineBookmarkSquare: () => <div data-testid="bookmark-icon" />,
  HiOutlineBookOpen: () => <div data-testid="book-icon" />,
  HiOutlineStar: () => <div data-testid="star-icon" />,
  HiOutlineUser: () => <div data-testid="user-icon" />,
}));

// Mock components
jest.mock("@/components/Navbar", () => ({
  __esModule: true,
  default: () => <div data-testid="navbar" />,
}));

jest.mock("@/components/ui/Button", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <button data-testid="button">{children}</button>
  ),
}));

jest.mock("@/components/ui/Card", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card">{children}</div>
  ),
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe("Page", () => {
  fetchMock.enableMocks();

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("renders a heading", async () => {
    fetchMock.mockResponseOnce(JSON.stringify({}));

    render(<Page />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent("Curate your inspirations");
  });

  it("renders feature cards", () => {
    render(<Page />);
    const cards = screen.getAllByTestId("card");
    expect(cards).toHaveLength(3);
  });

  it("renders get started button", () => {
    render(<Page />);
    const button = screen.getByTestId("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Get Started");
  });
});

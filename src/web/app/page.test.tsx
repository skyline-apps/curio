import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import fetchMock from "jest-fetch-mock";

import Page from "./page";

describe("Page", () => {
  fetchMock.enableMocks();

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("renders a heading", () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        /* mock data here */
      }),
    );
    render(<Page />);

    const heading = screen.getByRole("heading", { level: 2 });

    expect(heading).toBeInTheDocument();
  });
});

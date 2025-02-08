import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import fetchMock from "jest-fetch-mock";
import React from "react";

import type { SettingsResponse } from "@/app/api/v1/user/settings/validation";
import { ColorScheme } from "@/db/schema";

import { ClientProviders } from "./ClientProviders";
import { SettingsContext, SettingsProvider } from "./SettingsProvider";

describe("SettingsContext", () => {
  fetchMock.enableMocks();

  const initialSettings: SettingsResponse = {
    colorScheme: ColorScheme.LIGHT,
  };

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("fetches and provides initial settings values", async () => {
    fetchMock.mockResponseOnce(JSON.stringify(initialSettings));

    render(
      <ClientProviders>
        <SettingsProvider>
          <SettingsContext.Consumer>
            {({ settings, updateSettings }) => (
              <div>
                <button
                  onClick={() =>
                    updateSettings("colorScheme", ColorScheme.DARK)
                  }
                >
                  Change color scheme
                </button>
                <div data-testid="color-scheme">
                  {settings?.colorScheme || "no-color-scheme"}
                </div>
              </div>
            )}
          </SettingsContext.Consumer>
        </SettingsProvider>
        ,
      </ClientProviders>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("color-scheme")).toHaveTextContent("light");
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/user/settings", {
      method: "GET",
    });
  });

  it("updates settings when updateSettings is called", async () => {
    fetchMock.mockResponseOnce(JSON.stringify(initialSettings));

    render(
      <ClientProviders>
        <SettingsProvider>
          <SettingsContext.Consumer>
            {({ settings, updateSettings }) => (
              <div>
                <button
                  onClick={() =>
                    updateSettings("colorScheme", ColorScheme.DARK)
                  }
                >
                  Change color scheme
                </button>
                <div data-testid="color-scheme">
                  {settings?.colorScheme || "no-color-scheme"}
                </div>
              </div>
            )}
          </SettingsContext.Consumer>
        </SettingsProvider>
        ,
      </ClientProviders>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("color-scheme")).toHaveTextContent("light");
    });

    fetchMock.mockResponseOnce(
      JSON.stringify({ colorScheme: ColorScheme.DARK }),
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Change color scheme"));
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/user/settings",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          colorScheme: ColorScheme.DARK,
        }),
      }),
    );
  });
});

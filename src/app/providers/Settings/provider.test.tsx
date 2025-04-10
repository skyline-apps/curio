import { ClientProviders } from "@app/providers/ClientProviders";
import { ColorScheme, DisplayFont, DisplayFontSize } from "@app/schemas/db";
import type { GetSettingsResponse } from "@app/schemas/v1/user/settings";
import { act, fireEvent, render, screen, waitFor } from "@app/utils/test";
import { mockAuthenticatedFetch } from "@app/vitest.setup.jsdom";
import { beforeEach, describe, expect, it } from "vitest";

import { SettingsContext } from ".";
import { SettingsProvider } from "./provider";

describe("SettingsContext", () => {
  const initialSettings: GetSettingsResponse = {
    colorScheme: ColorScheme.LIGHT,
    displayFont: DisplayFont.SANS,
    displayFontSize: DisplayFontSize.MD,
    public: false,
    analyticsTracking: false,
  };

  beforeEach(() => {
    mockAuthenticatedFetch.mockResolvedValue(
      new Response(JSON.stringify(initialSettings), {
        status: 200,
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("fetches and provides initial settings values", async () => {
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

    expect(mockAuthenticatedFetch).toHaveBeenCalledWith(
      "/api/v1/user/settings",
      {
        method: "GET",
      },
    );
  });

  it("updates settings when updateSettings is called", async () => {
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

    mockAuthenticatedFetch.mockImplementationOnce(() =>
      Promise.resolve(
        new Response(JSON.stringify({ colorScheme: ColorScheme.DARK }), {
          status: 200,
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        }),
      ),
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Change color scheme"));
    });

    expect(mockAuthenticatedFetch).toHaveBeenCalledWith(
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

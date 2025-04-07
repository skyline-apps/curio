import { ClientProviders } from "@app/providers/ClientProviders";
import { act, fireEvent, render, screen, waitFor } from "@app/utils/test";
import { ColorScheme, DisplayFont, DisplayFontSize } from "@shared/db";
import type { GetSettingsResponse } from "@shared/v1/user/settings";
import { describe, expect, it, vi } from "vitest";

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

  it("fetches and provides initial settings values", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify(initialSettings), {
          status: 200,
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        }),
      ),
    );

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

    expect(global.fetch).toHaveBeenCalledWith("/api/v1/user/settings", {
      method: "GET",
    });
  });

  it("updates settings when updateSettings is called", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify(initialSettings), {
          status: 200,
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        }),
      ),
    );

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

    global.fetch = vi.fn(() =>
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

    expect(global.fetch).toHaveBeenCalledWith(
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

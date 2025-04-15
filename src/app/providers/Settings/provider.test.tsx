import { ClientProviders } from "@app/providers/ClientProviders";
import { ColorScheme, DisplayFont, DisplayFontSize } from "@app/schemas/db";
import { GetUserResponse } from "@app/schemas/v1/user";
import type { GetLabelsResponse } from "@app/schemas/v1/user/labels";
import type { GetSettingsResponse } from "@app/schemas/v1/user/settings";
import { act, fireEvent, render, screen, waitFor } from "@app/utils/test";
import { mockAuthenticatedFetch } from "@app/vitest.setup.jsdom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SettingsContext } from ".";
import { SettingsProvider } from "./provider";

vi.mock("@app/providers/User", () => ({
  useUser: () => ({
    user: { id: "123", email: "test@example.com" },
  }),
}));

describe("SettingsContext", () => {
  const initialSettings: GetSettingsResponse = {
    colorScheme: ColorScheme.LIGHT,
    displayFont: DisplayFont.SANS,
    displayFontSize: DisplayFontSize.MD,
    public: false,
    analyticsTracking: false,
  };

  const initialUser: GetUserResponse = {
    username: "testusername",
    newsletterEmail: null,
  };

  const labelsResponse: GetLabelsResponse = { labels: [] };

  beforeEach(() => {
    mockAuthenticatedFetch.mockImplementation((route: string) => {
      if (route === "/api/v1/user/settings") {
        return new Response(JSON.stringify(initialSettings), {
          status: 200,
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        });
      } else if (route === "/api/v1/user") {
        return new Response(JSON.stringify(initialUser), {
          status: 200,
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        });
      } else if (route === "/api/v1/user/labels") {
        return new Response(JSON.stringify(labelsResponse), {
          status: 200,
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        });
      } else if (route === "/api/v1/user/username") {
        return new Response(
          JSON.stringify({ updatedUsername: "newtestuser" }),
          {
            status: 200,
            headers: new Headers({
              "Content-Type": "application/json",
            }),
          },
        );
      }
    });
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

  it("changes username when changeUsername is called", async () => {
    render(
      <SettingsProvider>
        <SettingsContext.Consumer>
          {({ username, changeUsername }) => (
            <div>
              <button onClick={() => changeUsername("newtestuser")}>
                Change username
                <div data-testid="username">{username}</div>
              </button>
            </div>
          )}
        </SettingsContext.Consumer>
      </SettingsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("username")).toHaveTextContent("testuser");
    });

    act(() => {
      fireEvent.click(screen.getByText("Change username"));
    });

    await waitFor(() => {
      expect(mockAuthenticatedFetch).toHaveBeenCalledWith(
        "/api/v1/user/username",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: "123",
            username: "newtestuser",
          }),
        }),
      );
    });
  });
});

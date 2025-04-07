import {
  render,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react";
import React from "react";

import { AllProviders } from "./component";

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
): RenderResult => render(ui, { wrapper: AllProviders, ...options });
// re-export everything
export * from "@testing-library/react";
// override render method
export { customRender as render };

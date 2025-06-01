import { CurioLogo } from "@app/components/CurioBrand";
import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-8 gap-4">
          <div className="w-20">
            <CurioLogo />
          </div>
          <h1 className="text-lg font-bold">Something went wrong.</h1>
          <p className="text-sm text-secondary">
            An unexpected error has occurred. Please try reloading the page.
          </p>
          <button
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary-700 transition"
            onClick={this.handleReload}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

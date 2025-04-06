import { createLogger } from "@app/utils/logger";
import { Component, ErrorInfo, ReactNode } from "react";

const log = createLogger("markdown-error");

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class MarkdownErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_error: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    log.error("Markdown render error:", error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="text-sm text-danger p-2">
          Sorry, there was an error rendering this content.
        </div>
      );
    }

    return this.props.children;
  }
}

export default MarkdownErrorBoundary;

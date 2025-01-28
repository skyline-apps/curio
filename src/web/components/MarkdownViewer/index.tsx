import Markdown, { Options } from "react-markdown";

interface MarkdownViewerProps extends Options {}

const MarkdownViewer = (options: MarkdownViewerProps): JSX.Element => {
  return <Markdown {...options} />;
};

export default MarkdownViewer;

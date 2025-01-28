import Markdown, { Options } from "react-markdown";

interface MarkdownViewerProps extends Options {}

const MarkdownViewer = (options: MarkdownViewerProps): JSX.Element => {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <Markdown {...options} />
    </div>
  );
};

export default MarkdownViewer;

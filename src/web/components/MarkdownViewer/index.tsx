import Markdown, { Options } from "react-markdown";

interface MarkdownViewerProps extends Options {}

const MarkdownViewer = (options: MarkdownViewerProps): JSX.Element => {
  return (
    <div className="prose prose-slate max-w-none [&_*]:!text-default-foreground hover:prose-a:!text-primary dark:prose-invert">
      <Markdown {...options} />
    </div>
  );
};

export default MarkdownViewer;

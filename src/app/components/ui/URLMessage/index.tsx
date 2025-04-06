import { useSearchParams } from "react-router-dom";

interface URLMessageProps {
  fallbackMessage?: string;
}

const URLMessage: React.FC<URLMessageProps> = ({
  fallbackMessage,
}: URLMessageProps) => {
  const [searchParams] = useSearchParams();
  const success = searchParams.get("success");
  const error = searchParams.get("error");
  const message = searchParams.get("message");
  const content = success || error || message || fallbackMessage;
  return (
    <div className="flex flex-col gap-2 w-full max-w-md text-sm">
      <div className="text-foreground px-4">{content}</div>
    </div>
  );
};

export default URLMessage;

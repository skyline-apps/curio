import { useSearchParams } from "next/navigation";

interface URLMessageProps {
  fallbackMessage?: string;
}

const URLMessage: React.FC<URLMessageProps> = ({
  fallbackMessage,
}: URLMessageProps) => {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const error = searchParams.get("error");
  const message = searchParams.get("message");
  const content = success || error || message || fallbackMessage;
  return (
    <div className="flex flex-col gap-2 w-full max-w-md text-sm">
      {success && (
        <div className="text-foreground border-l-2 border-foreground px-4">
          {success}
        </div>
      )}
      {error && (
        <div className="text-destructive-foreground border-l-2 border-destructive-foreground px-4">
          {error}
        </div>
      )}
      <div className="text-foreground border-l-2 px-4">{content}</div>
    </div>
  );
};

export default URLMessage;

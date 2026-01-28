import Button from "@app/components/ui/Button";
import Spinner from "@app/components/ui/Spinner";
import { UnsubscribeResponse } from "@app/schemas/v1/public/user/unsubscribe";
import { handleAPIResponse, publicFetch } from "@app/utils/api";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const UnsubscribePage: React.FC = () => {
  const { profileId } = useParams<{ profileId: string }>();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!profileId) {
      setStatus("error");
      setMessage("Invalid unsubscribe link.");
      return;
    }

    const unsubscribe = async (): Promise<void> => {
      try {
        const response = await publicFetch("/api/v1/public/user/unsubscribe", {
          method: "POST",
          body: JSON.stringify({ profileId }),
        });
        const result = await handleAPIResponse<UnsubscribeResponse>(response);
        if (result.success) {
          setStatus("success");
          setMessage(result.message || "You have been unsubscribed.");
        } else {
          setStatus("error");
          setMessage(result.message || "Failed to unsubscribe.");
        }
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error ? error.message : "An error occurred.",
        );
      }
    };

    unsubscribe();
  }, [profileId]);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="flex flex-col gap-1 mb-4 text-center">
        <h1 className="text-lg text-center">Unsubscribe</h1>
      </div>
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-2">
            <Spinner />
            <p className="text-secondary text-sm">Unsubscribing you...</p>
          </div>
        )}
        {status === "success" && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm">{message}</p>
            <p className="text-secondary text-sm">
              You will no longer receive marketing emails from us.
            </p>
            <Button href="/home" color="primary" className="mt-4">
              Go Home
            </Button>
          </div>
        )}
        {status === "error" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-danger">{message}</p>
            <p className="text-secondary text-xs">
              If you believe this is an error, please contact support.
            </p>
            <Button href="/home" color="primary" className="mt-4">
              Go Home
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnsubscribePage;

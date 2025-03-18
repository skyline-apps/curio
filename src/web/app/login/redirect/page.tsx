"use client";
import { useSearchParams } from "next/navigation";

import Button from "@/components/ui/Button";

const RedirectPage: React.FC = () => {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const email = searchParams.get("email");

  if (!email || !redirectTo) {
    return (
      <div className="w-full flex flex-col items-center gap-4 py-16">
        <p className="text-danger">Invalid link.</p>
        <Button href="/">Go home</Button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-4 py-16">
      <h1>Log in</h1>
      <p className="text-xs text-secondary">Sign in as {email}?</p>
      <Button color="primary" href={redirectTo}>
        Continue
      </Button>
    </div>
  );
};

export default RedirectPage;

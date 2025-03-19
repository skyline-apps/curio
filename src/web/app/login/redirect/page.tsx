"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useContext } from "react";

import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { UserContext } from "@/providers/UserProvider";

const RedirectPage: React.FC = () => {
  const { user } = useContext(UserContext);
  const searchParams = useSearchParams();
  const router = useRouter();
  if (user && user.id) {
    // Already signed in; redirect to home
    router.push("/home");
    return <Spinner centered />;
  }
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

import { useState } from "react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { createClient } from "@/utils/supabase/client";

interface EmailSignInProps {}

const EmailSignIn: React.FC<EmailSignInProps> = ({}: EmailSignInProps) => {
  const supabase = createClient();
  const [email, setEmail] = useState<string>("");
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignInWithEmail = async (): Promise<void> => {
    setIsSigningIn(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/home`,
      },
    });
    setIsSigningIn(false);
    if (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <div
      id="email-signin-button"
      className="flex flex-col gap-2 items-center w-full"
    >
      <div className="flex gap-2 w-full">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button
          isDisabled={!email}
          isLoading={isSigningIn}
          onPress={handleSignInWithEmail}
          size="sm"
        >
          Sign in
        </Button>
      </div>
      <p className="text-danger text-sm">{errorMessage}</p>
    </div>
  );
};

export default EmailSignIn;

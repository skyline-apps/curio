import Button from "@app/components/ui/Button";
import Input from "@app/components/ui/Input";
import { useUser } from "@app/providers/User";
import { getSupabaseClient } from "@app/utils/supabase";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

type PasswordSignInProps = Record<never, never>;

const PasswordSignIn: React.FC<
  PasswordSignInProps
> = ({}: PasswordSignInProps) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { refreshUser } = useUser();
  const host = import.meta.env.VITE_CURIO_URL || location.origin;

  const navigate = useNavigate();

  const handleSignInWithEmail = async (): Promise<void> => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSigningIn(true);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setIsSigningIn(false);
    if (error) {
      setErrorMessage(error.message);
    } else {
      const response = await fetch(`${host}/api/auth/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        setErrorMessage(`Error logging in on backend: ${errorText}`);
      } else {
        setErrorMessage(null);
        refreshUser();
        navigate("/home");
      }
    }
  };

  return (
    <div
      id="email-signin-button"
      className="flex flex-col gap-2 items-center w-full"
    >
      <form
        className="flex flex-col gap-2 w-full"
        onSubmit={(e) => {
          e.preventDefault();
          handleSignInWithEmail();
        }}
      >
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          contrast
          className="grow"
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          contrast
          className="grow"
        />
        <Button
          isDisabled={!email}
          isLoading={isSigningIn}
          color="primary"
          type="submit"
          size="sm"
          className="shrink-0"
        >
          Sign in
        </Button>
      </form>
      <p className="text-danger text-sm">{errorMessage}</p>
      <p className="text-success text-sm">{successMessage}</p>
    </div>
  );
};

export default PasswordSignIn;

import FormMessage, { Message } from "@/components/FormMessage";
import { FormButton } from "@/components/Button";
import Input from "@/components/Input";
import { signInAction } from "@/app/(auth-pages)/actions";

interface LoginPageProps {
  searchParams: Message;
}

const LoginPage: React.FC<LoginPageProps> = ({
  searchParams,
}: LoginPageProps) => {
  return (
    <form className="flex-1 flex flex-col min-w-64">
      <h1 className="text-2xl font-medium">Log in</h1>
      <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
        <Input
          name="email"
          placeholder="you@example.com"
          label="Email"
          required
        />
        <FormButton formAction={signInAction} pendingText="Logging in...">
          Log in
        </FormButton>
        <FormMessage message={searchParams} />
      </div>
    </form>
  );
};

export default LoginPage;

import { redirect } from "next/navigation";

import { db, eq } from "@/db";
import { createClient } from "@/utils/supabase/server";
import { profiles } from "@/db/schema";

const HomePage: React.FC = async () => {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error(error);
  }

  if (!user) {
    return redirect("/login");
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, user.id),
  });

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          This is a protected page that you can only see as an authenticated
          user
        </div>
      </div>
      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl mb-4">Your user details</h2>
        <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
          {JSON.stringify(profile, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default HomePage;

import { type NextRequest, type NextResponse } from "next/server";
import { cookies } from "next/headers";

import { updateSession } from "@/utils/supabase/middleware";

export const middleware = async (
  request: NextRequest,
): Promise<NextResponse> => {
  const cookieStore = cookies();
  console.log("Cookies in middleware:", cookieStore.getAll()); // Log cookies to inspect them

  return await updateSession(request);
};

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * And the paths that are exactly
     * - /
     * - /login
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|login$|$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

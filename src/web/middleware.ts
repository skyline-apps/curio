// eslint-disable-next-line no-restricted-imports
import { type NextRequest, type NextResponse } from "next/server";

import { updateSession } from "@/utils/supabase/middleware";

export const middleware = async (
  request: NextRequest,
): Promise<NextResponse> => {
  return await updateSession(request);
};

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /auth
     * - /api/v1/health
     And the ones that are exactly
     * - /
     * - /login
     */
    "/((?!_next/static|_next/image|favicon.ico|auth|login$|api/v1/health|$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

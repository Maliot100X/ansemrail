import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/agents/:path*",
    "/terminal/:path*",
    "/signals/:path*",
    "/marketplace/:path*",
    "/skills/:path*",
    "/settings/:path*",
    "/trading/:path*",
    "/earnings/:path*",
    "/wallet/:path*",
    "/chat/:path*",
    "/analytics/:path*",
    "/portfolio/:path*",
    "/leaderboard/:path*",
    "/rewards/:path*",
  ],
};

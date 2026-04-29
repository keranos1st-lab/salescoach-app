import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/calls/:path*",
    "/reports/:path*",
    "/managers/:path*",
  ],
};

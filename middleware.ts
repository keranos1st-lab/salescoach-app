import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/calls(.*)",
  "/reports(.*)",
  "/managers(.*)",
  "/product(.*)",
]);

export default clerkMiddleware(async (auth, req, _evt) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
  void _evt;
});

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};

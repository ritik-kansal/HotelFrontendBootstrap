const protectedRoutes = {
  "/dashboard": true,
  "/profile": true,
  "/settings": true,
};

const routes = {
  "/dashboard": dashboard,
  "/profile": profile,
  "/settings": settings,
};

function isAuthenticated() {
  // Check if the user is authenticated
  const token = localStorage.getItem("token");
  if (!token) {
    // User is not authenticated, redirect to login page
    window.location.href = "/";
  }
}

function router() {
  // Get the requested route path
  const path = window.location.pathname;

  // Check if the route is protected
  const isProtected = Object.keys(protectedRoutes).includes(path);

  // Check if the user is authenticated for protected routes
  if (isProtected) {
    isAuthenticated();
  }

  // Execute the corresponding function for the requested route
  const routeFunction = routes[path];
  if (routeFunction) {
    routeFunction();
  }
}

window.onload = router;
window.onpopstate = router;

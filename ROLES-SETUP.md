# Exercise 6: role-based access (5d-5k)

Branches: backend `feature/exercise-6-backend-roles`, frontend `feature/exercise-6-frontend-roles`. These build on the backend-login and frontend-account branches; main is unchanged.

## Behavior

Only the exact role `admin` allows company GET/POST and job POST. Authenticated freelancers can read jobs, use filters and view details, but cannot see Companies navigation or the Create Job form. The account page displays assigned roles. Missing or malformed role claims grant no admin access. Existing business validation remains in place.

The supplied Moodle UserService is integrated with null/type checks. As a security adaptation, GET `/api/account` returns the subject and roles from Spring Security's validated access-token JWT. The frontend requests this endpoint server-side with its bearer token and matches the subject against Auth0 userinfo. It never trusts an unsigned decoded token or a user-editable role cookie. If this request fails, admin UI access stays denied. This adds an endpoint beyond the example files.

The admin job form loads companies on the server and offers a company selector. Freelancer page loads make no company request.

## Auth0 and local setup

Keep existing AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_AUDIENCE and API_BASE_URL values in the local frontend .env. Keep backend issuer/audience and Mongo configuration. No new environment variable or secret is required. Do not commit .env.

In Auth0, create the exact role `admin` and assign it only to the intended administrator. A deployed Post Login Action attached to the Login flow must put assigned roles into both tokens:

```js
exports.onExecutePostLogin = async (event, api) => {
  const roles = event.authorization?.roles ?? [];
  api.idToken.setCustomClaim('user_roles', roles);
  api.accessToken.setCustomClaim('user_roles', roles);
};
```

Log out and log back in after assigning a role or changing the Action. Existing tokens keep their old claims. Use a separate account without admin to verify freelancer access. Both backend and frontend role branches must run together.

## Verification

Backend: 14 tests pass, including 401 without authentication, 403 for non-admin company GET/POST and job POST, admin success, freelancer job reads, and malformed role claims.
Frontend: 18 tests pass, including verified-role identity checking, fail-closed behavior, and conditional company loading. Svelte check, targeted ESLint and production build pass.

Live tenant verification still requires both real accounts: freelancer sees jobs and account but no Companies/Create Job; admin sees Companies, creates companies/jobs, and sees admin under Account. Direct freelancer company and job-create API requests must return 403. Issues remain open until this live check; the commit part of 5k is done, issue closure is pending. No merge is performed.
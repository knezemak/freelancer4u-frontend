# Exercise 6: frontend login and secured backend requests

This branch includes exercise 2, frontend exercise 3a-g, and the bearer forwarding
from the following backend-login section (h-i). The backend lives
in `knezemak/freelancer4u`; `knezemak/freelancer4u-backend` is empty.

## Start locally

```powershell
npm.cmd ci
Copy-Item .env.example .env
# Fill AUTH0_DOMAIN and AUTH0_CLIENT_ID in .env, then:
npm.cmd run dev
```

Use the real Auth0 tenant hostname (without https:// or trailing slash) and the
Client ID of your Single Page Application. No Client Secret is needed or committed.
The landing page works without Auth0 values; authentication returns a configuration
message until they are supplied. Restart the server after editing .env.

For the secured Java backend, also add `AUTH0_AUDIENCE` to `.env`: the Identifier of
your own Auth0 API under Applications > APIs. Use the same value in the backend.
This is not the SPA Client ID or the Auth0 Management API. The API must issue RS256
signed access tokens; encrypted JWE tokens cannot be verified with public JWKS alone.
After adding it, restart both servers and log out/in to obtain a fresh API token.
Without the audience, signup is stopped before creating an account.

## External Auth0 settings still required

- Enable the `Username-Password-Authentication` database connection for the application
  and allow signups there.
- For the exercise's email/password flow, enable the Password grant in Advanced
  Settings / Grant Types and set the tenant's Default Directory under API
  Authorization Settings to `Username-Password-Authentication`. Save both changes.
- Review the application's localhost Application URIs and cross-origin settings
  against exercise 1 for `http://localhost:5173`. This implementation sends login
  and signup requests from the SvelteKit server, without a browser callback.
- Add `http://localhost:5173/` to Allowed Logout URLs. Logout now uses the supplied
  Moodle flow through Auth0 `/v2/logout`. Add the exact HTTPS origin for deployments.
- Test signup using a separate test account, automatic login, existing-user login,
  logout, invalid passwords and expired sessions once real values are available.

## Moodle integration and scope

The eight frontend Moodle files supplied later are now integrated with adaptations:
the login and signup markup and layout loader come from the originals; server actions,
hook and service follow their flow using the existing validated service infrastructure.
Signup uses the Moodle named action `?/signup`, forwards optional first/last names,
and logs in automatically. Logout clears cookies and redirects through Auth0.
The forms use local CSS for their Bootstrap-style classes, typed props, browser and
server validation, and corrected login links. Native fetch replaces axios to avoid
an unnecessary dependency. No role-related two-second delay is included in this scope.

Security deviations from the original examples: no token or raw error logging, no
Management API audience, no unvalidated ID-token/user-info cookies and no wildcard
CORS response to arbitrary OPTIONS requests. Instead, tokens stay in an
HttpOnly, SameSite=Lax cookie, secure on HTTPS, and are never returned in page data
or logged. Userinfo validates sessions; cookie contents are not trusted as identity.
Use HTTPS outside local development. SvelteKit's form origin checks remain enabled.
Logout clears this application's cookies and ends the Auth0 browser session; it does
not revoke already issued tokens. If Auth0 is unconfigured, local logout still works.

The PDF's three environment declarations are retained; optional empty Auth0 values
allow the app to build before tenant setup. The original job list moved from `/`
to `/jobs`; existing company and job functionality remains. Both route families
redirect anonymous visitors to `/login`.

The Java backend on `feature/exercise-6-backend-login` now validates bearer access
tokens including signature, issuer, expiry and audience. Browser requests for
companies, jobs, filters, creation and details use same-origin `/api/...`; the
SvelteKit server adds the access token from `locals.jwt_token`. Tokens are never
sent as page data or exposed to JavaScript. The proxy only allows the existing API
resources/methods, preserves Java response status, rejects cross-origin writes,
filters cookies and rejects upstream redirects. `API_BASE_URL` is server-only.
The assign/complete/dashboard API methods are supported without new UI.
Exercise 4 adds `/account` with Account Details (picture, name, nickname, first and
last name, email). The Account navigation item is only shown after login. Anonymous
visitors see "Not logged in"; optional missing profile fields display a dash. The
server exposes only these display fields, with HTTPS-only profile pictures. It
does not expose the raw provider response or tokens. No additional Auth0 setting
is required; an account created without first/last name may not have those fields.
No role-based restrictions or merges are included. Issues remain open.

## Verification

- `npm.cmd run check`: no errors or warnings.
- `npm.cmd run build`: passed locally (adapter-auto still needs a deployment target
  for production).
- `node --test tests/*.test.mjs`: fourteen tests pass, including account profile filtering, authentication and
  bearer proxy scenarios,
  using simulated Auth0 responses; these do not prove live tenant configuration.
- Live signup/login and company/job backend integration have not been verified.

References: https://auth0.com/docs/api/authentication and
https://svelte.dev/tutorial/kit/env-private.

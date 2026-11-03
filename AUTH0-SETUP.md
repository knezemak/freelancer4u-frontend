# Exercise 6: frontend login through 3g

This branch implements only exercise 2 and frontend exercise 3a-g. The backend lives
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

The access token can be opaque when no custom API audience is configured. The
`locals.jwt_token` compatibility name does not imply that it is already a JWT for
the Java API. Backend security, API audience and bearer forwarding belong to the
later exercises and are deliberately not implemented. The Java API is still public.
No roles, admin pages or merges are included. Issues remain open.

## Verification

- `npm.cmd run check`: no errors or warnings.
- `npm.cmd run build`: passed locally (adapter-auto still needs a deployment target
  for production).
- `node --test tests/auth.test.mjs`: seven scenarios plus the parent test pass,
  using simulated Auth0 responses; these do not prove live tenant configuration.
- Live signup/login and company/job backend integration have not been verified.

References: https://auth0.com/docs/api/authentication and
https://svelte.dev/tutorial/kit/env-private.

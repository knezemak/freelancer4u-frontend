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
- Test signup using a separate test account, automatic login, existing-user login,
  logout, invalid passwords and expired sessions once real values are available.

## Replacements and scope

Moodle examples were not available among the attached files or in either populated
repository. The hook, auth service, layout loader and form routes are replacements.
They use Auth0's signup, password-token and userinfo endpoints. Tokens stay in an
HttpOnly, SameSite=Lax cookie, secure on HTTPS, and are never returned in page data
or logged. Userinfo validates sessions; cookie contents are not trusted as identity.
Use HTTPS outside local development. SvelteKit's form origin checks remain enabled.
Logout clears this application's cookie; it does not revoke an already issued token
or terminate other applications' Auth0 sessions.

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
- `node --test tests/auth.test.mjs`: six service scenarios plus the parent test pass,
  using simulated Auth0 responses; these do not prove live tenant configuration.
- Live signup/login and company/job backend integration have not been verified.

References: https://auth0.com/docs/api/authentication and
https://svelte.dev/tutorial/kit/env-private.

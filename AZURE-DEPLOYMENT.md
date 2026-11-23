# Exercise 10: Azure deployment

## Created resources

- Subscription: Azure for Students.
- Region: Spain Central (Switzerland North and West Europe were rejected by the subscription policy).
- Resource group: `zhaw-exercise-knezemak_group`.
- Shared plan: `se2-freelancer-plan`, Linux Free F1.
- Frontend app: `zhaw-exercise-knezemak-frontend`.
- Frontend origin: `https://zhaw-exercise-knezemak-frontend-grh5feckgtevd3ee.spaincentral-01.azurewebsites.net`.
- Backend app: `zhaw-exercise-knezemak`.
- Backend base URL: `https://zhaw-exercise-knezemak-fud8dxhve7bze4gg.spaincentral-01.azurewebsites.net`.

The Azure resources initially run Microsoft's placeholder container, not Freelancer4U.

## Frontend runtime values (Azure environment variables, not build arguments)

```dotenv
API_BASE_URL=https://zhaw-exercise-knezemak-fud8dxhve7bze4gg.spaincentral-01.azurewebsites.net
ORIGIN=https://zhaw-exercise-knezemak-frontend-grh5feckgtevd3ee.spaincentral-01.azurewebsites.net
AUTH0_DOMAIN=your-existing-tenant-domain
AUTH0_CLIENT_ID=your-existing-application-client-id
AUTH0_AUDIENCE=https://freelancer4u-api
PORT=3000
WEBSITES_PORT=3000
DOCKER_REGISTRY_SERVER_URL=https://ghcr.io
DOCKER_REGISTRY_SERVER_USERNAME=knezemak
DOCKER_REGISTRY_SERVER_PASSWORD=your-private-registry-read-token
```

Use the existing real Auth0 values. No client secret or password belongs in this file.
For a sidecar-enabled App Service, set the main container target port to **3000** in Deployment Center; `WEBSITES_PORT` alone does not configure sidecar routing. Keep HTTPS enabled.

## Remaining portal setup

1. Enable SCM basic publishing authentication for the frontend (backend already enabled). Leave FTP basic authentication off.
2. The exercise requests a classic GitHub PAT with `repo` and `read:packages`. Create it yourself with an expiry. It is a credential; never paste it into issues, commits or chat. Store it only as the private Azure registry password for both apps.
3. Save the runtime variables above in Azure. For the backend use `MONGODB_URI`, `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `SERVER_PORT=8080`, `WEBSITES_PORT=8080` and the same private-registry settings. Configure its main-container target port to **8080**.
4. Download each app's publish profile and store it only in that app's repository Actions secret `AZURE_WEBAPP_PUBLISH_PROFILE`. Set `AZURE_WEBAPP_NAME` to the matching app name. These profiles contain deployment credentials; do not commit them.
5. Add the frontend HTTPS origin above to the existing Auth0 application Allowed Callback URLs, Allowed Logout URLs, Allowed Web Origins and Allowed Origins (CORS). Keep all localhost entries. This app uses server-side password login; no invented callback route is required.

## Code and workflow

`Dockerfile` creates a standalone Node 24 production server with adapter-node. The final image runs as the Node user and contains no .env files or development source. SvelteKit keeps CSRF checks enabled. `ORIGIN` is supplied at runtime behind Azure's HTTPS proxy; the exercise's local and configured origins are also explicitly allowlisted in vite.config.ts.

The supplied `azure-container-webapp.yml` is adapted for `main`, with a test job before deployment. PRs validate checks, tests, production build and Docker build without pushing images or using production credentials. Only main pushes or manual runs on main can publish a SHA-tagged image to GHCR and deploy. Missing Azure secrets fail explicitly. Deployments are serialized. Existing CI is retained.

The Moodle Dockerfiles were not supplied/found; these Dockerfiles are compatible replacements. Docker was unavailable locally, so the actual container build is checked by the PR workflow. The Azure deployment cannot be claimed complete until credentials, target ports and Auth0 URLs are configured and the live login/jobs flow has been tested.

## Validation after setup

Check the deployment Action and Azure container logs. Open the frontend HTTPS URL, sign in, load jobs and companies according to the account's role, perform an allowed job action, and log out. Direct anonymous access to the protected backend returning 401 is expected. Do not close the deployment work merely because Azure created the placeholder Web Apps.

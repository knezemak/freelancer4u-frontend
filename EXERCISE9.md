# Exercise 9: pagination and job ownership

Backend: knezemak/freelancer4u. Frontend: knezemak/freelancer4u-frontend. The supplied exercise-8 solution was reviewed as a reference; the existing repositories and secure test setup are retained.

## Implemented

- GET /api/job and GET /api/company return Page objects with content, totalPages, totalElements, number and size. Requests use one-based pageNumber (default 1) and pageSize (default 4). Sizes 1–100 are accepted; invalid parameters return 400. Sorting by ID keeps page ordering deterministic.
- Jobs support min (earnings strictly greater), type, both filters or neither. Frontend links preserve filters and pageSize; changing filters starts at page 1. The UI also offers 20 and 50 items per page.
- Company listing and creation stay admin-only. The job-creation company selector has separate 20-item pages so companies beyond the first API page remain accessible. Save entered form data before changing this selector page.
- Legacy PUT /api/service/assignjob and /completejob now require admin.
- PUT /api/service/me/assignjob?jobId=... and /api/service/me/completejob?jobId=... use only email from Spring Security's verified access-token JWT. A missing, blank or malformed email claim returns 403. Caller-supplied freelancerId is ignored by these endpoints.
- Assignment requires a NEW/unassigned job; completion requires ASSIGNED and the same email. Atomic MongoDB updates prevent simultaneous assignment races. Invalid state, wrong owner or missing job returns 400 without mutation.
- Frontend server actions assignToMe/completeMyJob refresh the page after success. NEW jobs with null or empty freelancerId show Assign to me. ASSIGNED jobs show Assigned; only the owner sees Complete Job. DONE jobs show Done. Tokens are never exposed in page data.

## Auth0 step required for real accounts

An email in /userinfo or the ID token alone is insufficient: the backend reads the access token. Extend the existing Auth0 Post Login Action without removing its roles configuration:

```js
exports.onExecutePostLogin = async (event, api) => {
  const roles = event.authorization?.roles ?? [];
  api.idToken.setCustomClaim('user_roles', roles);
  api.accessToken.setCustomClaim('user_roles', roles);
  if (event.user.email) {
    api.accessToken.setCustomClaim('email', event.user.email);
  }
};
```

Deploy the Action and attach/apply it to the Login trigger. Then log out and log back in to obtain a fresh access token for your existing AUTH0_AUDIENCE. No new domain, Client ID, secret or .env value is needed. Keep real tokens and credentials private. This external Auth0 change has not been performed by this implementation.

## Verification

Backend: `.\mvnw.cmd clean verify` (Java 25). Integration tests cover paging defaults, distinct pages, filters, empty pages, invalid parameters, company authorization, self-assignment, wrong-owner completion, missing/malformed email, admin legacy endpoints and transitions to DONE. Existing voucher/security tests remain enabled.

Frontend: `npm.cmd run check`, `node --test tests/*.test.mjs`, `npm.cmd run build`; targeted ESLint on changed components/helpers. Tests cover server loads/actions, bearer forwarding, query encoding, filters and owner/state-dependent controls. Test data is isolated and no production records are created.

Live manual check after updating both repositories and the Auth0 Action:
1. With enough jobs/companies, navigate pages (including pageSize=20), combine min/type, and verify filters persist.
2. As a freelancer, confirm Companies/create form are absent. Assign a NEW job; it becomes ASSIGNED with your email.
3. As another account, verify Complete Job is absent and direct completion of that job is rejected.
4. As the owner, complete the job; it becomes DONE and cannot be assigned/completed again.
5. As admin, check Company pagination and create a job using a company beyond the first selector page.

The real two-account/Auth0/MongoDB check remains manual. Issues stay open until it is confirmed.

## Adaptations to the PDF

- The complete endpoint is consistently /api/service/me/completejob, matching the controller's /api/service prefix. The PDF's /api/me/completejob references omit that prefix.
- Existing class-level /api/job and /api/company mappings are retained; no duplicate /job mapping is added.
- SvelteKit 3 uses the project's #lib aliases. Existing local CSS is used for the pagination component instead of adding Bootstrap solely for this page.
- Default size 4 follows the detailed exercise examples; 20 is selectable as in the introductory screenshot. The sample solution's optional values are validated rather than allowed to cause server errors.

Submission: push both repositories (done through feature branches/PRs) and submit both repository URLs on Moodle. Moodle submission and any instructor-access settings remain with the repository owner.

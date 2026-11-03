import { authAction } from '#lib/server/auth-action.js';
// Moodle default POST action with shared validation and redacted errors.
export const actions = { default: authAction() };

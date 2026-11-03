import { authAction } from '#lib/server/auth-action.js';
// Named action used by the Moodle signup form (action="?/signup").
export const actions = { signup: authAction(true) };

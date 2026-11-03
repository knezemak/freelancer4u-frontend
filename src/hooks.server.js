import { redirect } from '@sveltejs/kit';
import { readSession } from '#lib/server/auth.service.js';

// Adapted Moodle hook: expose the same locals, verifying the session with Auth0
// rather than trusting the user_info cookie or the presence of user.name.
export async function handle({ event, resolve }) {
	const session = await readSession(event.cookies);
	event.locals.user = session.user;
	event.locals.jwt_token = session.jwt_token;
	event.locals.isAuthenticated = Boolean(session.user);
	if (/^\/(companies|jobs)(\/|$)/.test(event.url.pathname) && !session.user) {
		redirect(303, '/login');
	}
	const response = await resolve(event);
	// Authenticated HTML and form responses must not be shared between users.
	response.headers.set('Cache-Control', 'private, no-store');
	return response;
}

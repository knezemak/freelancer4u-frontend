import { fail, redirect } from '@sveltejs/kit';
import auth, { AuthError } from './auth.service.js';

export function authAction(register = false) {
	/** @param {import('@sveltejs/kit').RequestEvent} event */
	return async ({ request, cookies, url }) => {
		const data = await request.formData();
		const email = data.get('email');
		const password = data.get('password');
		const firstName = data.get('firstName') ?? '';
		const lastName = data.get('lastName') ?? '';
		if (
			typeof email !== 'string' ||
			typeof password !== 'string' ||
			!/^\S+@\S+\.\S+$/.test(email) ||
			email.length > 254 ||
			!password ||
			password.length > 1024
		) {
			return fail(400, { error: 'Enter a valid email and password.' });
		}
		if (
			typeof firstName !== 'string' ||
			typeof lastName !== 'string' ||
			firstName.length > 100 ||
			lastName.length > 100
		) {
			return fail(400, { error: 'Names must contain at most 100 characters.' });
		}
		try {
			if (register) {
				await auth.signup(
					email.trim(),
					password,
					cookies,
					url.protocol === 'https:',
					firstName.trim(),
					lastName.trim()
				);
			} else {
				await auth.login(email.trim(), password, cookies, url.protocol === 'https:');
			}
		} catch (error) {
			return fail(error instanceof AuthError ? error.status : 503, {
				error:
					error instanceof AuthError ? error.message : 'Authentication is temporarily unavailable.'
			});
		}
		redirect(303, '/');
	};
}

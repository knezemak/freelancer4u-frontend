import { AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_AUDIENCE, API_BASE_URL } from '$app/env/private';
import { verifiedRoles } from './verified-roles.js';

const COOKIE = 'auth0_access_token';

export class AuthError extends Error {
	/** @param {string} message @param {number} [status] */
	constructor(message, status = 400) {
		super(message);
		this.status = status;
	}
}

function configuration() {
	if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID || !/^[a-z0-9.-]+$/i.test(AUTH0_DOMAIN)) {
		throw new AuthError(
			'Auth0 is not configured. Set AUTH0_DOMAIN and AUTH0_CLIENT_ID in .env.',
			503
		);
	}
	return { base: `https://${AUTH0_DOMAIN}`, clientId: AUTH0_CLIENT_ID };
}

/** @param {string} path @param {RequestInit} options */
async function authRequest(path, options) {
	const { base } = configuration();
	let response;
	try {
		response = await fetch(`${base}${path}`, { ...options, signal: AbortSignal.timeout(10000) });
	} catch {
		throw new AuthError(
			'Authentication service is temporarily unavailable. Please try again.',
			503
		);
	}
	if (!response.ok) {
		// Never expose provider responses, passwords or tokens in logs or form data.
		if (response.status === 429)
			throw new AuthError('Too many attempts. Please try again later.', 429);
		throw new AuthError(
			path === '/dbconnections/signup'
				? 'Registration failed. Check the email and password policy, or try logging in.'
				: 'Login failed. Check your email and password.',
			response.status >= 500 ? 503 : 400
		);
	}
	return response.json();
}

/** @param {string} token */
export async function getUser(token) {
	const user = await authRequest('/userinfo', { headers: { Authorization: `Bearer ${token}` } });
	if (typeof user.sub !== 'string') throw new AuthError('Invalid user profile.');
	// Only expose fields needed by the account page, never the raw provider response.
	return {
		sub: user.sub,
		name:
			profileString(user.name) ||
			profileString(user.nickname) ||
			profileString(user.email) ||
			user.sub,
		nickname: profileString(user.nickname),
		given_name: profileString(user.given_name),
		family_name: profileString(user.family_name),
		email: profileString(user.email),
		picture: profilePicture(user.picture),
		...(await verifiedRoles(token, user.sub, API_BASE_URL))
	};
}

/** @param {unknown} value */
function profileString(value) {
	return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/** @param {unknown} value */
function profilePicture(value) {
	if (typeof value !== 'string') return undefined;
	try {
		const url = new URL(value);
		return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined;
	} catch {
		return undefined;
	}
}

/** @param {string} email @param {string} password @param {import('@sveltejs/kit').Cookies} cookies @param {boolean} secure */
export async function login(email, password, cookies, secure) {
	const { clientId } = configuration();
	if (!AUTH0_AUDIENCE) {
		throw new AuthError(
			'Set AUTH0_AUDIENCE in .env to the Identifier of your Freelancer4U API in Auth0.',
			503
		);
	}
	const result = await authRequest('/oauth/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			grant_type: 'password',
			client_id: clientId,
			username: email,
			password,
			audience: AUTH0_AUDIENCE,
			scope: 'openid profile email'
		})
	});
	if (
		typeof result.access_token !== 'string' ||
		!Number.isFinite(result.expires_in) ||
		result.expires_in <= 0
	) {
		throw new AuthError('Invalid authentication response.', 503);
	}
	await getUser(result.access_token);
	cookies.set(COOKIE, result.access_token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure,
		maxAge: Math.min(result.expires_in, 86400)
	});
}

/** Moodle signup fields, with server validation and without credential logging.
 * @param {string} email @param {string} password @param {import('@sveltejs/kit').Cookies} cookies @param {boolean} secure
 * @param {string} [firstName] @param {string} [lastName]
 */
export async function signup(email, password, cookies, secure, firstName = '', lastName = '') {
	const { clientId } = configuration();
	// Check before creating an account, so missing API setup cannot cause a partial signup.
	if (!AUTH0_AUDIENCE) {
		throw new AuthError(
			'Set AUTH0_AUDIENCE in .env to the Identifier of your Freelancer4U API in Auth0.',
			503
		);
	}
	await authRequest('/dbconnections/signup', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			client_id: clientId,
			email,
			password,
			connection: 'Username-Password-Authentication',
			...(firstName ? { given_name: firstName } : {}),
			...(lastName ? { family_name: lastName } : {})
		})
	});
	try {
		await login(email, password, cookies, secure);
	} catch {
		throw new AuthError(
			'Account created, but automatic login failed. Please log in; do not register again.'
		);
	}
}

/** @param {import('@sveltejs/kit').Cookies} cookies */
export function logout(cookies) {
	cookies.delete(COOKIE, { path: '/' });
	// Also remove cookies left by the unmodified Moodle example.
	cookies.delete('jwt_token', { path: '/' });
	cookies.delete('user_info', { path: '/' });
}

/** @param {string} origin */
export function getLogoutUrl(origin) {
	const { base, clientId } = configuration();
	const target = new URL('/v2/logout', base);
	target.searchParams.set('client_id', clientId);
	target.searchParams.set('returnTo', `${origin}/`);
	return target;
}

// Keep the Moodle service interface for the supplied page actions.
const auth = { login, signup };
export default auth;

/** @param {import('@sveltejs/kit').Cookies} cookies */
export async function readSession(cookies) {
	const token = cookies.get(COOKIE);
	if (!token) return { user: null, jwt_token: null };
	try {
		return { user: await getUser(token), jwt_token: token };
	} catch (error) {
		if (error instanceof AuthError && error.status !== 503 && error.status !== 429) logout(cookies);
		return { user: null, jwt_token: null };
	}
}

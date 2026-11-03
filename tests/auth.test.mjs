import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { test } from 'node:test';

// Inject only configuration and the network boundary; exercise the real service.
const source = (
	await readFile(new URL('../src/lib/server/auth.service.js', import.meta.url), 'utf8')
).replace(
	"import { AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_AUDIENCE } from '$app/env/private';",
	"const AUTH0_DOMAIN = 'tenant.invalid', AUTH0_CLIENT_ID = 'test-only', AUTH0_AUDIENCE = 'test-api';"
);
const auth = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
function jar(token) {
	return {
		value: token,
		options: null,
		get() {
			return this.value;
		},
		set(_name, value, options) {
			this.value = value;
			this.options = options;
		},
		delete() {
			this.value = undefined;
		}
	};
}

test('Auth0 logout uses the configured host and safely encoded return origin', () => {
	const target = auth.getLogoutUrl('https://frontend.example');
	assert.equal(target.origin, 'https://tenant.invalid');
	assert.equal(target.pathname, '/v2/logout');
	assert.equal(target.searchParams.get('client_id'), 'test-only');
	assert.equal(target.searchParams.get('returnTo'), 'https://frontend.example/');
});

test('Auth0 lifecycle and failure boundaries', async (t) => {
	const original = globalThis.fetch;
	t.after(() => {
		globalThis.fetch = original;
	});
	await t.test('anonymous session does not call Auth0', async () => {
		globalThis.fetch = () => {
			throw new Error('unexpected network');
		};
		assert.deepEqual(await auth.readSession(jar()), { user: null, jwt_token: null });
	});
	await t.test('account profile exposes only display fields and an HTTPS picture', async () => {
		globalThis.fetch = async () =>
			Response.json({
				sub: 'auth0|test',
				name: 'Ada Lovelace',
				nickname: 'ada',
				given_name: 'Ada',
				family_name: 'Lovelace',
				email: 'ada@example.invalid',
				picture: 'https://images.example/ada.png',
				access_token: 'must-not-leak',
				private_metadata: { secret: 'must-not-leak' }
			});
		const user = await auth.getUser('test-token');
		assert.deepEqual(user, {
			sub: 'auth0|test',
			name: 'Ada Lovelace',
			nickname: 'ada',
			given_name: 'Ada',
			family_name: 'Lovelace',
			email: 'ada@example.invalid',
			picture: 'https://images.example/ada.png'
		});
	});
	await t.test('missing optional fields and unsafe profile image are harmless', async () => {
		globalThis.fetch = async () =>
			Response.json({
				sub: 'auth0|test',
				nickname: 'ada',
				picture: 'javascript:alert(1)',
				given_name: { invalid: true }
			});
		const user = await auth.getUser('test-token');
		assert.equal(user.name, 'ada');
		assert.equal(user.picture, undefined);
		assert.equal(user.given_name, undefined);
		assert.equal(user.email, undefined);
	});
	await t.test('signup logs in automatically and sets a protected expiring cookie', async () => {
		const calls = [];
		globalThis.fetch = async (url, options) => {
			calls.push({ url, options });
			return Response.json(
				url.endsWith('/oauth/token')
					? { access_token: 'test-token', expires_in: 3600 }
					: url.endsWith('/userinfo')
						? { sub: 'auth0|test', name: 'Test User' }
						: {}
			);
		};
		const cookies = jar();
		await auth.signup('test@example.invalid', 'test-password', cookies, true, 'Ada', 'Lovelace');
		assert.equal(JSON.parse(calls[0].options.body).given_name, 'Ada');
		assert.equal(JSON.parse(calls[0].options.body).family_name, 'Lovelace');
		assert.equal(JSON.parse(calls[1].options.body).audience, 'test-api');
		assert.deepEqual(
			calls.map((c) => new URL(c.url).pathname),
			['/dbconnections/signup', '/oauth/token', '/userinfo']
		);
		assert.equal(JSON.parse(calls[1].options.body).grant_type, 'password');
		assert.equal(cookies.value, 'test-token');
		assert.deepEqual(cookies.options, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: true,
			maxAge: 3600
		});
		assert.equal((await auth.readSession(cookies)).user.name, 'Test User');
		auth.logout(cookies);
		assert.equal(cookies.value, undefined);
	});
	await t.test('rejected token clears cookie and never authenticates', async () => {
		globalThis.fetch = async () => new Response('provider-sensitive-detail', { status: 401 });
		const cookies = jar('invalid');
		assert.equal((await auth.readSession(cookies)).user, null);
		assert.equal(cookies.value, undefined);
	});
	await t.test('wrong password never writes cookie or leaks provider details', async () => {
		globalThis.fetch = async () => new Response('provider-sensitive-detail', { status: 403 });
		const cookies = jar();
		await assert.rejects(
			auth.login('test@example.invalid', 'wrong', cookies, false),
			/Login failed/
		);
		assert.equal(cookies.value, undefined);
	});
	await t.test('provider outage fails closed without destroying session', async () => {
		globalThis.fetch = async () => {
			throw new Error('network');
		};
		const cookies = jar('existing');
		assert.equal((await auth.readSession(cookies)).user, null);
		assert.equal(cookies.value, 'existing');
	});
	await t.test('partial signup failure explains account already exists', async () => {
		globalThis.fetch = async (url) =>
			url.endsWith('/dbconnections/signup') ? Response.json({}) : new Response('', { status: 403 });
		await assert.rejects(
			auth.signup('test@example.invalid', 'password', jar(), false),
			/Account created/
		);
	});
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { verifiedRoles } from '../src/lib/server/verified-roles.js';

test('roles come from bearer-authenticated backend and match the Auth0 subject', async () => {
	const result = await verifiedRoles(
		'token',
		'user1',
		'http://localhost:8080',
		async (url, options) => {
			assert.equal(url.href, 'http://localhost:8080/api/account');
			assert.equal(options.headers.Authorization, 'Bearer token');
			assert.equal(options.redirect, 'manual');
			return Response.json({ sub: 'user1', user_roles: ['admin', 'admin', 123] });
		}
	);
	assert.deepEqual(result, { user_roles: ['admin'], rolesAvailable: true });
});

test('roles verification fails closed on wrong identity, malformed roles, HTTP error or outage', async () => {
	for (const send of [
		async () => Response.json({ sub: 'other', user_roles: ['admin'] }),
		async () => Response.json({ sub: 'user1', user_roles: 'admin' }),
		async () => new Response('', { status: 401 }),
		async () => {
			throw new Error('offline');
		}
	]) {
		assert.deepEqual(await verifiedRoles('token', 'user1', 'http://localhost:8080', send), {
			user_roles: [],
			rolesAvailable: false
		});
	}
});

const source = (
	await readFile(new URL('../src/routes/jobs/+page.server.js', import.meta.url), 'utf8')
)
	.replace(
		"import { API_BASE_URL } from '$app/env/private';",
		"const API_BASE_URL = 'http://localhost:8080';"
	)
	.replace(
		"import { error } from '@sveltejs/kit';",
		'function error(status,message) { throw Object.assign(new Error(message),{status}); }'
	);
const { load } = await import(
	`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
);

test('freelancers never load companies when visiting Jobs', async () => {
	const result = await load({
		locals: { user: { user_roles: [] } },
		fetch: async () => {
			throw new Error('must not fetch companies');
		}
	});
	assert.deepEqual(result, { companies: [], companiesError: null });
});

test('admins load company options with bearer header', async () => {
	const result = await load({
		locals: { user: { user_roles: ['admin'] }, jwt_token: 'token' },
		fetch: async (url, options) => {
			assert.equal(url.href, 'http://localhost:8080/api/company');
			assert.equal(options.headers.Authorization, 'Bearer token');
			return Response.json([{ id: 'c1', name: 'Company' }]);
		}
	});
	assert.deepEqual(result.companies, [{ id: 'c1', name: 'Company' }]);
});

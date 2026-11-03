import { test } from 'node:test';
import assert from 'node:assert/strict';
import { forwardApiRequest, allowedApiRequest } from '../src/lib/server/api-proxy.js';

const base = 'https://frontend.example';
test('API request forwards the server token and filters browser credentials', async () => {
	const incoming = new Request(`${base}/api/job?min=100&type=TEST`, {
		headers: { Cookie: 'private=value', Authorization: 'Bearer attacker' }
	});
	const response = await forwardApiRequest(
		incoming,
		'job',
		'server-token',
		'https://backend.example',
		async (url, init) => {
			assert.equal(url.href, 'https://backend.example/api/job?min=100&type=TEST');
			assert.equal(init.headers.get('Authorization'), 'Bearer server-token');
			assert.equal(init.headers.get('Cookie'), null);
			assert.equal(init.redirect, 'manual');
			return Response.json([{ id: 'job1' }], { headers: { 'Set-Cookie': 'backend=value' } });
		}
	);
	assert.equal(response.status, 200);
	assert.equal(response.headers.get('Set-Cookie'), null);
	assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
	assert.deepEqual(await response.json(), [{ id: 'job1' }]);
});

test('POST and PUT preserve JSON data and do not require browser token access', async () => {
	for (const [path, method] of [
		['company', 'POST'],
		['job', 'POST'],
		['service/assignjob', 'PUT'],
		['service/completejob', 'PUT']
	]) {
		const request = new Request(`${base}/api/${path}`, {
			method,
			headers: { origin: base, 'content-type': 'application/json' },
			body: JSON.stringify({ id: 42 })
		});
		const response = await forwardApiRequest(
			request,
			path,
			'token',
			'http://localhost:8080',
			async (_url, init) => {
				assert.equal(init.method, method);
				assert.equal(init.headers.get('content-type'), 'application/json');
				assert.deepEqual(JSON.parse(new TextDecoder().decode(init.body)), { id: 42 });
				return Response.json({ id: 42 }, { status: 201 });
			}
		);
		assert.equal(response.status, 201);
	}
});

test('anonymous, unknown and cross-origin requests never reach Java', async () => {
	const send = async () => {
		throw new Error('must not fetch');
	};
	assert.equal(
		(
			await forwardApiRequest(
				new Request(`${base}/api/job`),
				'job',
				'',
				'http://localhost:8080',
				send
			)
		).status,
		401
	);
	assert.equal(
		(
			await forwardApiRequest(
				new Request(`${base}/api/secrets`),
				'../secrets',
				'token',
				'http://localhost:8080',
				send
			)
		).status,
		404
	);
	const request = new Request(`${base}/api/job`, {
		method: 'POST',
		headers: { origin: 'https://attacker.example' },
		body: '{}'
	});
	assert.equal(
		(await forwardApiRequest(request, 'job', 'token', 'http://localhost:8080', send)).status,
		403
	);
	assert.equal(allowedApiRequest('service/jobdashboard', 'GET'), true);
	assert.equal(allowedApiRequest('job/123', 'DELETE'), false);
});

test('Java 401 is preserved and redirects cannot leak credentials', async () => {
	const request = new Request(`${base}/api/job`);
	assert.equal(
		(
			await forwardApiRequest(
				request,
				'job',
				'token',
				'http://localhost:8080',
				async () => new Response('', { status: 401 })
			)
		).status,
		401
	);
	assert.equal(
		(
			await forwardApiRequest(
				request,
				'job',
				'token',
				'http://localhost:8080',
				async () =>
					new Response(null, { status: 302, headers: { location: 'https://attacker.example' } })
			)
		).status,
		502
	);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { paging, pageHref, pageNumbers, jobAction } from '../src/lib/pagination.js';
import { allowedApiRequest } from '../src/lib/server/api-proxy.js';

const paginationUrl = new URL('../src/lib/pagination.js', import.meta.url).href;
const source = (await readFile(new URL('../src/lib/server/exercise9.js', import.meta.url), 'utf8'))
	.replace(
		"import { API_BASE_URL } from '$app/env/private';",
		"const API_BASE_URL = 'http://localhost:8080';"
	)
	.replace(
		"import { error, fail } from '@sveltejs/kit';",
		`function error(status,message){throw Object.assign(new Error(message),{status,body:{message}})} function fail(status,data){return {status,data}}`
	)
	.replace(
		"import { paging } from '../pagination.js';",
		`const {paging} = await import(${JSON.stringify(paginationUrl)});`
	);
const { loadJobs, loadCompanies, jobActions, companyActions } = await import(
	`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
);
const page = (content = [], totalPages = 1) =>
	Response.json({ content, totalPages, totalElements: content.length });
function event(url = '/jobs', fetch = async () => page(), admin = false) {
	return {
		url: new URL(url, 'http://localhost:5173'),
		locals: {
			jwt_token: 'token',
			user: { email: 'me@example.com', user_roles: admin ? ['admin'] : [] }
		},
		fetch
	};
}
function post(fields, admin = false, fetch) {
	const e = event('/jobs', fetch, admin);
	e.request = new Request(e.url, { method: 'POST', body: new URLSearchParams(fields) });
	return e;
}

test('paging has defaults, validates boundaries and retains filters in page URLs', () => {
	assert.deepEqual(paging(new URL('http://test/jobs')), { pageNumber: 1, pageSize: 4 });
	assert.deepEqual(paging(new URL('http://test/jobs?pageNumber=2&pageSize=20')), {
		pageNumber: 2,
		pageSize: 20
	});
	for (const query of [
		'pageNumber=0',
		'pageNumber=2x',
		'pageSize=-1',
		'pageSize=101',
		'pageSize=1.5'
	]) {
		assert.throws(() => paging(new URL('http://test/jobs?' + query)));
	}
	const link = new URL(pageHref('/jobs', 2, 20, { min: '139', type: 'TEST' }), 'http://test');
	assert.equal(link.searchParams.get('type'), 'TEST');
	assert.equal(link.searchParams.get('min'), '139');
	assert.equal(link.searchParams.get('pageNumber'), '2');
	assert.ok(pageNumbers(5000, 10000).length <= 7);
});

test('freelancer job load sends bearer, paging and both filters and never requests companies', async () => {
	const calls = [];
	const result = await loadJobs(
		event('/jobs?pageNumber=2&pageSize=20&min=139&type=TEST', async (url, options) => {
			calls.push(url);
			assert.equal(url.pathname, '/api/job');
			assert.equal(url.searchParams.get('pageNumber'), '2');
			assert.equal(url.searchParams.get('pageSize'), '20');
			assert.equal(url.searchParams.get('min'), '139');
			assert.equal(url.searchParams.get('type'), 'TEST');
			assert.equal(options.headers.Authorization, 'Bearer token');
			assert.equal(options.redirect, 'manual');
			return page([{ id: 'j1' }], 3);
		})
	);
	assert.equal(calls.length, 1);
	assert.deepEqual(result.jobs, [{ id: 'j1' }]);
	assert.equal(result.currentPage, 2);
	assert.equal(result.nrOfPages, 3);
	assert.deepEqual(result.companies, []);
});

test('admin company picker and Companies page consume paginated content, including later pages', async () => {
	const result = await loadJobs(
		event(
			'/jobs?companyPageNumber=2',
			async (url) => {
				if (url.pathname === '/api/company') {
					assert.equal(url.searchParams.get('pageNumber'), '2');
					return page([{ id: 'later-company' }], 3);
				}
				return page();
			},
			true
		)
	);
	assert.equal(result.companies[0].id, 'later-company');
	assert.equal(result.companyNrOfPages, 3);
	const companies = await loadCompanies(
		event('/companies?pageNumber=2', async () => page([{ id: 'c2' }], 2), true)
	);
	assert.equal(companies.currentPage, 2);
	assert.equal(companies.companies[0].id, 'c2');
	await assert.rejects(
		() => loadCompanies(event('/companies')),
		(e) => e.status === 403
	);
});

test('loads reject missing login, malformed Page response and backend errors', async () => {
	const anonymous = event();
	anonymous.locals.jwt_token = '';
	await assert.rejects(
		() => loadJobs(anonymous),
		(e) => e.status === 401
	);
	await assert.rejects(
		() => loadJobs(event('/jobs', async () => Response.json([]))),
		(e) => e.status === 502
	);
	await assert.rejects(
		() => loadJobs(event('/jobs', async () => new Response('', { status: 401 }))),
		(e) => e.status === 401
	);
	await assert.rejects(
		() =>
			loadJobs(
				event('/jobs', async () => {
					throw new Error('offline');
				})
			),
		(e) => e.status === 502
	);
});

test('assignment and completion actions encode job IDs, use me endpoints and ignore supplied identities', async () => {
	for (const [action, path] of [
		['assignToMe', 'assignjob'],
		['completeMyJob', 'completejob']
	]) {
		const result = await jobActions[action](
			post(
				{ jobId: 'id&freelancerId=other', freelancerId: 'attacker' },
				false,
				async (url, options) => {
					assert.equal(url.pathname, `/api/service/me/${path}`);
					assert.equal(url.searchParams.get('jobId'), 'id&freelancerId=other');
					assert.equal(url.searchParams.has('freelancerId'), false);
					assert.equal(options.method, 'PUT');
					assert.equal(options.headers.Authorization, 'Bearer token');
					assert.equal(options.body, undefined);
					return Response.json({ jobState: 'ASSIGNED' });
				}
			)
		);
		assert.ok(result.message);
	}
});

test('actions report missing IDs, permission failures and backend failures', async () => {
	assert.equal((await jobActions.assignToMe(post({}))).status, 400);
	assert.equal(
		(
			await jobActions.assignToMe(
				post({ jobId: 'j1' }, false, async () => new Response('', { status: 403 }))
			)
		).status,
		403
	);
	assert.equal(
		(
			await jobActions.completeMyJob(
				post({ jobId: 'j1' }, false, async () => new Response('', { status: 400 }))
			)
		).status,
		400
	);
	assert.equal((await jobActions.createJob(post({ title: 'x' }))).status, 403);
	assert.equal(
		(await companyActions.createCompany(post({ name: 'x', email: 'x@example.com' }))).status,
		403
	);
});

test('job controls respect null/empty assignment, owner and state', () => {
	for (const freelancerId of [null, '', undefined])
		assert.equal(jobAction({ jobState: 'NEW', freelancerId }, 'me'), 'assign');
	assert.equal(jobAction({ jobState: 'ASSIGNED', freelancerId: 'me' }, 'me'), 'complete');
	assert.equal(jobAction({ jobState: 'ASSIGNED', freelancerId: 'other' }, 'me'), 'assigned');
	assert.equal(jobAction({ jobState: 'DONE', freelancerId: 'me' }, 'me'), 'done');
	assert.equal(jobAction({ jobState: 'NEW', freelancerId: 'other' }, 'me'), '');
	assert.equal(allowedApiRequest('service/me/assignjob', 'PUT'), true);
	assert.equal(allowedApiRequest('service/me/completejob', 'PUT'), true);
	assert.equal(allowedApiRequest('service/me/unknown', 'PUT'), false);
});

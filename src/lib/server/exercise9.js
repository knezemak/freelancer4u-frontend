import { API_BASE_URL } from '$app/env/private';
import { error, fail } from '@sveltejs/kit';
import { paging } from '../pagination.js';

/** @param {import('@sveltejs/kit').RequestEvent} event */
function token(event) {
	if (!event.locals.jwt_token) error(401, 'Authentication required');
	return event.locals.jwt_token;
}

/** @param {import('@sveltejs/kit').RequestEvent} event @param {string} path @param {Record<string,string>} [params] @param {string} [method] @param {unknown} [body] */
async function api(event, path, params = {}, method = 'GET', body) {
	const jwt = token(event);
	const url = new URL(path, API_BASE_URL);
	url.search = new URLSearchParams(params).toString();
	let response;
	try {
		response = await event.fetch(url, {
			method,
			redirect: 'manual',
			signal: AbortSignal.timeout(15000),
			headers: {
				Authorization: `Bearer ${jwt}`,
				Accept: 'application/json',
				...(body ? { 'Content-Type': 'application/json' } : {})
			},
			body: body ? JSON.stringify(body) : undefined
		});
	} catch {
		error(502, 'Backend ist nicht erreichbar.');
	}
	if (!response.ok)
		error(
			response.status >= 300 && response.status < 400 ? 502 : response.status,
			response.status === 403
				? 'Aktion nicht erlaubt. Prüfe deine Rolle bzw. den E-Mail-Claim im Access-Token.'
				: response.status === 400
					? 'Aktion nicht möglich: Job-Zustand oder Eigentümer hat sich geändert.'
					: 'Backend-Anfrage fehlgeschlagen.'
		);
	return response.json();
}

/** @param {any} value */
function page(value) {
	if (
		!value ||
		!Array.isArray(value.content) ||
		!Number.isInteger(value.totalPages) ||
		value.totalPages < 0 ||
		!Number.isInteger(value.totalElements)
	) {
		error(
			502,
			'Backend liefert kein gültiges Page-Format. Bitte beide Repositories aktualisieren.'
		);
	}
	return { items: value.content, nrOfPages: value.totalPages, totalElements: value.totalElements };
}

/** @param {import('@sveltejs/kit').RequestEvent} event */
function pagination(event) {
	try {
		return paging(event.url);
	} catch {
		error(400, 'Ungültige Seitenparameter.');
	}
}

/** @param {import('@sveltejs/kit').RequestEvent} event */
export async function loadJobs(event) {
	token(event);
	const { pageNumber, pageSize } = pagination(event);
	const min = event.url.searchParams.get('min') || '';
	const type = event.url.searchParams.get('type') || '';
	const query = {
		pageNumber: String(pageNumber),
		pageSize: String(pageSize),
		...(min ? { min } : {}),
		...(type ? { type } : {})
	};
	const jobsPromise = api(event, '/api/job', query).then(page);
	const admin = event.locals.user?.user_roles.includes('admin');
	const pickerPage = Number(event.url.searchParams.get('companyPageNumber') || 1);
	if (!Number.isSafeInteger(pickerPage) || pickerPage < 1) error(400, 'Ungültige Company-Seite.');
	const companiesPromise = admin
		? api(event, '/api/company', { pageNumber: String(pickerPage), pageSize: '20' }).then(page)
		: Promise.resolve({ items: [], nrOfPages: 0, totalElements: 0 });
	const [jobs, companies] = await Promise.all([jobsPromise, companiesPromise]);
	return {
		jobs: jobs.items,
		nrOfPages: jobs.nrOfPages,
		totalElements: jobs.totalElements,
		currentPage: pageNumber,
		pageSize,
		min,
		type,
		companies: companies.items,
		companyPage: pickerPage,
		companyNrOfPages: companies.nrOfPages
	};
}

/** @param {import('@sveltejs/kit').RequestEvent} event */
export async function loadCompanies(event) {
	token(event);
	if (!event.locals.user?.user_roles.includes('admin')) error(403, 'Admin role required');
	const { pageNumber, pageSize } = pagination(event);
	const companies = page(
		await api(event, '/api/company', { pageNumber: String(pageNumber), pageSize: String(pageSize) })
	);
	return {
		companies: companies.items,
		nrOfPages: companies.nrOfPages,
		totalElements: companies.totalElements,
		currentPage: pageNumber,
		pageSize
	};
}

/** @param {FormData} form @param {string} key */
function field(form, key) {
	const value = form.get(key);
	return typeof value === 'string' ? value.trim() : '';
}

/** @param {import('@sveltejs/kit').RequestEvent} event @param {string} action */
async function me(event, action) {
	token(event);
	const form = await event.request.formData();
	const jobId = field(form, 'jobId');
	if (!jobId) return fail(400, { message: 'Job-ID fehlt.' });
	try {
		await api(event, `/api/service/me/${action}`, { jobId }, 'PUT');
	} catch (err) {
		return actionFailure(err);
	}
	return {
		message: action === 'assignjob' ? 'Job wurde dir zugewiesen.' : 'Job wurde abgeschlossen.'
	};
}

/** @param {unknown} err */
function actionFailure(err) {
	const e = /** @type {{status?:number,body?:{message?:string}}} */ (err);
	return fail(e.status && e.status >= 400 && e.status <= 599 ? e.status : 502, {
		message: e.body?.message || 'Aktion fehlgeschlagen.'
	});
}

/** @param {import('@sveltejs/kit').RequestEvent} event */
async function createJob(event) {
	token(event);
	if (!event.locals.user?.user_roles.includes('admin'))
		return fail(403, { message: 'Admin role required' });
	const form = await event.request.formData();
	const title = field(form, 'title'),
		description = field(form, 'description'),
		jobType = field(form, 'jobType'),
		companyId = field(form, 'companyId');
	const earnings = Number(field(form, 'earnings'));
	if (
		!title ||
		!description ||
		!companyId ||
		!['IMPLEMENT', 'TEST', 'REVIEW', 'OTHER'].includes(jobType) ||
		!field(form, 'earnings') ||
		!Number.isFinite(earnings) ||
		earnings < 0
	) {
		return fail(400, { message: 'Bitte alle Job-Felder gültig ausfüllen.' });
	}
	try {
		await api(event, '/api/job', {}, 'POST', { title, description, jobType, companyId, earnings });
	} catch (err) {
		return actionFailure(err);
	}
	return { message: 'Job wurde erstellt.' };
}

/** @param {import('@sveltejs/kit').RequestEvent} event */
async function createCompany(event) {
	token(event);
	if (!event.locals.user?.user_roles.includes('admin'))
		return fail(403, { message: 'Admin role required' });
	const form = await event.request.formData();
	const name = field(form, 'name'),
		email = field(form, 'email');
	if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
		return fail(400, { message: 'Name und gültige E-Mail erforderlich.' });
	try {
		await api(event, '/api/company', {}, 'POST', { name, email });
	} catch (err) {
		return actionFailure(err);
	}
	return { message: 'Company wurde erstellt.' };
}

export const jobActions = {
	createJob,
	assignToMe: (/** @type {import('@sveltejs/kit').RequestEvent} */ event) => me(event, 'assignjob'),
	completeMyJob: (/** @type {import('@sveltejs/kit').RequestEvent} */ event) =>
		me(event, 'completejob')
};
export const companyActions = { createCompany };

/** @param {URL} url */
export function paging(url) {
	const integer = (/** @type {string | null} */ value, /** @type {number} */ fallback) =>
		value === null || value === '' ? fallback : /^\d+$/.test(value) ? Number(value) : NaN;
	const pageNumber = integer(url.searchParams.get('pageNumber'), 1);
	const pageSize = integer(url.searchParams.get('pageSize'), 4);
	if (
		!Number.isSafeInteger(pageNumber) ||
		pageNumber < 1 ||
		!Number.isSafeInteger(pageSize) ||
		pageSize < 1 ||
		pageSize > 100
	) {
		throw new Error('Ungültige Pagination: Seite ab 1, Seitengrösse 1–100.');
	}
	return { pageNumber, pageSize };
}

/** @param {string} pathname @param {number} page @param {number} size @param {Record<string,string>} [filters] */
export function pageHref(pathname, page, size, filters = {}) {
	const query = new URLSearchParams({
		...filters,
		pageNumber: String(page),
		pageSize: String(size)
	});
	for (const [key, value] of query) if (!value) query.delete(key);
	return `${pathname}?${query}`;
}

/** @param {number} current @param {number} total */
export function pageNumbers(current, total) {
	// Bound the navigation even for very large result sets.
	return [...new Set([1, ...Array.from({ length: 5 }, (_, i) => current - 2 + i), total])]
		.filter((n) => n >= 1 && n <= total)
		.sort((a, b) => a - b);
}

/** @param {{jobState:string,freelancerId?:string|null}} job @param {string | undefined} email */
export function jobAction(job, email) {
	if (job.jobState === 'DONE') return 'done';
	if (job.jobState === 'ASSIGNED')
		return email && job.freelancerId === email ? 'complete' : 'assigned';
	return job.jobState === 'NEW' && !job.freelancerId ? 'assign' : '';
}

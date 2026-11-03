/** @param {string} token @param {string} subject @param {string} apiBaseUrl @param {typeof fetch} [send] */
export async function verifiedRoles(token, subject, apiBaseUrl, send = fetch) {
	try {
		const url = new URL('/api/account', apiBaseUrl);
		if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)
			throw new Error('Invalid API URL');
		const response = await send(url, {
			headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
			redirect: 'manual',
			signal: AbortSignal.timeout(5000)
		});
		if (!response.ok) return { user_roles: [], rolesAvailable: false };
		const result = await response.json();
		if (result.sub !== subject || !Array.isArray(result.user_roles))
			return { user_roles: [], rolesAvailable: false };
		return {
			user_roles: [...new Set(result.user_roles.filter(isRole))],
			rolesAvailable: true
		};
	} catch {
		// Never grant roles from an unsigned cookie or decoded JWT on verification failure.
		return { user_roles: [], rolesAvailable: false };
	}
}

/** @param {unknown} role @returns {role is string} */
function isRole(role) {
	return typeof role === 'string' && role.length > 0;
}

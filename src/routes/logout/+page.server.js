import { redirect } from '@sveltejs/kit';
import { getLogoutUrl, logout } from '#lib/server/auth.service.js';
export const actions = {
	default: ({ cookies, url }) => {
		logout(cookies);
		let target;
		try {
			target = getLogoutUrl(url.origin);
		} catch {
			// Local logout still works before Auth0 configuration is supplied.
			redirect(303, '/');
		}
		redirect(303, target.href, { external: [target.origin] });
	}
};

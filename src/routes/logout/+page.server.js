import { redirect } from '@sveltejs/kit';
import { logout } from '#lib/server/auth.service.js';
export const actions = {
	default: ({ cookies }) => {
		logout(cookies);
		redirect(303, '/');
	}
};

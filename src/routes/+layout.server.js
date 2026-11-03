export const load = async ({ locals }) => {
	return {
		user: locals.user || null,
		isAuthenticated: locals.isAuthenticated || false
	};
};

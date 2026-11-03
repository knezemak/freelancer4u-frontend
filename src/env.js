import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	API_BASE_URL: { schema: (value) => value ?? 'http://localhost:8080' },
	AUTH0_DOMAIN: { schema: (value) => value ?? '' },
	AUTH0_CLIENT_ID: { schema: (value) => value ?? '' },
	AUTH0_AUDIENCE: { schema: (value) => value ?? '' }
});

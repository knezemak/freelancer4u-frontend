declare global {
	namespace App {
		interface User {
			sub: string;
			name: string;
			nickname?: string;
			given_name?: string;
			family_name?: string;
			email?: string;
			picture?: string;
			user_roles: string[];
			rolesAvailable: boolean;
		}
		interface Locals {
			user: User | null;
			jwt_token: string | null;
			isAuthenticated: boolean;
		}
	}
}
export {};

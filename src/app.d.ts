declare global {
	namespace App {
		interface Locals {
			user: { sub: string; name: string } | null;
			jwt_token: string | null;
			isAuthenticated: boolean;
		}
	}
}
export {};

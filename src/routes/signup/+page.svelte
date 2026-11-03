<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<div class="container mt-5">
	<div class="row justify-content-center">
		<div class="col-md-6">
			<div class="card">
				<div class="card-header">Sign up</div>
				<div class="card-body">
					<form method="POST" action="?/signup" class="needs-validation" use:enhance>
						{#if form?.error}
							<div class="alert alert-danger" role="alert">
								{form.error}
							</div>
						{/if}
						<div class="mb-3">
							<label for="email" class="form-label">E-Mail</label>
							<input
								type="email"
								class="form-control"
								id="email"
								name="email"
								autocomplete="username"
								maxlength="254"
								required
							/>
							<div class="invalid-feedback">Please provide an e-mail address.</div>
						</div>
						<div class="mb-3">
							<label for="firstName" class="form-label">First Name</label>
							<input
								type="text"
								class="form-control"
								id="firstName"
								name="firstName"
								autocomplete="given-name"
								maxlength="100"
							/>
						</div>
						<div class="mb-3">
							<label for="lastName" class="form-label">Last Name</label>
							<input
								type="text"
								class="form-control"
								id="lastName"
								name="lastName"
								autocomplete="family-name"
								maxlength="100"
							/>
						</div>
						<div class="mb-3">
							<label for="password" class="form-label">Password</label>
							<input
								type="password"
								class="form-control"
								id="password"
								name="password"
								autocomplete="new-password"
								maxlength="1024"
								required
							/>
							<div class="invalid-feedback">Please choose a password.</div>
						</div>
						<div class="row align-items-end">
							<div class="col">
								<button type="submit" class="btn btn-primary">Sign up</button>
							</div>
							<div class="col-auto">
								<a href="/login">Log in</a>
							</div>
						</div>
					</form>
				</div>
			</div>
		</div>
	</div>
</div>

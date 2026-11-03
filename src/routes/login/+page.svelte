<script lang="ts">
	import type { PageProps } from './$types';
	let { form }: PageProps = $props();
</script>

<svelte:head><title>Login | Freelancer4U</title></svelte:head>
<section class="auth">
	<h1>Login</h1>
	{#if form?.error}<p class="error" role="alert">{form.error}</p>{/if}
	<form method="POST">
		<label for="email">Email</label>
		<input id="email" name="email" type="email" autocomplete="username" maxlength="254" required />
		<label for="password">Password</label>
		<input
			id="password"
			name="password"
			type="password"
			autocomplete="current-password"
			maxlength="1024"
			required
		/>
		<button type="submit">Login</button>
	</form>
	<p><a href="/signup">New here? Sign Up</a></p>
</section>

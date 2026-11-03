<script lang="ts">
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<svelte:head><title>Freelancer4U</title></svelte:head>
{#if data.isAuthenticated}
	<h1>Welcome to Freelancer4U!</h1>
	<p>Find your next opportunity or manage your companies.</p>
{:else}
	<section class="welcome">
		<h1>Welcome to Freelancer4U</h1>
		<h2>Get Started</h2>
		<p>Please log in to access your account or sign up to create a new one.</p>
		<a class="button" href="/login">Login</a>
		<a class="button secondary" href="/signup">Sign Up</a>
	</section>
{/if}

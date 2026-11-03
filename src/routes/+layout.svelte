<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';
	import './styles.css';
	let { data, children }: LayoutProps = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<nav aria-label="Main navigation">
	<a class="brand" href="/">Freelancer4U</a>
	{#if data.isAuthenticated}
		<a href="/companies">Companies</a><a href="/jobs">Jobs</a>
		<div class="account">
			<span>{data.user?.name}</span>
			<form method="POST" action="/logout"><button type="submit">Log Out</button></form>
		</div>
	{:else}
		<div class="account">
			<a class="button" href="/login">Login</a>
			<a class="button secondary" href="/signup">Sign Up</a>
		</div>
	{/if}
</nav>
<div class="content">{@render children()}</div>

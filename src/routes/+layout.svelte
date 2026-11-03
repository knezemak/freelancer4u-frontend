<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';
	import './styles.css';
	import { resolve } from '$app/paths';
	let { data, children }: LayoutProps = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<nav aria-label="Main navigation">
	<a class="brand" href={resolve('/')}>Freelancer4U</a>
	{#if data.isAuthenticated}
		{#if data.user?.user_roles.includes('admin')}
			<a href={resolve('/companies')}>Companies</a>
		{/if}
		<a href={resolve('/jobs')}>Jobs</a>
		<a href={resolve('/account')}>Account</a>
		<div class="account">
			<span>{data.user?.name}</span>
			<form method="POST" action="/logout"><button type="submit">Log Out</button></form>
		</div>
	{:else}
		<div class="account">
			<a class="button" href={resolve('/login')}>Login</a>
			<a class="button secondary" href={resolve('/signup')}>Sign Up</a>
		</div>
	{/if}
</nav>
<div class="content">{@render children()}</div>

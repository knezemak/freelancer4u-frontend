<script lang="ts">
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<svelte:head><title>Account Details | Freelancer4U</title></svelte:head>

<h1>Account Details</h1>
{#if data.isAuthenticated && data.user}
	{#if data.user.picture}
		<p>
			<img src={data.user.picture} alt="" width="96" height="96" referrerpolicy="no-referrer" />
		</p>
	{/if}
	<dl>
		<dt>Name:</dt>
		<dd>{data.user.name}</dd>
		<dt>Nickname:</dt>
		<dd>{data.user.nickname || '—'}</dd>
		<dt>First Name:</dt>
		<dd>{data.user.given_name || '—'}</dd>
		<dt>Last Name:</dt>
		<dd>{data.user.family_name || '—'}</dd>
		<dt>Email:</dt>
		<dd>{data.user.email || '—'}</dd>
		{#if data.user.user_roles.length > 0}
			<dt>Roles:</dt>
			<dd>{data.user.user_roles.join(', ')}</dd>
		{/if}
	</dl>
	{#if !data.user.rolesAvailable}
		<p role="status">
			Roles could not be verified. Check that the backend is running on the roles branch.
		</p>
	{/if}
{:else}
	<p>Not logged in</p>
{/if}

<style>
	dl {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 1rem;
	}
	dt {
		font-weight: bold;
	}
	dd {
		margin: 0;
		overflow-wrap: anywhere;
	}
	img {
		border-radius: 50%;
		object-fit: cover;
	}
	@media (max-width: 420px) {
		dl {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}
		dd {
			margin-bottom: 0.75rem;
		}
	}
</style>

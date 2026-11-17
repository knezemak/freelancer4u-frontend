<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Pagination from '#lib/Pagination.svelte';
	import type { PageProps } from './$types';
	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Freelancer4U – Companies</title></svelte:head>
<main>
	<h1>Unsere Companies</h1>
	{#if form?.message}<p role="status">{form.message}</p>{/if}
	<h2>Neue Company erstellen</h2>
	<form method="POST" action="?/createCompany" use:enhance class="create-form">
		<label>Name<input name="name" required /></label><label
			>E-Mail<input name="email" type="email" required /></label
		><button>Company erstellen</button>
	</form>
	<h2>Alle Companies</h2>
	<form method="GET" action={resolve('/companies')}>
		<input type="hidden" name="pageNumber" value="1" />
		<label
			>Pro Seite<select name="pageSize" value={data.pageSize}
				>{#each [...new Set( [4, 20, 50, data.pageSize] )].sort((a, b) => a - b) as size (size)}<option
						value={size}>{size}</option
					>{/each}</select
			></label
		><button>Anzeigen</button>
	</form>
	<p>
		{data.totalElements} Companies · Seite {data.currentPage}{#if data.nrOfPages > 0}
			von {data.nrOfPages}{/if}
	</p>
	{#if data.companies.length === 0}<p>Keine Companies auf dieser Seite.</p>{/if}
	<div class="table-scroll">
		<table>
			<thead><tr><th>Name</th><th>E-Mail</th><th>ID</th></tr></thead><tbody
				>{#each data.companies as company (company.id)}<tr
						><td>{company.name}</td><td>{company.email}</td><td>{company.id}</td></tr
					>{/each}</tbody
			>
		</table>
	</div>
	<Pagination
		pathname="/companies"
		currentPage={data.currentPage}
		pageSize={data.pageSize}
		nrOfPages={data.nrOfPages}
	/>
</main>

<style>
	main {
		max-width: 1000px;
		margin: 2rem auto;
		padding: 0 1rem;
	}
	h1,
	h2 {
		color: #2458ce;
	}
	.create-form {
		background: #f1f5fc;
		padding: 1rem;
		display: grid;
		gap: 0.7rem;
		border-radius: 0.5rem;
		margin-bottom: 1.5rem;
		max-width: 600px;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	input,
	select {
		padding: 0.5rem;
		border: 1px solid #aab7cc;
		border-radius: 0.25rem;
		font: inherit;
	}
	button {
		background: #2458ce;
		color: white;
		border: 0;
		border-radius: 0.25rem;
		padding: 0.6rem 0.8rem;
		cursor: pointer;
	}
	table {
		border-collapse: collapse;
		width: 100%;
	}
	th,
	td {
		text-align: left;
		padding: 0.7rem;
		border-bottom: 1px solid #d8dfed;
	}
	th {
		background: #f1f5fc;
	}
	.table-scroll {
		overflow-x: auto;
	}
	p[role='status'] {
		padding: 1rem;
		background: #eef3ff;
	}
</style>

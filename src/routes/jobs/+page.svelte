<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Pagination from '#lib/Pagination.svelte';
	import { jobAction, pageHref } from '#lib/pagination.js';
	import type { PageProps } from './$types';
	let { data, form }: PageProps = $props();
	let isAdmin = $derived(data.user?.user_roles.includes('admin') ?? false);
	let filters = $derived({ min: data.min, type: data.type });
</script>

<svelte:head><title>Freelancer4U – Jobs</title></svelte:head>
<main>
	<h1>Jobs</h1>
	{#if form?.message}<p role="status">{form.message}</p>{/if}
	{#if isAdmin}
		<details>
			<summary>Neuen Job erstellen</summary>
			<form method="POST" action="?/createJob" use:enhance class="create-form">
				<label>Titel<input name="title" required /></label>
				<label>Beschreibung<textarea name="description" required></textarea></label>
				<label
					>Job-Typ<select name="jobType"
						><option>IMPLEMENT</option><option>TEST</option><option>REVIEW</option><option
							>OTHER</option
						></select
					></label
				>
				<label
					>Verdienst (CHF)<input
						name="earnings"
						type="number"
						min="0"
						step="0.01"
						value="100"
						required
					/></label
				>
				<label
					>Company<select name="companyId" required
						><option value="">Company auswählen</option
						>{#each data.companies as company (company.id)}<option value={company.id}
								>{company.name}</option
							>{/each}</select
					></label
				>
				<button type="submit" disabled={data.companies.length === 0}>Job erstellen</button>
			</form>
			{#if data.companyNrOfPages > 1}
				<p>
					Company-Auswahl: Seite {data.companyPage} von {data.companyNrOfPages}. Beim Wechsel werden
					ungespeicherte Eingaben verworfen.
				</p>
				<div class="picker">
					{#if data.companyPage > 1}<a
							href={resolve(
								`/jobs?${pageHref('', data.currentPage, data.pageSize, {
									...filters,
									companyPageNumber: String(data.companyPage - 1)
								}).slice(1)}`
							)}>← Vorherige Companies</a
						>{/if}
					{#if data.companyPage < data.companyNrOfPages}<a
							href={resolve(
								`/jobs?${pageHref('', data.currentPage, data.pageSize, {
									...filters,
									companyPageNumber: String(data.companyPage + 1)
								}).slice(1)}`
							)}>Weitere Companies →</a
						>{/if}
				</div>
			{/if}
		</details>
	{/if}

	<h2>Jobs filtern</h2>
	<form method="GET" action={resolve('/jobs')} class="filters">
		<input type="hidden" name="pageNumber" value="1" />
		<label
			>Mindestverdienst (exklusiv)<input
				name="min"
				type="number"
				step="0.01"
				value={data.min}
			/></label
		>
		<label
			>Job-Typ<select name="type" value={data.type}
				><option value="">Alle Typen</option><option>IMPLEMENT</option><option>TEST</option><option
					>REVIEW</option
				><option>OTHER</option></select
			></label
		>
		<label
			>Pro Seite<select name="pageSize" value={data.pageSize}
				>{#each [...new Set( [4, 20, 50, data.pageSize] )].sort((a, b) => a - b) as size (size)}<option
						value={size}>{size}</option
					>{/each}</select
			></label
		>
		<button type="submit">Filtern</button><a href={resolve('/jobs')}>Zurücksetzen</a>
	</form>

	<h2>Alle Jobs</h2>
	<p>
		{data.totalElements} Jobs · Seite {data.currentPage}{#if data.nrOfPages > 0}
			von {data.nrOfPages}{/if}
	</p>
	{#if data.jobs.length === 0}<p>Keine Jobs auf dieser Seite.</p>{/if}
	<div class="table-scroll">
		<table>
			<thead
				><tr
					><th>Titel</th><th>Beschreibung</th><th>Typ</th><th>Verdienst (CHF)</th><th>Status</th><th
						>Company-ID</th
					><th>Freelancer-ID</th><th>Actions</th></tr
				></thead
			>
			<tbody
				>{#each data.jobs as job (job.id)}
					{@const action = jobAction(job, data.user?.email)}
					<tr
						><td><a href={resolve('/jobs/[id]', { id: job.id })}>{job.title}</a></td><td
							>{job.description}</td
						><td>{job.jobType}</td><td>{Number(job.earnings).toFixed(2)}</td><td>{job.jobState}</td
						><td>{job.companyId}</td><td>{job.freelancerId || '—'}</td>
						<td>
							{#if action === 'assign'}
								<form method="POST" action="?/assignToMe" use:enhance>
									<input type="hidden" name="jobId" value={job.id} /><button>Assign to me</button>
								</form>
							{:else if action === 'complete'}
								<span class="badge">Assigned</span>
								<form method="POST" action="?/completeMyJob" use:enhance>
									<input type="hidden" name="jobId" value={job.id} /><button>Complete Job</button>
								</form>
							{:else if action === 'assigned'}<span class="badge">Assigned</span>
							{:else if action === 'done'}<span class="badge done">Done</span>{/if}
						</td></tr
					>
				{/each}</tbody
			>
		</table>
	</div>
	<Pagination
		pathname="/jobs"
		currentPage={data.currentPage}
		pageSize={data.pageSize}
		nrOfPages={data.nrOfPages}
		{filters}
	/>
</main>

<style>
	main {
		max-width: 1200px;
		margin: 2rem auto;
		padding: 0 1rem;
	}
	h1,
	h2 {
		color: #2458ce;
	}
	details,
	.filters {
		background: #f1f5fc;
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1.5rem;
	}
	summary {
		font-weight: bold;
		cursor: pointer;
	}
	.create-form {
		display: grid;
		gap: 0.7rem;
		margin-top: 1rem;
		max-width: 650px;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	input,
	select,
	textarea {
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
	button:disabled {
		opacity: 0.5;
	}
	.filters,
	.picker {
		display: flex;
		gap: 1rem;
		align-items: end;
		flex-wrap: wrap;
	}
	.table-scroll {
		overflow-x: auto;
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
		vertical-align: top;
	}
	th {
		background: #f1f5fc;
	}
	.badge {
		display: inline-block;
		background: #687386;
		color: white;
		border-radius: 0.3rem;
		padding: 0.3rem 0.5rem;
		margin-bottom: 0.3rem;
	}
	.done {
		background: #27754a;
	}
	td form {
		margin: 0;
	}
	p[role='status'] {
		padding: 1rem;
		background: #eef3ff;
	}
</style>

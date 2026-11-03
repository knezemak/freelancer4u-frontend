<script lang="ts">
	import { onMount } from 'svelte';

	type Job = {
		id?: string;
		title: string;
		description: string;
		jobType: string;
		jobState: string;
		earnings: number;
		companyId: string;
	};

	let jobs: Job[] = $state([]);
	let loading = $state(true);
	let error = $state('');

	let minEarnings = $state('');
	let selectedType = $state('');

	let newTitle = $state('');
	let newDescription = $state('');
	let newJobType = $state('IMPLEMENT');
	let newEarnings = $state(100);
	let newCompanyId = $state('');

	let creating = $state(false);
	let createError = $state('');
	let createSuccess = $state('');

	async function loadJobs() {
		loading = true;
		error = '';

		try {
			const params = new URLSearchParams();

			if (minEarnings !== '') {
				params.set('min', minEarnings);
			}

			if (selectedType !== '') {
				params.set('type', selectedType);
			}

			const query = params.toString();
			const url = `http://localhost:8080/api/job${query ? `?${query}` : ''}`;

			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(`HTTP-Fehler: ${response.status}`);
			}

			jobs = await response.json();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unbekannter Fehler';
		} finally {
			loading = false;
		}
	}

	function resetFilters() {
		minEarnings = '';
		selectedType = '';
		loadJobs();
	}

	async function createJob(event: SubmitEvent) {
		event.preventDefault();

		creating = true;
		createError = '';
		createSuccess = '';

		try {
			const response = await fetch('http://localhost:8080/api/job', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					title: newTitle,
					description: newDescription,
					jobType: newJobType,
					earnings: Number(newEarnings),
					companyId: newCompanyId
				})
			});

			if (!response.ok) {
				throw new Error(`HTTP-Fehler: ${response.status}`);
			}

			createSuccess = 'Job wurde erfolgreich erstellt!';

			newTitle = '';
			newDescription = '';
			newJobType = 'IMPLEMENT';
			newEarnings = 100;
			newCompanyId = '';

			resetFilters();
		} catch (err) {
			createError = err instanceof Error ? err.message : 'Job konnte nicht erstellt werden.';
		} finally {
			creating = false;
		}
	}

	onMount(() => {
		loadJobs();
	});
</script>

<svelte:head>
	<title>Freelancer4U – Jobs</title>
	<meta name="description" content="Freelancer-Jobs suchen, filtern und erstellen" />
</svelte:head>

<main>
	<nav aria-label="Hauptnavigation">
		<a href="/jobs" aria-current="page">Jobs</a>
		<a href="/companies">Companies anzeigen →</a>
	</nav>

	<h1>Freelancer4U</h1>
	<p>Entdecke unsere Freelancer-Jobs.</p>

	<h2>Neuen Job erstellen</h2>

	<form class="create-form" onsubmit={createJob}>
		<label>
			Titel
			<input type="text" bind:value={newTitle} placeholder="z. B. Website testen" required />
		</label>

		<label>
			Beschreibung
			<textarea bind:value={newDescription} placeholder="Beschreibe den Job" rows="3" required
			></textarea>
		</label>

		<label>
			Job-Typ
			<select bind:value={newJobType}>
				<option value="TEST">TEST</option>
				<option value="IMPLEMENT">IMPLEMENT</option>
				<option value="REVIEW">REVIEW</option>
				<option value="OTHER">OTHER</option>
			</select>
		</label>

		<label>
			Verdienst (CHF)
			<input type="number" min="0" bind:value={newEarnings} required />
		</label>

		<label>
			Company-ID
			<input
				type="text"
				bind:value={newCompanyId}
				placeholder="MongoDB-ID einer Company"
				required
			/>
		</label>

		<button type="submit" disabled={creating}>
			{creating ? 'Job wird erstellt...' : 'Job erstellen'}
		</button>

		{#if createError}
			<p class="error">Fehler beim Erstellen: {createError}</p>
		{/if}

		{#if createSuccess}
			<p class="success">{createSuccess}</p>
		{/if}
	</form>

	<h2>Jobs filtern</h2>

	<div class="filters">
		<label>
			Mindestverdienst (CHF)
			<input type="number" min="0" bind:value={minEarnings} placeholder="z. B. 150" />
		</label>

		<label>
			Job-Typ
			<select bind:value={selectedType}>
				<option value="">Alle Typen</option>
				<option value="TEST">TEST</option>
				<option value="IMPLEMENT">IMPLEMENT</option>
				<option value="REVIEW">REVIEW</option>
				<option value="OTHER">OTHER</option>
			</select>
		</label>

		<div class="buttons">
			<button type="button" onclick={loadJobs}>Filtern</button>
			<button type="button" class="reset" onclick={resetFilters}> Zurücksetzen </button>
		</div>
	</div>

	<h2>Alle Jobs</h2>

	{#if loading}
		<p>Jobs werden geladen...</p>
	{:else if error}
		<p class="error">Fehler beim Laden: {error}</p>
	{:else if jobs.length === 0}
		<p>Keine passenden Jobs gefunden.</p>
	{:else}
		<div class="job-list">
			{#each jobs as job (job.id)}
				<article class="job-card">
					<h3>{job.title}</h3>
					<p>{job.description}</p>
					<p><strong>Typ:</strong> {job.jobType}</p>
					<p><strong>Status:</strong> {job.jobState}</p>
					<p><strong>Verdienst:</strong> CHF {job.earnings}</p>

					{#if job.id}
						<a class="details-link" href={`/jobs/${job.id}`}> Details anzeigen → </a>
					{/if}
				</article>
			{/each}
		</div>
	{/if}
</main>

<style>
	main {
		max-width: 900px;
		margin: 60px auto;
		padding: 20px;
		font-family: Arial, sans-serif;
	}

	nav {
		display: flex;
		gap: 24px;
		margin-bottom: 24px;
	}

	nav a {
		color: #2563eb;
		text-decoration: none;
		font-weight: bold;
	}

	nav a:hover {
		text-decoration: underline;
	}

	nav a[aria-current='page'] {
		color: #374151;
	}

	h1 {
		color: #2563eb;
	}

	h2 {
		margin-top: 32px;
	}

	.create-form {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 20px;
		background: #eff6ff;
		border-radius: 10px;
	}

	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 16px;
		align-items: flex-end;
		padding: 20px;
		background: #f3f4f6;
		border-radius: 10px;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 8px;
		font-weight: bold;
	}

	input,
	select,
	textarea {
		padding: 10px;
		border: 1px solid #ccc;
		border-radius: 6px;
		font-size: 16px;
		font-family: inherit;
	}

	.buttons {
		display: flex;
		gap: 10px;
	}

	button {
		padding: 11px 18px;
		background: #2563eb;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
	}

	button.reset {
		background: #6b7280;
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.job-list {
		display: grid;
		gap: 20px;
	}

	.job-card {
		padding: 20px;
		border: 1px solid #ddd;
		border-radius: 10px;
	}

	.job-card h3 {
		margin-top: 0;
		color: #2563eb;
	}

	.details-link {
		display: inline-block;
		margin-top: 12px;
		color: #2563eb;
		font-weight: bold;
		text-decoration: none;
	}

	.details-link:hover {
		text-decoration: underline;
	}

	.error {
		color: #dc2626;
	}

	.success {
		color: #15803d;
		font-weight: bold;
	}
</style>

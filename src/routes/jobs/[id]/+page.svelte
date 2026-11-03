<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	type Job = {
		id: string;
		title: string;
		description: string;
		jobType: string;
		jobState: string;
		earnings: number;
		companyId: string;
		freelancerId?: string;
	};

	let job: Job | null = $state(null);
	let loading = $state(true);
	let error = $state('');

	onMount(async () => {
		try {
			const jobId = page.params.id;

			const response = await fetch(`http://localhost:8080/api/job/${jobId}`);

			if (!response.ok) {
				throw new Error(`HTTP-Fehler: ${response.status}`);
			}

			job = await response.json();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unbekannter Fehler';
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Job-Details – Freelancer4U</title>
</svelte:head>

<main>
	<a href="/jobs">← Zurück zu den Jobs</a>

	{#if loading}
		<p>Job wird geladen...</p>
	{:else if error}
		<p class="error">Fehler beim Laden: {error}</p>
	{:else if job}
		<h1>{job.title}</h1>

		<div class="job-card">
			<p>{job.description}</p>
			<p><strong>Typ:</strong> {job.jobType}</p>
			<p><strong>Status:</strong> {job.jobState}</p>
			<p><strong>Verdienst:</strong> CHF {job.earnings}</p>
			<p><strong>Company-ID:</strong> {job.companyId}</p>
			<p>
				<strong>Freelancer:</strong>
				{job.freelancerId || 'Noch nicht zugewiesen'}
			</p>
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

	a {
		color: #2563eb;
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}

	h1 {
		color: #2563eb;
		margin-top: 30px;
	}

	.job-card {
		padding: 20px;
		border: 1px solid #ddd;
		border-radius: 10px;
	}

	.error {
		color: #dc2626;
	}
</style>

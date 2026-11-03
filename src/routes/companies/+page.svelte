<script lang="ts">
	import { onMount } from 'svelte';

	type Company = {
		id?: string;
		name?: string;
		email?: string;
	};

	let companies: Company[] = $state([]);
	let loading = $state(true);
	let error = $state('');

	let companyName = $state('');
	let companyEmail = $state('');
	let creating = $state(false);
	let createError = $state('');
	let successMessage = $state('');

	async function loadCompanies() {
		loading = true;
		error = '';

		try {
			const response = await fetch('http://localhost:8080/api/company');

			if (!response.ok) {
				throw new Error(`HTTP-Fehler: ${response.status}`);
			}

			companies = await response.json();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unbekannter Fehler';
		} finally {
			loading = false;
		}
	}

	async function createCompany(event: SubmitEvent) {
		event.preventDefault();

		creating = true;
		createError = '';
		successMessage = '';

		try {
			const response = await fetch('http://localhost:8080/api/company', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: companyName.trim(),
					email: companyEmail.trim()
				})
			});

			if (!response.ok) {
				throw new Error(`HTTP-Fehler: ${response.status}`);
			}

			companyName = '';
			companyEmail = '';

			await loadCompanies();
			successMessage = 'Company wurde erfolgreich erstellt!';
		} catch (err) {
			createError = err instanceof Error ? err.message : 'Unbekannter Fehler';
		} finally {
			creating = false;
		}
	}

	onMount(() => {
		loadCompanies();
	});
</script>

<svelte:head>
	<title>Freelancer4U – Companies</title>
</svelte:head>

<main>
	<a href="/jobs">← Zurück zu den Jobs</a>

	<h1>Unsere Companies</h1>

	<h2>Neue Company erstellen</h2>

	<form onsubmit={createCompany}>
		<label for="company-name">Name</label>
		<input
			id="company-name"
			type="text"
			bind:value={companyName}
			placeholder="z. B. ZHAW Software Solutions"
			required
		/>

		<label for="company-email">E-Mail</label>
		<input
			id="company-email"
			type="email"
			bind:value={companyEmail}
			placeholder="z. B. info@example.com"
			required
		/>

		<button type="submit" disabled={creating}>
			{creating ? 'Wird erstellt...' : 'Company erstellen'}
		</button>
	</form>

	{#if successMessage}
		<p class="success">{successMessage}</p>
	{/if}

	{#if createError}
		<p class="error">Fehler beim Erstellen: {createError}</p>
	{/if}

	<h2>Alle Companies</h2>

	{#if loading}
		<p>Companies werden geladen...</p>
	{:else if error}
		<p class="error">Fehler beim Laden: {error}</p>
	{:else if companies.length === 0}
		<p>Keine Companies vorhanden.</p>
	{:else}
		<div class="company-list">
			{#each companies as company, index (company.id ?? index)}
				<article class="company-card">
					<h2>{company.name ?? 'Company ohne Namen'}</h2>
					{#if company.email}
						<p><strong>E-Mail:</strong> {company.email}</p>
					{/if}
					<p><strong>ID:</strong> {company.id}</p>
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

	h1 {
		color: #2563eb;
		margin-top: 30px;
	}

	a {
		color: #2563eb;
		text-decoration: none;
	}

	h2 {
		margin-top: 32px;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 20px;
		background: #f3f4f6;
		border-radius: 10px;
	}

	label {
		font-weight: bold;
	}

	input {
		padding: 10px;
		border: 1px solid #ccc;
		border-radius: 6px;
		font-size: 16px;
	}

	button {
		align-self: flex-start;
		padding: 11px 18px;
		background: #2563eb;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.company-list {
		display: grid;
		gap: 20px;
	}

	.company-card {
		padding: 20px;
		border: 1px solid #ddd;
		border-radius: 10px;
	}

	.company-card h2 {
		margin-top: 0;
	}

	.error {
		color: #dc2626;
	}

	.success {
		color: #15803d;
		font-weight: bold;
	}
</style>

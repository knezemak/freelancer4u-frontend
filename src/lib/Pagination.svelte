<script lang="ts">
	import { resolve } from '$app/paths';
	import { pageHref, pageNumbers } from './pagination.js';
	let {
		pathname,
		currentPage,
		pageSize,
		nrOfPages,
		filters = {}
	}: {
		pathname: '/jobs' | '/companies';
		currentPage: number;
		pageSize: number;
		nrOfPages: number;
		filters?: Record<string, string>;
	} = $props();
</script>

{#if nrOfPages > 0}
	<nav aria-label="Seitennavigation">
		<ul class="pagination">
			{#if currentPage > 1}<li>
					<a
						href={resolve(
							`${pathname}?${pageHref('', currentPage - 1, pageSize, filters).slice(1)}`
						)}
						aria-label="Vorherige Seite">←</a
					>
				</li>{/if}
			{#each pageNumbers(currentPage, nrOfPages) as number (number)}<li>
					<a
						class:active={currentPage === number}
						aria-current={currentPage === number ? 'page' : undefined}
						href={resolve(`${pathname}?${pageHref('', number, pageSize, filters).slice(1)}`)}
						>{number}</a
					>
				</li>{/each}
			{#if currentPage < nrOfPages}<li>
					<a
						href={resolve(
							`${pathname}?${pageHref('', currentPage + 1, pageSize, filters).slice(1)}`
						)}
						aria-label="Nächste Seite">→</a
					>
				</li>{/if}
		</ul>
	</nav>
{/if}

<style>
	.pagination {
		display: flex;
		gap: 0.35rem;
		list-style: none;
		padding: 0;
		flex-wrap: wrap;
	}
	a {
		display: block;
		padding: 0.5rem 0.8rem;
		border: 1px solid #bac8e8;
		border-radius: 0.3rem;
		text-decoration: none;
	}
	a.active {
		background: #2458ce;
		color: white;
	}
</style>

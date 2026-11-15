<script lang="ts">
	import EntryList from '#lib/components/EntryList.svelte';
	import CharSummary from '#lib/components/CharSummary.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const pageUrl = (page: number) => '?' + new URLSearchParams({ q: data.q, mode: data.mode, page: String(page) });

	// For shared links: the first result is usually what the person looked for
	let first = $derived(data.entries[0]);
	let description = $derived(
		first
			? `${first.simplified} (${first.pinyin}): ${first.definitions.join('; ')}. ${data.total} ${data.total === 1 ? 'word' : 'words'} found for “${data.q}”.`
			: `No words found for “${data.q}” in the Zidian Chinese–English dictionary.`
	);
</script>

{#if data.q}
	<!-- Search results are not indexed (see robots.txt), but get previews when shared -->
	<Seo title="{data.q}{data.page > 1 ? ` (page ${data.page})` : ''} - Zidian" {description} noindex />
{:else}
	<Seo
		title="Zidian - Chinese–English dictionary with pinyin, HSK levels and stroke order"
		description="Free Chinese–English dictionary. Search in English, pinyin (with or without tones) or Chinese characters, and see HSK levels, measure words, radicals, etymology and stroke order."
	/>
{/if}

{#if !data.q}
	<h1 class="mb-2 font-bold">Chinese–English dictionary</h1>
	<p>Search a Chinese–English dictionary in English, pinyin (with or without tones) or Chinese characters.</p>
	<p class="mt-2 text-sm">Examples: <a href="/?q=hello" class="underline">hello</a>, <a href="/?q=nihao" class="underline">nihao</a>, <a href="/?q=ma3" class="underline">ma3</a>, <a href="/?q=lǜ" class="underline">lǜ</a>, <a href="/?q=学" class="underline">学</a></p>
{:else}
	<div class="flex flex-col gap-8 md:flex-row-reverse">
		{#if data.characters.length}
			<aside class="md:w-72 md:shrink-0">
				<h2 class="font-bold">Characters</h2>
				{#each data.characters as char (char.character)}
					<CharSummary {char} />
				{/each}
			</aside>
		{/if}

		<section class="min-w-0 flex-1">
			<h2 class="font-bold">Words — {data.total} found</h2>
			<EntryList entries={data.entries} />

			{#if data.pageCount > 1}
				<nav class="mt-4 flex gap-4">
					{#if data.page > 1}
						<a href={pageUrl(data.page - 1)} class="underline">Previous</a>
					{/if}
					<span>Page {data.page} / {data.pageCount}</span>
					{#if data.page < data.pageCount}
						<a href={pageUrl(data.page + 1)} class="underline">Next</a>
					{/if}
				</nav>
			{/if}
		</section>
	</div>
{/if}

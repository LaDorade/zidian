<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="mx-auto max-w-5xl p-4">
	<header class="mb-6 flex items-center gap-4">
		<a href="/" class="font-bold">Zidian</a>
		<form action="/" class="flex flex-1 gap-2">
			<!-- Like jisho: the search box is ready to type in -->
			<!-- svelte-ignore a11y_autofocus -->
			<input
				name="q"
				value={page.url.searchParams.get('q') ?? ''}
				placeholder="English, pinyin (nihao, ni3hao3, nǐhǎo) or 汉字"
				autocomplete="off"
				class="flex-1 border px-2 py-1"
				autofocus
			/>
			<select name="mode" class="border px-1">
				{#each [['any', 'Any'], ['zh', 'Chinese'], ['en', 'English']] as [value, label]}
					<option {value} selected={value === (page.url.searchParams.get('mode') ?? 'any')}>{label}</option>
				{/each}
			</select>
			<button class="border px-3">Search</button>
		</form>
	</header>

	<main>
		{@render children()}
	</main>

	<footer class="mt-10 border-t pt-4 text-sm">
		<p>
			Dictionary data:
			<a href="https://cc-cedict.org/wiki/" class="underline">CC-CEDICT</a>
			(<a href="https://creativecommons.org/licenses/by-sa/4.0/" class="underline">CC BY-SA 4.0</a>),
			published by <a href="https://www.mdbg.net/chinese/dictionary?page=cedict" class="underline">MDBG</a>.
		</p>
		<p>
			Character data and stroke order:
			<a href="https://github.com/skishore/makemeahanzi" class="underline">Make Me a Hanzi</a>
			(dictionary: LGPL, derived from Unihan and CJKlib; graphics: Arphic Public License).
		</p>
		<p>
			HSK levels and word frequency:
			<a href="https://github.com/drkameleon/complete-hsk-vocabulary" class="underline">Complete HSK Vocabulary</a>
			(MIT).
		</p>
	</footer>
</div>

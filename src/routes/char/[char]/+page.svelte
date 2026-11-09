<script lang="ts">
	import EntryList from '#lib/components/EntryList.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let info = $derived(data.info);
</script>

<svelte:head>
	<title>{data.char} - Zidian</title>
</svelte:head>

<div class="flex gap-6">
	<div class="text-8xl" lang="zh-Hans">{data.char}</div>
	{#if info}
		<dl class="grid grid-cols-[auto_1fr] gap-x-4">
			<dt>Pinyin</dt><dd>{info.pinyin.join(', ')}</dd>
			<dt>Meaning</dt><dd>{info.definition}</dd>
			<dt>Strokes</dt><dd>{info.strokeCount}</dd>
			<dt>Radical</dt><dd lang="zh-Hans"><a href="/char/{info.radical}" class="underline">{info.radical}</a></dd>
			{#if info.components.length}
				<dt>Components</dt>
				<dd class="flex gap-2" lang="zh-Hans">
					{#each info.components as c}<a href="/char/{c}" class="underline">{c}</a>{/each}
				</dd>
			{/if}
			{#if info.etymology}
				<dt>Etymology</dt>
				<dd>
					{info.etymology.type}{info.etymology.hint ? `: ${info.etymology.hint}` : ''}
					{#if info.etymology.semantic}· meaning from <a lang="zh-Hans" href="/char/{info.etymology.semantic}" class="underline">{info.etymology.semantic}</a>{/if}
					{#if info.etymology.phonetic}· sound from <a lang="zh-Hans" href="/char/{info.etymology.phonetic}" class="underline">{info.etymology.phonetic}</a>{/if}
				</dd>
			{/if}
		</dl>
	{/if}
</div>

{#if info?.strokes.length}
	<h2 class="mt-6 font-bold">Stroke order</h2>
	<div class="flex flex-wrap gap-1">
		{#each info.strokes as _, i}
			<svg viewBox="0 0 1024 1024" class="size-14 border">
				<!-- Make Me a Hanzi coordinates are upside down -->
				<g transform="scale(1, -1) translate(0, -900)">
					{#each info.strokes.slice(0, i + 1) as d, j}
						<path {d} fill={j === i ? 'currentColor' : '#ccc'} />
					{/each}
				</g>
			</svg>
		{/each}
	</div>
{/if}

{#if data.readings.length}
	<h2 class="mt-6 font-bold">Readings</h2>
	<EntryList entries={data.readings} />
{/if}

{#if data.words.length}
	<h2 class="mt-6 font-bold">
		Words with {data.char}
		(<a href="/?q={data.char}" class="underline">see all {data.wordCount}</a>)
	</h2>
	<EntryList entries={data.words} />
{/if}

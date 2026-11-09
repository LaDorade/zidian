<!-- List of dictionary entries, jisho-style: word + pinyin on the left, meanings on the right. -->
<script lang="ts">
	import { isChinese } from '#lib/chinese.ts';
	import type { Entry } from '#lib/types.ts';

	let { entries }: { entries: Entry[] } = $props();
</script>

<ul>
	{#each entries as entry (entry.id)}
		<li class="flex gap-6 border-b py-4">
			<div class="w-40 shrink-0">
				<div class="text-sm">{entry.pinyin}</div>
				<div class="text-3xl" lang="zh-Hans">
					<!-- Only Chinese characters are links: not the T of T恤 -->
					{#each entry.simplified as char}{#if isChinese(char)}<a href="/char/{char}">{char}</a>{:else}{char}{/if}{/each}
				</div>
				{#if entry.traditional !== entry.simplified}
					<div class="text-sm">Trad. <span lang="zh-Hant">{entry.traditional}</span></div>
				{/if}
				{#if entry.hsk}
					<div class="text-sm">HSK {entry.hsk === 7 ? '7–9' : entry.hsk}</div>
				{/if}
			</div>
			<div>
				<ol class="list-decimal pl-5">
					{#each entry.definitions as definition}
						<li>{definition}</li>
					{/each}
				</ol>
				{#if entry.classifiers.length}
					<p class="mt-2 text-sm">Measure word: {entry.classifiers.join(', ')}</p>
				{/if}
			</div>
		</li>
	{/each}
</ul>

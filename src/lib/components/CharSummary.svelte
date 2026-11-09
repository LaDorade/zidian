<!-- Short character card, shown next to the search results. -->
<script lang="ts">
	import type { CharInfo } from '#lib/types.ts';

	let { char }: { char: Omit<CharInfo, 'strokes'> } = $props();
</script>

<div class="flex gap-3 border-b py-3">
	<a href="/char/{char.character}" class="text-4xl" lang="zh-Hans">{char.character}</a>
	<div class="text-sm">
		<p>{char.pinyin.join(', ')}</p>
		<p>{char.definition}</p>
		<p>
			{char.strokeCount} strokes · radical <span lang="zh-Hans">{char.radical}</span>
			{#if char.components.length}
				· <span lang="zh-Hans">{char.components.join(' + ')}</span>
			{/if}
		</p>
	</div>
</div>

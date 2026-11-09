<!-- Short character card, shown next to the search results. -->
<script lang="ts">
	import type { CharInfo } from '#lib/types.ts';

	let { char }: { char: Omit<CharInfo, 'strokes'> } = $props();
</script>

<div class="flex gap-3 border-b py-3">
	<a href="/char/{char.character}" class="text-4xl">{char.character}</a>
	<dl class="text-sm">
		<dd>{char.pinyin.join(', ')}</dd>
		<dd>{char.definition}</dd>
		<dd>{char.strokeCount} strokes · radical {char.radical}{char.components.length ? ` · ${char.components.join(' + ')}` : ''}</dd>
	</dl>
</div>

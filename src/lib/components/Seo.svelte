<!-- Title, description and OpenGraph tags of a page. -->
<script lang="ts">
	import { page } from '$app/state';
	import { siteOrigin } from '#lib/origin.ts';

	let {
		title,
		description,
		image = '/og.png',
		noindex = false
	}: { title: string; description: string; image?: string; noindex?: boolean } = $props();

	// The query string never matters for indexed pages
	let origin = $derived(siteOrigin(page.url));
	let canonical = $derived(origin + page.url.pathname);
	// Descriptions are shown cut around 160 characters anyway
	let shortDescription = $derived(description.length > 160 ? description.slice(0, 157) + '…' : description);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={shortDescription} />
	{#if noindex}
		<meta name="robots" content="noindex, follow" />
	{:else}
		<link rel="canonical" href={canonical} />
	{/if}

	<meta property="og:site_name" content="Zidian" />
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="en_US" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={shortDescription} />
	<meta property="og:url" content={noindex ? origin + page.url.pathname + page.url.search : canonical} />
	<!-- Images drawn by the og.png routes -->
	<meta property="og:image" content={new URL(image, origin).href} />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={title} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={shortDescription} />
</svelte:head>

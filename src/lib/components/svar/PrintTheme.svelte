<script lang="ts">
	let { children, ...rest} = $props();
</script>
<div class="wx-theme print-theme size-full max-w-svw">
	{@render children?.()}
</div>
<style>
	.print-theme {
		/* Grayscale */
		filter: grayscale(100%);
		-webkit-print-color-adjust: exact;
		print-color-adjust: exact;

		/* White background, black text */
		background: white;
		color: black;

		/* Font settings */
		font-family: 'Open Sans', Arial, Helvetica, sans-serif;
		font-size: 14px;
		line-height: 20px;
		font-weight: 400;
		font-style: normal;
		letter-spacing: normal;
		text-align: left;
	}

	/* Table styles */
	:global(.print-theme .wx-table-box) {
		background: white;
		color: black;
		border-radius: var(--wx-border-radius);
	}

	:global(.print-theme .wx-table-header) {
		background: #f0f0f0;
		color: black;
	}

	:global(.print-theme .wx-table-cell) {
		color: black;
		border-color: #ccc;
	}

	/* Hide interactive elements */
	:global(.print-theme .wx-toolbar) {
		display: none;
	}

	:global(.print-theme .header-filter) {
		display: none;
	}

	:global(.print-theme .graph-btn-cell) {
		display: none;
	}
</style>

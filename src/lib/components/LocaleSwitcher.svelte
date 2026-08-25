<script lang="ts">
	import * as Select from '$lib/components/ui/select';
	import { getLocale, setLocale } from '$lib/paraglide/runtime';
	import { browser } from '$app/environment';
	import { replaceState } from '$app/navigation';

	const locales = [
		{ value: 'en', label: 'English', flag: '🇬🇧' },
		{ value: 'ru', label: 'Русский', flag: '🇷🇺' }
	];

	const current = $derived(getLocale());
	const currentLocale = $derived(
		locales.find(l => l.value === current) ?? locales[0]
	);

	function handleChange(value: string) {
		if (value && value !== current) {
			setLocale(value as any);
			// Store preference in cookie
			if (browser) {
				document.cookie = `locale=${value};path=/;max-age=${60 * 60 * 24 * 365}`;
			}
		}
	}
</script>

<Select.Root type="single" value={current} onValueChange={handleChange}>
	<Select.Trigger class="w-28 text-xs">
		{currentLocale.flag} {currentLocale.label}
	</Select.Trigger>
	<Select.Content>
		{#each locales as locale}
			<Select.Item value={locale.value}>
				{locale.flag} {locale.label}
			</Select.Item>
		{/each}
	</Select.Content>
</Select.Root>

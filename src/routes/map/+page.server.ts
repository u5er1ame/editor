import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	// Fetch map data from the API endpoint
	const response = await fetch('/api/v1/map');
	const mapData = await response.json();

	return {
		mapData
	};
};

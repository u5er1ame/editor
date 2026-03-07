
export const load = async ({ fetch }) => {
	const res = await fetch("/api/v1/db/tables");

	return await res.json();
};

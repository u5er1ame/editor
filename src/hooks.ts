import type { Transport } from '@sveltejs/kit';
import { Duration, RecordId, StringRecordId, Uuid } from 'surrealdb';

// INFO: add non-POJOs here to ez serialize them so they can cross client/server boundary
export const transport: Transport = {
	RecordId: {
		encode: (value) => value instanceof RecordId && value.toString(),
		decode: (value) => { const [table, id] = value.split(':'); return new RecordId(table, id) }
	},
	StringRecordId: {
		encode: (value) => value instanceof StringRecordId && value.toString(),
		decode: (value) => new StringRecordId(value)
	},
	Duration: {
		encode: (value) => {  return value instanceof Duration && value.toString() },
		decode: (value) => new Duration(value)
	},
	Uuid: {
		encode: (value) => { if(value instanceof Uuid) { return value.toString() }},
		decode: (value) => new Uuid(value)
	}
};

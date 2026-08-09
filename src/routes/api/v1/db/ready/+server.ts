import { error, json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = ({ locals }) => {
    locals.db.instance.ready.then(() =>{
        return json({})
    }).catch((e)=>{ console.error(e); return error(400,"DB not ready/connected"); });
    return json({});
}

import type { ConnectionStatus } from "surrealdb";
import { db } from "$lib/db";
import type { RequestHandler } from './$types';
import { json } from "@sveltejs/kit";

const clients = new Set<ReadableStreamDefaultController>();

let status: ConnectionStatus | "error" = "disconnected";

const safeEnqueue = (data: string) => {
  console.log('safeEnqueue');
  clients.forEach(controller => {
    try {
      if (!controller.desiredSize || controller.desiredSize < 0) return;
      controller.enqueue(new TextEncoder().encode(data));
    } catch {
      console.error("error enq");
      // silent - already closed or errored
    }
  });
};

const events = ['connecting', 'connected', 'reconnecting', 'disconnected', 'error'] as const;

const unsubs = events.map(ev =>
  db.subscribe(ev, () => {
    status = ev as ConnectionStatus | "error";
    safeEnqueue(`data: ${status}\n\n`);
  })
);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    unsubs.forEach(u => u());
    clients.forEach(c => { try { c.close(); } catch { } });
    clients.clear();
  });
}

export const GET: RequestHandler = ({ setHeaders }) => {
  console.log('GET');
  setHeaders({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  return json({});
  // return new Response(
  //   new ReadableStream({
  //     start(controller) {
  //       console.log('start');
  //       clients.add(controller);
  //       safeEnqueue(`data: ${status}\n\n`);
  //
  //       // optional heartbeat
  //
  //       return () => {
  //         clients.delete(controller);
  //         try { controller.close(); } catch { }
  //       };
  //     }
  //   }),
  //   {
  //     headers: {
  //       'Content-Type': 'text/event-stream',
  //       'Cache-Control': 'no-cache',
  //       'Connection': 'keep-alive'
  //     }
  //   }
  // );
}

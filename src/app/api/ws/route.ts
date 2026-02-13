import { marketStream } from '@/lib/websocket/market-stream';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial data
      const initial = marketStream.getLatestPrices();
      const initData = `data: ${JSON.stringify(initial)}\n\n`;
      controller.enqueue(encoder.encode(initData));

      // Subscribe to updates
      const unsubscribe = marketStream.subscribe((updates) => {
        try {
          const data = `data: ${JSON.stringify(updates)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch {
          unsubscribe();
          controller.close();
        }
      });

      // Handle client disconnect - we check via a heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeat);
          unsubscribe();
        }
      }, 15000);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

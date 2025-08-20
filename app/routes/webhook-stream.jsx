// app/routes/webhook-stream.jsx
let clients = new Set();

export const loader = async ({ request }) => {
  // Server-Sent Events response
  const stream = new ReadableStream({
    start(controller) {
      const clientId = Date.now();
      
      const client = {
        id: clientId,
        controller,
        send: (data) => {
          try {
            const message = `data: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(new TextEncoder().encode(message));
          } catch (error) {
            console.error('❌ Error sending SSE message:', error);
            clients.delete(client);
          }
        }
      };

      // Add client to active connections
      clients.add(client);
      console.log(`📡 Client connected. Total clients: ${clients.size}`);

      // Send connection confirmation
      client.send({
        type: 'connection',
        message: 'Real-time connection established',
        timestamp: new Date().toISOString()
      });

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        clients.delete(client);
        console.log(`📡 Client disconnected. Total clients: ${clients.size}`);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
};

// Export function to broadcast updates to all clients
export function broadcastToClients(data) {
  if (clients.size === 0) {
    console.log('📡 No clients connected for broadcast');
    return;
  }

  console.log(`📡 Broadcasting to ${clients.size} clients:`, data.topic || data.type);
  
  // Send to all connected clients
  const disconnectedClients = new Set();
  
  clients.forEach(client => {
    try {
      client.send(data);
    } catch (error) {
      console.error('❌ Error broadcasting to client:', error);
      disconnectedClients.add(client);
    }
  });

  // Remove disconnected clients
  disconnectedClients.forEach(client => clients.delete(client));
}
import express from 'express';

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware to parse JSON
app.use(express.json());

// Test webhook endpoint
app.post('/test-webhook', (req, res) => {
  console.log('🔔 Test webhook received!');
  console.log('Headers:', req.headers);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  res.status(200).json({ received: true });
});

app.listen(PORT, () => {
  console.log(`🚀 Test webhook server running on http://localhost:${PORT}`);
  console.log('📡 You can test webhooks by sending POST requests to:');
  console.log(`   http://localhost:${PORT}/test-webhook`);
});

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down webhook test server...');
  process.exit(0);
});

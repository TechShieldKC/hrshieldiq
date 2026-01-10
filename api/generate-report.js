// /api/generate-report.js
// This runs on Vercel's servers - your API key stays secure

// Simple in-memory rate limiter
const RATE_LIMIT = new Map();
const LIMIT = 10; // max requests per IP per hour
const WINDOW = 3600000; // 1 hour in milliseconds

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const windowStart = now - WINDOW;
  
  // Get existing requests and filter to current window
  const requests = (RATE_LIMIT.get(ip) || []).filter(t => t > windowStart);
  
  if (requests.length >= LIMIT) {
    console.log(`Rate limit exceeded for IP: ${ip}`);
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }
  
  // Add this request
  requests.push(now);
  RATE_LIMIT.set(ip, requests);

  // Get the prompt from the request body
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Get API key from environment variable (set in Vercel dashboard)
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not configured');
    return res.status(500).json({ error: 'API not configured. Please contact support.' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 12000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Anthropic API error:', errorData);
      return res.status(response.status).json({ error: 'Failed to generate report' });
    }

    const data = await response.json();
    const reportText = data.content?.map(item => item.text || '').join('\n') || '';

    return res.status(200).json({ report: reportText });

  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    return res.status(500).json({ error: 'Failed to generate report. Please try again.' });
  }
}

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post('/api/stratz', async (req, res) => {
  const apiKey = process.env.VITE_STRATZ_API_KEY;
  
  if (!apiKey || apiKey === 'PASTE_YOUR_KEY_HERE') {
    return res.status(500).json({ error: 'Missing STRATZ API Key in backend .env' });
  }

  try {
    const response = await fetch('https://api.stratz.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.text();

    if (!response.ok) {
      console.error(`STRATZ API Error: ${response.status}`, data);
      return res.status(response.status).send(data);
    }

    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse STRATZ response as JSON:', data);
      return res.status(500).json({ error: 'Invalid JSON response from STRATZ API' });
    }

    res.json(jsonData);
  } catch (error) {
    console.error('Error fetching from STRATZ API:', error);
    res.status(500).json({ error: 'Internal server error while contacting STRATZ' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend proxy server running on http://localhost:${PORT}`);
});

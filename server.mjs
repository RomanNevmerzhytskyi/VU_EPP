import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 3000;

/*app.use(cors({
    origin: 'https://vu-epp-romans-projects-98192d1c.vercel.app',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));*/
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://vu-epp.vercel.app',
      'https://vu-epp-romans-projects-98192d1c.vercel.app'
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));

const fetchWithRetry = async (url, options = {}, retries = 3, backoff = 300) => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) {
                return response;
            }
            throw new Error(`Request failed with status ${response.status}`);
        } catch (error) {
            console.error(`Error fetching ${url}:`, error);
            if (i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, backoff * (i + 1)));
            } else {
                return { ok: false }; // Simulate a failed response after retries
            }
        }
    }
};

const checkUserProfile = async (url) => {
    try {
        const response = await fetchWithRetry(url);

        if (!response.ok) {
            if (response.status === 404) {
                return false;
            } else {
                throw new Error(`Request failed with status ${response.status}`);
            }
        }

        const html = await response.text();

        if (url.includes('facebook.com')) {
            return !html.includes('This content isn’t available right now') && !html.includes('Page Not Found');
        } else if (url.includes('instagram.com')) {
            return !html.includes('Sorry, this page isn\'t available.');
        } else if (url.includes('twitter.com')) {
            return !html.includes('Hmm...this page doesn’t exist.');
        } else {
            return false;
        }
    } catch (error) {
        console.error(`Error checking user profile: ${url}`, error);
        return false;
    }
};

app.post('/check-links', async (req, res) => {
    const { links } = req.body;

    if (!Array.isArray(links) || links.length === 0) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    const results = {};
    for (const link of links) {
        console.log(`Checking URL: ${link}`);
        results[link] = await checkUserProfile(link);
        console.log(`Result for ${link}: ${results[link]}`);
    }

    console.log('Results:', results);
    res.json(results);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

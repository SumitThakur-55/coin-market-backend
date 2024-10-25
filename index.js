const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables

const app = express();
app.use(cors()); // Enable CORS
app.use(express.json());

// Endpoint to get market data for coins
app.get('/api/coin-data', async (req, res) => {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
            params: {
                vs_currency: 'inr',
                order: 'market_cap_desc',
                per_page: 120,
                page: 1,
                sparkline: false,
            },
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching from CoinGecko:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Error fetching data from CoinGecko API',
            details: error.response?.data || error.message,
        });
    }
});

// Endpoint to get details for a specific coin
app.get('/api/coin/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${id}`, {
            headers: {
                'x-cg-api-key': process.env['X-CG-API-KEY'],
            },
        });

        // console.log('API Response:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching coin details:', error.response?.data || error.message);
        const status = error.response ? error.response.status : 500;
        res.status(status).json({
            error: 'Error fetching coin details',
            details: error.response?.data || error.message,
        });
    }
});

// Endpoint to get crypto news
app.get('/api/crypto-news', async (req, res) => {
    const { currency, filter = 'hot', region = 'en', kind = 'news' } = req.query;

    // Ensure currency is provided
    if (!currency) {
        return res.status(400).json({ error: 'Currency parameter is required' });
    }

    try {
        const response = await axios.get(`https://cryptopanic.com/api/free/v1/posts/`, {
            params: {
                auth_token: process.env.CRYPTO_PANIC_API_KEY,
                currencies: currency,
                filter,
                regions: region,
                kind,
                public: true,
            },
        });

        res.json(response.data); // Return full response data
    } catch (error) {
        console.error('CryptoPanic API Error:', error);
        res.status(500).json({
            error: error.message || 'Failed to fetch crypto news',
        });
    }
});

// Endpoint to get coin market chart data
app.get('/api/coin-chart/:id', async (req, res) => {
    const { id } = req.params;
    const { vs_currency = 'usd', days = '30', interval = 'daily', precision = '7' } = req.query;

    console.log(`Fetching chart data for coin: ${id}, params:`, { vs_currency, days, interval, precision });

    try {
        const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${id}/market_chart`, {
            params: {
                vs_currency,
                days,
                interval,
                precision,
            },
            headers: {
                'x-cg-api-key': process.env['X-CG-API-KEY'],
            },
        });

        console.log(`Successfully fetched chart data for ${id}`);
        res.json(response.data);
    } catch (error) {
        console.error(`Error fetching chart data for ${id}:`, error.message);
        const status = error.response ? error.response.status : 500;
        res.status(status).json({
            error: 'Error fetching coin chart data',
            details: error.response?.data || error.message,
        });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Ensure the API Key is set
if (!process.env['X-CG-API-KEY']) {
    console.error('X-CG-API-KEY is not set in the environment variables');
}

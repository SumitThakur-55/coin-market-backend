const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables

const app = express();
app.use(cors()); // Enable CORS
app.use(express.json());

app.get('/api/coin-data', async (req, res) => {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
            params: {
                vs_currency: 'inr',
                order: 'market_cap_desc',
                per_page: 120,
                page: 1,
                sparkline: false
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching from CoinGecko:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Error fetching data from CoinGecko API',
            details: error.response?.data || error.message
        });
    }
});
app.get('/api/coin/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${id}`, {
            headers: {
                'x-cg-api-key': process.env['X-CG-API-KEY']
            },
        });

        console.log('API Response:', response.data);

        // Directly return the response data
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching coin details:', error.response?.data || error.message);

        if (error.response) {
            res.status(error.response.status).json({
                error: 'Error fetching coin details',
                details: error.response.data
            });
        } else if (error.request) {
            res.status(503).json({
                error: 'No response from CoinGecko API',
                details: error.message
            });
        } else {
            res.status(500).json({
                error: 'Error setting up the request',
                details: error.message
            });
        }
    }
});


app.get('/api/crypto-news', async (req, res) => {
    const { currency, filter = 'hot', region = 'en', kind = 'news' } = req.query;

    // Ensure currency is provided
    if (!currency) {
        return res.status(400).json({ error: 'Currency parameter is required' });
    }

    try {
        // Make request to CryptoPanic API
        const response = await fetch(`https://cryptopanic.com/api/free/v1/posts/?auth_token=${process.env.CRYPTO_PANIC_API_KEY}&currencies=${currency}&filter=${filter}&regions=${region}&kind=${kind}&public=true`);

        // Check if the response is OK
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Parse the response as JSON
        const data = await response.json();

        // Respond with the data from the API
        res.json(data); // Return full response data
    } catch (error) {
        console.error('CryptoPanic API Error:', error);

        // Respond with error details
        res.status(500).json({
            error: error.message || 'Failed to fetch crypto news'
        });
    }
});

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
                'x-cg-api-key': process.env['X-CG-API-KEY']
            }
        });

        console.log(`Successfully fetched chart data for ${id}`);
        res.json(response.data);
    } catch (error) {
        console.error(`Error fetching chart data for ${id}:`, error.message);

        if (error.response) {
            if (error.response.status === 404) {
                res.status(404).json({
                    error: 'Coin not found',
                    details: `No chart data available for coin with id: ${id}`
                });
            } else {
                res.status(error.response.status).json({
                    error: 'Error fetching coin chart data',
                    details: error.response.data
                });
            }
        } else if (error.request) {
            res.status(503).json({
                error: 'No response from CoinGecko API',
                details: error.message
            });
        } else {
            res.status(500).json({
                error: 'Error setting up the request',
                details: error.message
            });
        }
    }
});





const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

console.log('Using API Key:', process.env['X-CG-API-KEY']);

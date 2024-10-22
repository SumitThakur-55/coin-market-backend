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
        const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
            headers: {
                'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY,
            },
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data' });
    }
});
app.get('/api/coin/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const response = await axios.get(`https://pro-api.coinmarketcap.com/v2/cryptocurrency/info?id=${id}`, {
            headers: {
                'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY,
            },
        });

        console.log('API Response:', response.data);

        // Check if the data exists and has the expected structure
        if (response.data && response.data.data && response.data.data[id]) {
            res.json(response.data);
        } else {
            res.status(404).json({ error: 'Coin not found' });
        }
    } catch (error) {
        console.error('Error fetching coin details:', error.response?.data || error.message);

        // More detailed error handling
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            res.status(error.response.status).json({
                error: 'Error fetching coin details',
                details: error.response.data
            });
        } else if (error.request) {
            // The request was made but no response was received
            res.status(503).json({
                error: 'No response from CoinMarketCap API',
                details: error.message
            });
        } else {
            // Something happened in setting up the request
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





const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

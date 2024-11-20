// This file handles requests to the ATProto API and serves as a gateway for the frontend.

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const config = require('./config');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

// ** Route: User Login to Get Access Token **
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const response = await axios.post(
            `${config.atprotoApiUrl}/auth/login`,
            { username, password }
        );
        const accessToken = response.data.access_token;
        res.json({ accessToken });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Error during login.');
    }
});

// ** Route: Fetch Global Feed **
app.get('/api/global-feed', async (req, res) => {
    const { accessToken } = req.headers;
    try {
        const response = await axios.get(
            `${config.atprotoApiUrl}/feed/global`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching global feed:', error);
        res.status(500).send('Error fetching global feed.');
    }
});

// ** Route: Post Emoji Status **
app.post('/api/post-status', async (req, res) => {
    const { emoji } = req.body;
    const { accessToken } = req.headers;
    try {
        const response = await axios.post(
            `${config.atprotoApiUrl}/status/update`,
            { status: emoji },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );
        res.json({ success: true, response: response.data });
    } catch (error) {
        console.error('Error posting emoji status:', error);
        res.status(500).send('Error posting emoji status.');
    }
});

// The "catchall" handler: for any request that doesn't match an API route, send back React's index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

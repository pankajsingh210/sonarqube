process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Ignore SSL cert errors (dev only)

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());


// Serve static files like sonarqube_rules.json
app.use(express.static(__dirname));


app.get('/proxy', async (req, res) => {
    const { token, branch } = req.query;
    const projectKey = '';// project key
    const pageSize = 100;
    let page = 1;
    let allIssues = [];
    let total = 0;

    try {
        while (true) {
            const apiUrl = `https://abc.com/api/issues/search?componentKeys=${projectKey}&branch=${branch}&ps=${pageSize}&p=${page}`;
            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (page === 1) total = data.total;
            allIssues = allIssues.concat(data.issues);

            if (allIssues.length >= total) break;
            page++;
        }

        res.json({ total, issues: allIssues });
    } catch (error) {
        console.error('Error fetching from SonarQube:', error);
        res.status(500).json({ error: 'Failed to fetch from SonarQube' });
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server running at http://localhost:${PORT}`);
});


const express = require('express');
const { Client } = require('pg');
const app = express();
const client = new Client({
    connectionString: 'postgresql://portfoliotracker_n2s0_user:TTWnOv5UNUjixl74lkgbDWIaecBNt8jI@dpg-d6h9sdhdrdic73cigmmg-a.singapore-postgres.render.com/portfoliotracker_n2s0',
    ssl: {
        rejectUnauthorized: false
    }
});
(async () => {
    try {
        await client.connect();
        console.log("Connected to PostgreSQL");
    } catch (err) {
        console.error("DB connection failed:", err);
        process.exit(1);
    }
})();

app.use(express.json())

const cors = require('cors')
app.use(cors())
app.use(express.static('dist'))

app.get('/', (request, response) => {
    response.send('<h1>Hello Portfolio Server!</h>')
})

app.get('/api/positions', async (request, response) => {
    try {
        const result = await client.query('SELECT * FROM position ORDER BY id');
        response.json(result.rows);
    } catch (err) {
        res.status(500).send(err.message);
    }
})

app.get('/api/positions/:id', async (request, response) => {
    const id = Number(request.params.id)
    try {
        const result = await client.query('SELECT * FROM position WHERE id = $1', [id]);
        response.json(result.rows[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
})

app.delete('/api/positions/:id', async (request, response) => {
    const id = Number(request.params.id)
    try {
        const result = await client.query('DELETE FROM position WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'position not found' });
        }
        response.status(204).end()
    } catch (err) {
        res.status(500).send(err.message);
    }
})

app.put('/api/positions/:id', async (request, response) => {
    const { ticker, quantity, buyPrice, currentPrice, exchange, currency } = request.body;
    const id = Number(request.params.id)
    if (!ticker) {
        return response.status(400).json({
            error: 'ticker missing'
        })
    }
    try {
        const result = await client.query(
            'UPDATE position SET ticker=$1, quantity=$2, buy_price=$3, current_price=$4, exchange=$5, currency=$6 WHERE id=$7  RETURNING *',
            [ticker, quantity, buyPrice, currentPrice, exchange, currency, id]);

        if (result.rows.length === 0) {
            return response.status(404).json({ error: 'position not found' })
        }

        const position = result.rows[0];
        response.json(position)
    } catch (err) {
        res.status(500).send(err.message);
    }
})

app.post('/api/positions', async (request, response) => {
    const { ticker, quantity, buyPrice, currentPrice, exchange, currency } = request.body;

    if (!ticker) {
        return response.status(400).json({
            error: 'ticker missing'
        })
    }

    try {
        const result = await client.query(
            'INSERT INTO position (ticker, quantity, buy_price, current_price, exchange, currency) VALUES ($1, $2, $3, $4, $5, $6)  RETURNING *',
            [ticker, quantity, buyPrice, currentPrice, exchange, currency]
        );
        const position = result.rows[0];

        response.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
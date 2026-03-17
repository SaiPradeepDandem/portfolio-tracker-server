const express = require('express');
const { Client } = require('pg');
const app = express();
const STOCK_API_KEY = "XXYZRX01OZAZUABM"; /* Ref: https://www.alphavantage.co/documentation/ */
const isLocal =
    !process.env.DATABASE_URL ||
    process.env.DATABASE_URL.includes("localhost") ||
    process.env.DATABASE_URL.includes("127.0.0.1");

const client = new Client({
    connectionString:
        process.env.DATABASE_URL ||
        "postgresql://postgres:super@localhost:5432/postgres",
    ssl: isLocal
        ? false
        : { rejectUnauthorized: false },
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

const SUCCESS_CODE = 201;
const VALIDATION_ERROR_CODE = 400;
const SERVER_ERROR_CODE = 500;

app.get('/', (request, response) => {
    response.send('<h1>Hello Portfolio Server!</h>')
})

app.get('/api/positions', async (request, response) => {
    try {
        const result = await client.query('SELECT * FROM position ORDER BY id');
        response.json(result.rows);
    } catch (err) {
        response.status(SERVER_ERROR_CODE).send(err.message);
    }
})

app.get('/api/positions/:id', async (request, response) => {
    const id = Number(request.params.id)
    try {
        const result = await client.query('SELECT * FROM position WHERE id = $1', [id]);
        response.json(result.rows[0]);
    } catch (err) {
        response.status(SERVER_ERROR_CODE).send(err.message);
    }
})

app.delete('/api/positions/:id', async (request, response) => {
    const id = Number(request.params.id)
    try {
        const result = await client.query('DELETE FROM position WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return response.status(404).json({ error: 'position not found' });
        }
        response.status(204).end()
    } catch (err) {
        response.status(SERVER_ERROR_CODE).send(err.message);
    }
})

app.put('/api/positions/:id', async (request, response) => {
    const { ticker, quantity, buy_price, current_price, exchange, currency } = request.body;
    const id = Number(request.params.id)
    const validateMsg = validatePosition({ ticker, quantity, buy_price, current_price, exchange, currency });
    if (validateMsg != null) {
        return response.status(VALIDATION_ERROR_CODE).json({
            error: validateMsg
        })
    }
    try {
        const result = await client.query(
            'UPDATE position SET ticker=$1, quantity=$2, buy_price=$3, current_price=$4, exchange=$5, currency=$6 WHERE id=$7  RETURNING *',
            [ticker, quantity, buy_price, current_price, exchange, currency, id]);

        if (result.rows.length === 0) {
            return response.status(404).json({ error: 'position not found' })
        }

        const position = result.rows[0];
        response.json(position)
    } catch (err) {
        response.status(SERVER_ERROR_CODE).send(err.message);
    }
})

app.post('/api/positions', async (request, response) => {
    const { ticker, quantity, buy_price, current_price, exchange, currency } = request.body;

    const validateMsg = validatePosition({ ticker, quantity, buy_price, current_price, exchange, currency });
    if (validateMsg != null) {
        return response.status(VALIDATION_ERROR_CODE).json({
            error: validateMsg
        })
    }

    try {
        const result = await client.query(
            'INSERT INTO position (ticker, quantity, buy_price, current_price, exchange, currency) VALUES ($1, $2, $3, $4, $5, $6)  RETURNING *',
            [ticker, quantity, buy_price, current_price, exchange, currency]
        );
        const position = result.rows[0];

        response.status(SUCCESS_CODE).json(result.rows[0]);
    } catch (err) {
        response.status(SERVER_ERROR_CODE).send(err.message);
    }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})

const validatePosition = ({ ticker, quantity, buy_price, current_price, exchange, currency }) => {
    if (!ticker) {
        return 'Ticker missing';
    }
    if (!quantity) {
        return 'Quantity missing';
    }
    if (!buy_price) {
        return 'Buy Price missing';
    }
    if (!current_price) {
        return 'Current Price missing';
    }
    if (!exchange) {
        return 'Exchange missing';
    }
    if (!currency) {
        return 'Currency missing';
    }
    return null;
}

var apiRequest = require('request');

app.get('/api/ticker/:id', async (request, response) => {
    const ticker = request.params.id

    var url = 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol='+ticker+'&apikey='+STOCK_API_KEY;

    apiRequest.get({
        url: url,
        json: true,
        headers: { 'User-Agent': 'request' }
    }, (err, res, data) => {
        if (err) {
            console.log('Error:', err);
            response.status(SERVER_ERROR_CODE).send("Error");
        } else if (res.statusCode !== 200) {
            console.log('Status:', res.statusCode);
            response.status(res.statusCode).send("Error");
        } else {
            // data is successfully parsed as a JSON object:
            console.log(data);
            response.json(data);
        }
    });
})

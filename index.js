const express = require('express')
const app = express()
app.use(express.json())

const cors = require('cors')
app.use(cors())

app.use(express.static('dist'))

let positions = [
    {
        id: 1,
        ticker: "WDS",
        quantity: 20,
        buyPrice: 26.01,
        currentPrice: 24.36,
        exchange: "ASX",
        currency: "AUD",
    },
    {
        id: 2,
        ticker: "TLS",
        quantity: 200,
        buyPrice: 1.04,
        currentPrice: 1.56,
        exchange: "ASX",
        currency: "AUD",
    },
    {
        id: 3,
        ticker: "VGA",
        quantity: 10,
        buyPrice: 226.55,
        currentPrice: 226.90,
        exchange: "ASX",
        currency: "AUD",
    },
    {
        id: 4,
        ticker: "NVO",
        quantity: 44,
        buyPrice: 85.01,
        currentPrice: 80.25,
        exchange: "NYSE",
        currency: "USD",
    }
]

app.get('/', (request, response) => {
    response.send('<h1>Hello Portfolio Server!</h>')
})

app.get('/api/positions', (request, response) => {
    response.json(positions)
})

app.get('/api/positions/:id', (request, response) => {
    const id = Number(request.params.id)
    console.log("Asking for : ", positions)
    const position = positions.find(position => position.id === id)
    console.log("Position for : ", position)
    if (position) {
        response.json(position)
    } else {
        response.status(404).end()
    }
})

app.delete('/api/positions/:id', (request, response) => {
    const id = Number(request.params.id)
    const initialLength = positions.length
    positions = positions.filter(position => position.id !== id)

    if (positions.length === initialLength) {
        return response.status(404).json({ error: 'position not found' })
    }
    
    response.status(204).end()
})

const generateId = () => {
    const maxId = positions.length > 0
        ? Math.max(...positions.map(n => n.id))
        : 0
    return maxId + 1  
}

app.put('/api/positions/:id', (request, response) => {
    const id = Number(request.params.id)
    const index = positions.findIndex(p => p.id === id)

    if (index === -1) {
        return response.status(404).json({ error: 'position not found' })
    }

    const body = request.body
    if (!body.ticker) {
        return response.status(400).json({
            error: 'ticker missing'
        })
    }
    const position = {
        id: id,
        ticker: body.ticker,
        quantity: body.quantity,
        buyPrice: body.buyPrice,
        currentPrice: body.currentPrice,
        exchange: body.exchange,
        currency: body.currency,
    }
    positions[index] = position
    response.json(position)
})

app.post('/api/positions', (request, response) => {
    const body = request.body

    if (!body.ticker) {
        return response.status(400).json({
            error: 'ticker missing'
        })
    }

    const position = {
        id: generateId(),
        ticker: body.ticker,
        quantity: body.quantity,
        buyPrice: body.buyPrice,
        currentPrice: body.currentPrice,
        exchange: body.exchange,
        currency: body.currency,
    }

    positions = positions.concat(position)

    response.json(position)
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
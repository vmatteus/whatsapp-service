import express from 'express'
import cors from 'cors'
import { startWhatsAppConnection } from './services/whatsapp.js'
import messageRoutes from './routes/messages.js'

const app = express()
app.use(cors())
app.use(express.json())

// Routes
app.use('/api', messageRoutes)

// Start HTTP server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`API rodando na porta ${PORT}`)
})

// Start WhatsApp connection
startWhatsAppConnection()
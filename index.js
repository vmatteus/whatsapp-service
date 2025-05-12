import express from 'express'
import cors from 'cors'
import { sequelize } from './config/database.js'
import { startWhatsAppConnection } from './services/whatsapp.js'
import messageRoutes from './routes/routes.js'
import { initializeModels } from './models/init_models.js'
import { listDevices as listDevicesModel } from './models/device_model.js'

const app = express()
const PORT = process.env.PORT || 3000

// Middleware setup
app.use(cors())
app.use(express.json())
app.use('/api', messageRoutes)

// Device connection handler
const startDevice = async (deviceId) => {
    try {
        await startWhatsAppConnection(deviceId)
        console.log(`Conexão iniciada para o dispositivo ${deviceId}`)
    } catch (error) {
        console.error(`Erro ao iniciar conexão para o dispositivo ${deviceId}:`, error)
    }
}

// Database and devices initialization
const initializeDevices = async () => {
    try {
        const devices = await listDevicesModel()
        console.log(`Encontrados ${devices.length} dispositivos`)
        
        return Promise.all(
            devices.map(device => startDevice(device.id))
        )
    } catch (error) {
        console.error('Erro ao inicializar dispositivos:', error)
        throw error
    }
}

// Main application startup
const startServer = async () => {
    try {
        // Initialize database
        await sequelize.authenticate()
        console.log('Conexão com o banco de dados estabelecida com sucesso.')
        
        await initializeModels()
        console.log('Modelos sincronizados com sucesso.')

        // Start HTTP server
        app.listen(PORT, () => {
            console.log(`API rodando na porta ${PORT}`)
        })

        // Initialize WhatsApp connections
        await initializeDevices()
        console.log('Inicialização completa')

    } catch (error) {
        console.error('Erro fatal durante inicialização:', error)
        process.exit(1)
    }
}

// Start application
startServer()
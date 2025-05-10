import express from 'express'
import cors from 'cors'
import { sequelize } from './config/database.js'
import { startWhatsAppConnection, listDevices } from './services/whatsapp.js'
import messageRoutes from './routes/routes.js'
import { initializeModels } from './models/init_models.js'
import { listDevices as listDevicesModel } from './models/device_model.js'

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

const startDevice = async (deviceId) => {
    try {
        await startWhatsAppConnection(deviceId)
        console.log(`Conexão iniciada para o dispositivo ${deviceId}`)
    } catch (error) {
        console.error(`Erro ao iniciar conexão para o dispositivo ${deviceId}:`, error)
    }
}

// Start multiple WhatsApp connections
const startConnections = async () => {
    try {

        await sequelize.authenticate()
        console.log('Conexão com o banco de dados estabelecida com sucesso.')
        
        await initializeModels()
        console.log('Modelos sincronizados com sucesso.')
 
        const PORT = process.env.PORT || 3000
        app.listen(PORT, () => {
            console.log(`API rodando na porta ${PORT}`)
        })

        const devices = listDevicesModel()
        const devicesList = []; 
        devices.then(devices => {

            devicesList.push(...devices.map(device => device))

            for (const device of devicesList) {
                console.log(`Dispositivo encontrado: ${device.id}`)
                startDevice(device.id)
            }
            
        }).catch(error => {
            console.error('Erro ao listar dispositivos:', error)
        })
    } catch (error) {
        console.error('Erro ao iniciar as conexões:', error)
    }
}

// Initialize connections
startConnections()
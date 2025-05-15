import express from 'express'
import { sendMessageWTyping, isConnected, startWhatsAppConnection, getQRCode, checkDeviceConnection } from '../services/whatsapp.js'
import DeviceModel from '../models/device_model.js'
import { v4 as uuidv4 } from 'uuid'
import Webhook from '../models/webhook_model.js'

const router = express.Router()

async function checkDatabaseHealth() {
    try {
        await DeviceModel.findOne();
        return true;
    } catch (error) {
        console.error('Database health check failed:', error);
        return false;
    }
}

router.get('/health', async (req, res) => {
    try {
        const healthInfo = {
            status: 'UP',
            timestamp: new Date().toISOString(),
            service: {
                name: 'whatsapp-service-api',
                version: process.env.npm_package_version || '1.0.0'
            },
            dependencies: {
                database: await checkDatabaseHealth(),
                whatsapp: {
                    default: isConnected('default'),
                    activeDevices: await DeviceModel.count()
                }
            },
            uptime: process.uptime(),
            memory: {
                usage: process.memoryUsage().heapUsed / 1024 / 1024,
                unit: 'MB'
            }
        };

        const isHealthy = healthInfo.dependencies.database && 
                         Object.values(healthInfo.dependencies.whatsapp).some(v => v);

        res.status(isHealthy ? 200 : 503).json(healthInfo);
    } catch (error) {
        res.status(503).json({
            status: 'DOWN',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

router.post('/send-message', async (req, res) => {
    try {
        const { number, message, deviceId = 'default' } = req.body

        if (!number || !message) {
            return res.status(400).json({ 
                error: 'Número e mensagem são obrigatórios' 
            })
        }

        if (!isConnected(deviceId)) {
            return res.status(500).json({ 
                error: `WhatsApp não está conectado no device ${deviceId}` 
            })
        }

        const jid = `${number}@s.whatsapp.net`
        await sendMessageWTyping({ text: message }, jid, deviceId)

        res.json({ 
            success: true, 
            message: `Mensagem enviada para ${number} usando device ${deviceId}` 
        })
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error)
        res.status(500).json({ 
            error: 'Erro ao enviar mensagem',
            details: error.message 
        })
    }
})

router.post('/connection', async (req, res) => {
    try {
        
        const deviceId = uuidv4()

        DeviceModel.findOrCreate({
            where: { id: deviceId },
            defaults: { isConnected: false }
        }).then(([device, created]) => {
            if (created) {
                console.log(`Dispositivo ${deviceId} criado com sucesso`)
            } else {
                console.log(`Dispositivo ${deviceId} já existe`)
            }
        })

        await startWhatsAppConnection(deviceId)
        res.json({ 
            success: true, 
            deviceId: deviceId,
            message: `Connection started for device ${deviceId}`,
        })
    } catch (error) {
        console.error('Error starting connection:', error)
        res.status(500).json({ 
            error: 'Failed to start connection',
            details: error.message 
        })
    }
})

router.get('/qr/:deviceId', (req, res) => {
    const deviceId = req.params.deviceId || 'default'
    const qr = getQRCode(deviceId)

    console.log('QR Code:', qr)
    
    if (!qr) {
        return res.status(404).json({ 
            error: 'QR code not available. Device might be already connected.' 
        })
    }

    res.json({ 
        deviceId,
        qr
    })
})

router.get('/status/:deviceId', async (req, res) => {
    try {
        const { deviceId } = req.params
        const status = await checkDeviceConnection(deviceId)
        res.json(status)
    } catch (error) {
        res.status(500).json({
            error: 'Failed to check device status',
            details: error.message
        })
    }
})

router.post('/webhooks', async (req, res) => {
    try {
        const { deviceId, event, url } = req.body
        
        if (!deviceId || !event || !url) {
            return res.status(400).json({
                error: 'deviceId, event and url are required'
            })
        }

        const webhook = await Webhook.create({
            deviceId,
            event,
            url
        })

        res.status(201).json(webhook)
    } catch (error) {
        res.status(500).json({
            error: 'Failed to create webhook',
            details: error.message
        })
    }
})

router.get('/webhooks/:deviceId', async (req, res) => {
    try {
        const webhooks = await Webhook.findAll({
            where: { deviceId: req.params.deviceId }
        })
        res.json(webhooks)
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch webhooks',
            details: error.message
        })
    }
})



export default router
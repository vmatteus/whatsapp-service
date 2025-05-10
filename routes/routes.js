import express from 'express'
import { sendMessageWTyping, isConnected, startWhatsAppConnection, getQRCode, checkDeviceConnection } from '../services/whatsapp.js'
import DeviceModel from '../models/device_model.js'

const router = express.Router()

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
        const { deviceId } = req.body
        
        if (!deviceId) {
            return res.status(400).json({ 
                error: 'deviceId is required' 
            })
        }

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
            message: `Connection started for device ${deviceId}` 
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



export default router
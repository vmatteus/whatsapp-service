import express from 'express'
import { sendMessageWTyping, isConnected, listDevices, startWhatsAppConnection, getQRCode } from '../services/whatsapp.js'

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

router.get('/devices', (req, res) => {
    const devices = listDevices()
    res.json({ devices })
})

router.post('/connection', async (req, res) => {
    try {
        const { deviceId } = req.body
        
        if (!deviceId) {
            return res.status(400).json({ 
                error: 'deviceId is required' 
            })
        }

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

export default router
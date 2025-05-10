import express from 'express'
import { sendMessageWTyping, isConnected, listDevices } from '../services/whatsapp.js'

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

export default router
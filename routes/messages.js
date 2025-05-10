import express from 'express'
import { sendMessageWTyping, isConnected } from '../services/whatsapp.js'

const router = express.Router()

router.post('/send-message', async (req, res) => {
    try {
        const { number, message } = req.body

        if (!number || !message) {
            return res.status(400).json({ 
                error: 'Número e mensagem são obrigatórios' 
            })
        }

        if (!isConnected()) {
            return res.status(500).json({ 
                error: 'WhatsApp não está conectado' 
            })
        }

        const jid = `${number}@s.whatsapp.net`
        await sendMessageWTyping({ text: message }, jid)

        res.json({ 
            success: true, 
            message: `Mensagem enviada para ${number}` 
        })
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error)
        res.status(500).json({ 
            error: 'Erro ao enviar mensagem',
            details: error.message 
        })
    }
})

export default router
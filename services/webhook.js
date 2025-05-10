import axios from 'axios'
import Webhook from '../models/webhook_model.js'

const EVENT_TYPES = {
    MESSAGE_RECEIVED: 'message.received',
    MESSAGE_SENT: 'message.sent',
    CONNECTION_UPDATE: 'connection.update',
    QR_UPDATE: 'qr.update'
}

const transformPayload = (event, data) => {
    switch(event) {
        case EVENT_TYPES.MESSAGE_RECEIVED:
            return {
                type: 'message_received',
                deviceId: data.deviceId,
                message: {
                    from: data.from,
                    type: data.messageType,
                    content: data.content,
                    timestamp: data.timestamp,
                    sender: data.pushName,
                    isGroup: data.isGroup,
                    fromMe: data.fromMe
                }
            }
        case EVENT_TYPES.CONNECTION_UPDATE:
            return {
                type: 'connection_update',
                deviceId: data.deviceId,
                status: data.connection,
                timestamp: new Date().toISOString()
            }
        default:
            return data
    }
}

const sendWebhook = async (url, payload) => {
    try {
        const response = await axios.post(url, payload)
        return {
            success: true,
            statusCode: response.status,
            data: response.data
        }
    } catch (error) {
        console.error('Webhook delivery failed:', error)
        return {
            success: false,
            statusCode: error.response?.status,
            error: error.message
        }
    }
}

export const dispatchWebhook = async (event, data) => {
    const webhooks = await Webhook.findAll({
        where: {
            event,
            deviceId: data.deviceId,
            isActive: true
        }
    })

    const payload = transformPayload(event, data)
    
    for (const webhook of webhooks) {
        const result = await sendWebhook(webhook.url, payload)
        
        await webhook.update({
            lastCall: new Date(),
            lastResponse: JSON.stringify(result)
        })
    }
}
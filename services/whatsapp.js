import pkg from '@whiskeysockets/baileys'
import { logger } from '../config/logger.js'
import { sessionManager } from './sessions.js'
import EventEmitter from 'events'
import { Boom } from '@hapi/boom'
import { dispatchWebhook } from './webhook.js'


const CONNECTION_STATUS = {
    CONNECTED: 'connected',
    CONNECTING: 'connecting',
    DISCONNECTED: 'disconnected',
    ERROR: 'error'
}

const { 
    makeWASocket,
    delay,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore, // Add this import
    useMultiFileAuthState
} = pkg

const eventEmitter = new EventEmitter()

let qrCodes = new Map()

export const checkDeviceConnection = async (deviceId = 'default') => {
    try {
        const sock = sessionManager.getSession(deviceId)
        if (!sock) {
            return {
                status: CONNECTION_STATUS.DISCONNECTED,
                message: 'Device not initialized',
            }
        }

        // Try to get connection state by sending presence update
        await sock.sendPresenceUpdate('available')
        
        return {
            status: CONNECTION_STATUS.CONNECTED,
            message: 'Device is connected and responding',
        }
    } catch (error) {
        // Check if error is from Baileys
        if (error instanceof Boom) {
            return {
                status: CONNECTION_STATUS.ERROR,
                message: error.output.payload.message,
                error: error.output.payload.error,
                timestamp: new Date().toISOString()
            }
        }

        return {
            status: CONNECTION_STATUS.ERROR,
            message: error.message,
            timestamp: new Date().toISOString()
        }
    }
}

export const sendMessageWTyping = async(msg, jid, deviceId = 'default') => {
    const sock = sessionManager.getSession(deviceId)
    if (!sock) {
        throw new Error(`Device ${deviceId} não está conectado`)
    }
    
    await sock.presenceSubscribe(jid)
    await delay(500)

    await sock.sendPresenceUpdate('composing', jid)
    await delay(2000)

    await sock.sendPresenceUpdate('paused', jid)

    const messageToSend = {
        text: msg.toString(),
        contextInfo: {
            isForwarded: false,
            externalAdReply: {
                title: "BotMessage",
                body: "Mensagem_API",
                previewType: "PHOTO",
                thumbnailUrl: "",
                sourceUrl: "",
                mediaType: 1,
                renderLargerThumbnail: true,
                showAdAttribution: false
            }
        }
    };

    await sock.sendMessage(jid, messageToSend)
}

const extractMessageContent = (message) => {
    const messageType = Object.keys(message.message || {})[0]
    const messageContent = message.message?.[messageType] || {}
    return {
        type: messageType,
        content: messageType === 'conversation' ? messageContent : messageContent.text || JSON.stringify(messageContent)
    }
}

export const startWhatsAppConnection = async (deviceId = 'default') => {
    const { state, saveCreds } = await sessionManager.createSession(deviceId)
    const { version, isLatest } = await fetchLatestBaileysVersion()
    
    console.log(`Device ${deviceId}: using WA v${version.join('.')}, isLatest: ${isLatest}`)

    const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: true,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        generateHighQualityLinkPreview: true
    })

    sessionManager.addSession(deviceId, sock)

    //message.message.extendedTextMessage.contextInfo.externalAdReply

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        for (const message of messages) {

            var messageApi = message.message?.extendedTextMessage?.contextInfo?.externalAdReply?.body

            //if (message.key.fromMe) continue
            const { type: msgType, content } = extractMessageContent(message)
            const messageData = {
                deviceId,
                type,
                messageType: msgType,
                from: message.key.remoteJid,
                content,
                timestamp: new Date(message.messageTimestamp * 1000).toISOString(),
                pushName: message.pushName,
                isGroup: message.key.remoteJid.endsWith('@g.us'),
                fromMe: message.key.fromMe,
                isNewsletter: message.key.remoteJid.includes('@newsletter'),
                isBroadcast: message.key.remoteJid.endsWith('@broadcast'),
                fromApi: messageApi == "Mensagem_API",
                
                // Add debug info
                messageSource: message.key.remoteJid.includes('@newsletter') ? 'Newsletter' : 
                            message.key.remoteJid.endsWith('@g.us') ? 'Group' : 
                            message.key.remoteJid.endsWith('@broadcast') ? 'Broadcast' : 
                            'Direct Message'
            }
    
            console.log('Nova mensagem recebida:', messageData)
            await dispatchWebhook('message.received', messageData)
        }
    })

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update
        
        if(qr) {
            qrCodes.set(deviceId, qr)
            eventEmitter.emit('qr.update', { deviceId, qr })
            console.log(`Device ${deviceId}: new QR code generated`)
        }
        
        if(connection === 'close') {
            if(lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                startWhatsAppConnection(deviceId)
            } else {
                console.log(`Device ${deviceId}: Connection closed. You are logged out.`)
            }
        }

        if(connection === 'open') {
            qrCodes.delete(deviceId)
            console.log(`Device ${deviceId}: connected successfully`)
            
            // Add periodic connection check
            setInterval(async () => {
                const status = await checkDeviceConnection(deviceId)
                if (status.status !== CONNECTION_STATUS.CONNECTED) {
                    console.log(`Device ${deviceId}: Connection check failed`, status)
                }
            }, 30000) // Check every 30 seconds
        }

        await dispatchWebhook('connection.update', {
            deviceId,
            ...update
        })
        
        
        console.log(`Device ${deviceId}: connection update`, update)
    })

    sock.ev.on('creds.update', saveCreds)

    return sock
}

export const isConnected = (deviceId = 'default') => {
    return sessionManager.getSession(deviceId) !== null
}

export const listDevices = () => {
    return sessionManager.getAllSessions()
}

export const getQRCode = (deviceId = 'default') => {
    return qrCodes.get(deviceId)
}

export const subscribeToQRUpdates = (callback) => {
    eventEmitter.on('qr.update', callback)
    return () => eventEmitter.off('qr.update', callback)
}
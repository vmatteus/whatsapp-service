import pkg from '@whiskeysockets/baileys'
import { logger } from '../config/logger.js'
import { sessionManager } from './sessions.js'
import EventEmitter from 'events'

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

    await sock.sendMessage(jid, msg)
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

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        for (const message of messages) {
            // Skip messages sent by us
            if (message.key.fromMe) continue

            const { type: msgType, content } = extractMessageContent(message)
            
            console.log('Nova mensagem recebida:', {
                deviceId,
                type,
                messageType: msgType,
                from: message.key.remoteJid,
                content,
                timestamp: new Date(message.messageTimestamp * 1000).toISOString(),
                pushName: message.pushName
            })
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
                sessionManager.removeSession(deviceId)
            }
        }

        if(connection === 'open') {
            // Clear QR code when connected
            qrCodes.delete(deviceId)
            console.log(`Device ${deviceId}: connected successfully`)
        }
        
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
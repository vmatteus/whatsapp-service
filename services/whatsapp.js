import pkg from '@whiskeysockets/baileys'
import { logger } from '../config/logger.js'
import { sessionManager } from './sessions.js'

const { 
    makeWASocket,
    delay,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore, // Add this import
    useMultiFileAuthState
} = pkg

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

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        
        if(connection === 'close') {
            if(lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                startWhatsAppConnection(deviceId)
            } else {
                console.log(`Device ${deviceId}: Connection closed. You are logged out.`)
                sessionManager.removeSession(deviceId)
            }
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
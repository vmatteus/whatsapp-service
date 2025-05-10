import pkg from '@whiskeysockets/baileys'
import { logger } from '../config/logger.js'

const { 
    makeWASocket,
    delay,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    useMultiFileAuthState
} = pkg

let globalSock = null

export const sendMessageWTyping = async(msg, jid) => {
    if (!globalSock) {
        throw new Error('WhatsApp não está conectado')
    }
    
    await globalSock.presenceSubscribe(jid)
    await delay(500)

    await globalSock.sendPresenceUpdate('composing', jid)
    await delay(2000)

    await globalSock.sendPresenceUpdate('paused', jid)

    await globalSock.sendMessage(jid, msg)
}

export const startWhatsAppConnection = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info')
    const { version, isLatest } = await fetchLatestBaileysVersion()
    
    console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`)

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

    globalSock = sock

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        
        if(connection === 'close') {
            if(lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                startWhatsAppConnection()
            } else {
                console.log('Connection closed. You are logged out.')
            }
        }
        
        console.log('connection update', update)
    })

    sock.ev.on('creds.update', saveCreds)

    return sock
}

export const isConnected = () => globalSock !== null
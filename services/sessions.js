import { useMultiFileAuthState } from '@whiskeysockets/baileys'

export class SessionManager {
    constructor() {
        this.sessions = new Map()
    }

    async createSession(deviceId) {
        const sessionFolder = `baileys_auth_info_${deviceId}`
        const { state, saveCreds } = await useMultiFileAuthState(sessionFolder)
        return { state, saveCreds }
    }

    addSession(deviceId, sock) {
        this.sessions.set(deviceId, sock)
    }

    getSession(deviceId) {
        return this.sessions.get(deviceId)
    }

    getAllSessions() {
        return Array.from(this.sessions.keys())
    }

    removeSession(deviceId) {
        this.sessions.delete(deviceId)
    }
}

export const sessionManager = new SessionManager()
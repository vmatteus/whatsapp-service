import { useMultiFileAuthState } from '@whiskeysockets/baileys'
import fs from 'fs/promises'
import path from 'path'

export class SessionManager {
    constructor() {
        this.sessions = new Map()
        this.baseFolder = './sessions'
    }

    getSessionFolder(deviceId) {
        return path.join(this.baseFolder, `baileys_auth_info_${deviceId}`)
    }

    async createSession(deviceId) {
        const sessionFolder = this.getSessionFolder(deviceId)
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
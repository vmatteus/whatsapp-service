import Session from '../models/session_model.js';
import {
    initAuthCreds,
    BufferJSON,
} from '@whiskeysockets/baileys';

class SessionManager {
    constructor() {
        this.sessions = new Map();
    }
    
    _serializeData(data) {
        return JSON.stringify(data, BufferJSON.replacer);
    }

    _deserializeData(jsonData) {
        if (!jsonData) {
            return null;
        }
        return JSON.parse(jsonData, BufferJSON.reviver);
    }

    async createSession(deviceId) {
        try {
            const savedSession = await Session.findByPk(deviceId);

            const initialCreds = savedSession?.creds
                ? this._deserializeData(savedSession.creds)
                : initAuthCreds();

            const authState = {
                creds: initialCreds,
                keys: {
                    get: async (type, ids) => {
                        const sessionRecord = await Session.findByPk(deviceId);
                        const allKeys = sessionRecord?.keys ? this._deserializeData(sessionRecord.keys) : {};
                        const dataToReturn = {};
                        if (allKeys[type]) {
                            for (const id of ids) {
                                if (allKeys[type][id] !== undefined) {
                                    dataToReturn[id] = allKeys[type][id];
                                }
                            }
                        }
                        return dataToReturn;
                    },
                    set: async (data) => {
                        const sessionRecord = await Session.findByPk(deviceId);
                        let allKeys = sessionRecord?.keys ? this._deserializeData(sessionRecord.keys) : {};

                        for (const type in data) {
                            if (!allKeys[type]) {
                                allKeys[type] = {};
                            }

                            for (const id in data[type]) {
                                const value = data[type][id];
                                if (value === null || value === undefined) {
                                    delete allKeys[type][id];
                                } else {
                                    allKeys[type][id] = value;
                                }
                            }

                            if (Object.keys(allKeys[type]).length === 0) {
                                delete allKeys[type];
                            }
                        }

                        await Session.upsert({
                            deviceId,
                            keys: this._serializeData(allKeys),
                        });
                    },
                },
            };

            const saveCreds = async () => {
                await Session.upsert({
                    deviceId,
                    creds: this._serializeData(authState.creds),
                });
            };

            return { state: authState, saveCreds };

        } catch (error) {
            console.error(`Erro ao criar/carregar sessão para ${deviceId}:`, error);
            throw error;
        }
    }

    addSession(deviceId, sock) {
        this.sessions.set(deviceId, sock);
    }

    getSession(deviceId) {
        return this.sessions.get(deviceId);
    }

    getAllSessions() {
        return Array.from(this.sessions.keys());
    }
}

export const sessionManager = new SessionManager();
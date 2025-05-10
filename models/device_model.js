import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const DeviceModel = sequelize.define('DeviceModel', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
}, {
    tableName: 'devices',
})

export default DeviceModel

export const listDevices = async () => {
    try {
        const devices = await DeviceModel.findAll()
        return devices
    } catch (error) {
        console.error('Erro ao listar dispositivos:', error)
        return []
    }
}

export const findOrCreateDevice = async (deviceId) => {
    try {
        const [device, created] = await DeviceModel.findOrCreate({
            where: { id: deviceId },
            defaults: { isConnected: false }
        })
        return { device, created }
    } catch (error) {
        console.error('Erro ao encontrar ou criar dispositivo:', error)
        return null
    }
}
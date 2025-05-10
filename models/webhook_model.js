import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const Webhook = sequelize.define('Webhook', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    deviceId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    event: {
        type: DataTypes.STRING,
        allowNull: false
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    lastCall: {
        type: DataTypes.DATE,
        allowNull: true
    },
    lastResponse: {
        type: DataTypes.TEXT,
        allowNull: true
    }
})

export default Webhook
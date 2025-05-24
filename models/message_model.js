import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const Message = sequelize.define('Message', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    messageId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    deviceId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    number: {
        type: DataTypes.STRING,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('sent', 'delivered', 'read', 'failed'),
        defaultValue: 'sent'
    },
    direction: {
        type: DataTypes.ENUM('outbound', 'inbound'),
        defaultValue: 'outbound'
    }
}, {
    timestamps: true,
    tableName: 'messages',
});

export default Message
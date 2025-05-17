import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Session = sequelize.define('Session', {
    deviceId: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    creds: {
        type: DataTypes.JSON,
        allowNull: true
    },
    keys: {
        type: DataTypes.JSON,
        allowNull: true
    }
}, {
    tableName: 'sessions',  
});

export default Session;
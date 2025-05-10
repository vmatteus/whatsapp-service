import { sequelize } from '../config/database.js'

export const initializeModels = async () => {
    try {
        await sequelize.sync()
        console.log('All models were synchronized successfully.')
    } catch (error) {
        console.error('Error synchronizing models:', error)
    }
}
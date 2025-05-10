import { Sequelize } from 'sequelize'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '..', 'database.sqlite')

export const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false
})
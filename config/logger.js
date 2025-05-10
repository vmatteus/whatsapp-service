import pino from 'pino'

export const logger = pino({ 
    timestamp: () => `,"time":"${new Date().toJSON()}"` 
}, pino.destination('./wa-logs.txt'))

logger.level = 'trace'
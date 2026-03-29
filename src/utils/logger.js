const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config');

const logPath = config.log.path;
if (!fs.existsSync(logPath)) {
    fs.mkdirSync(logPath, { recursive: true });
}

const logger = winston.createLogger({
    level: config.log.level,
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'cloud-storage' },
    transports: [
        new winston.transports.File({
            filename: path.join(logPath, 'error.log'),
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5
        }),
        new winston.transports.File({
            filename: path.join(logPath, 'combined.log'),
            maxsize: 5242880,
            maxFiles: 5
        })
    ]
});

if (config.app.env !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ level, message, timestamp, ...meta }) => {
                let msg = `${timestamp} [${level}]: ${message}`;
                if (Object.keys(meta).length > 0) {
                    msg += ` ${JSON.stringify(meta)}`;
                }
                return msg;
            })
        )
    }));
}

module.exports = logger;

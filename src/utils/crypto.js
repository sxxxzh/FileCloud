const crypto = require('crypto');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const hashPassword = async (password) => {
    return bcrypt.hash(password, SALT_ROUNDS);
};

const comparePassword = async (password, hash) => {
    return bcrypt.compare(password, hash);
};

const calculateFileHash = (buffer) => {
    return crypto.createHash('sha256').update(buffer).digest('hex');
};

const calculateStreamHash = (stream) => {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        stream.on('data', (chunk) => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
};

const generateUUID = () => {
    return crypto.randomUUID();
};

const generateShareCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

const generateAccessToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

module.exports = {
    hashPassword,
    comparePassword,
    calculateFileHash,
    calculateStreamHash,
    generateUUID,
    generateShareCode,
    generateAccessToken
};

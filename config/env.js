const path = require('path');

require('dotenv').config();

const rootDir = path.resolve(__dirname, '..');

const toBoolean = value => ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());

const toInteger = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const getEnv = (name, fallback = undefined) => {
    const value = process.env[name];
    if (value === undefined || value === '') {
        return fallback;
    }

    return value;
};

const config = {
    env: getEnv('NODE_ENV', 'development'),
    isProduction: getEnv('NODE_ENV') === 'production',
    server: {
        port: getEnv('PORT', '3000'),
        host: getEnv('HOST', '0.0.0.0'),
        publicBaseUrl: getEnv('PUBLIC_BASE_URL', 'http://localhost:3000').replace(/\/$/, ''),
    },
    paths: {
        root: rootDir,
        views: path.join(rootDir, 'views'),
        pages: path.join(rootDir, 'views', 'pages'),
        cdn: path.join(rootDir, 'cdn'),
    },
    auth: {
        tokenSecret: getEnv('TOKEN'),
        cookieSecure: toBoolean(getEnv('COOKIE_SECURE', getEnv('NODE_ENV') === 'production' ? 'true' : 'false')),
    },
    database: {
        uri: getEnv('MONGODB_URI'),
    },
    stripe: {
        secretKey: getEnv('STRIPE_SECRET_KEY'),
        priceId: getEnv('STRIPE_PRICE_ID', 'price_1OONmdLKKbjIkBYtejcN7ysV'),
        webhookSecret: getEnv('STRIPE_WEBHOOK_SECRET'),
    },
    openai: {
        apiKey: getEnv('OPENAI_API_KEY'),
        flashcardChunkSize: toInteger(getEnv('FLASHCARD_AI_CHUNK_SIZE'), 5000),
        flashcardMaxChars: toInteger(getEnv('FLASHCARD_AI_MAX_CHARS'), 30000),
    },
    analytics: {
        servalWidgetUrl: getEnv('SERVAL_WIDGET_URL'),
        servalSiteId: getEnv('SERVAL_SITE_ID'),
    },
};

module.exports = config;

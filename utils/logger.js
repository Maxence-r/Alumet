const format = (level, args) => {
    const timestamp = new Date().toISOString();
    return [`[${timestamp}]`, `[${level}]`, ...args];
};

module.exports = {
    info: (...args) => console.log(...format('info', args)),
    warn: (...args) => console.warn(...format('warn', args)),
    error: (...args) => console.error(...format('error', args)),
};

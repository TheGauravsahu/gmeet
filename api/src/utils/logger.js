const getTimestamp = () => new Date().toISOString();

export const logger = {
  info: (msg, ...args) => {
    console.log(`\x1b[36m[${getTimestamp()}] [INFO]\x1b[0m ${msg}`, ...args);
  },
  success: (msg, ...args) => {
    console.log(`\x1b[32m[${getTimestamp()}] [SUCCESS]\x1b[0m ${msg}`, ...args);
  },
  warn: (msg, ...args) => {
    console.warn(`\x1b[33m[${getTimestamp()}] [WARN]\x1b[0m ${msg}`, ...args);
  },
  error: (msg, ...args) => {
    console.error(`\x1b[31m[${getTimestamp()}] [ERROR]\x1b[0m ${msg}`, ...args);
  }
};

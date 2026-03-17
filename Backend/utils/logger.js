const write = (level, message, meta) => {
  const time = new Date().toISOString();

  if (meta) {
    console[level](`[${time}] ${message}`, meta);
    return;
  }

  console[level](`[${time}] ${message}`);
};

export const logger = {
  info: (message, meta) => write("log", message, meta),
  warn: (message, meta) => write("warn", message, meta),
  error: (message, meta) => write("error", message, meta),
};

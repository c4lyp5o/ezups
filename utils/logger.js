import deadslog from 'deadslog';

const logger = deadslog({
  fileOutput: {
    enabled: true,
    logFilePath: './logs/ezups.log',
  },
});

export default logger;

import { app, port } from './app.js';
import { logger } from './utils/logger.js';

app.listen(port, () => {
  logger.info(`API listening on http://localhost:${port}`);
});

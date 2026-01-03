import { app } from './app';
import { config } from './config';
import { prisma } from './lib/prisma';

const startServer = async (): Promise<void> => {
  try {
    await prisma.$connect();

    const server = app.listen(config.PORT, () => {
      console.log(`Server running on port ${config.PORT}`);
    });

    const shutdown = async () => {
      server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

startServer();

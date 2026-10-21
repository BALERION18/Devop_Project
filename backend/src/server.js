import app from './app.js';
import { config } from './config/env.js';
import { connectDB, getDBStatus } from './config/db.js';
import { collectSystemMetrics } from './services/systemMetricService.js';
import { ServerMetric } from './models/ServerMetric.js';

const startServer = async () => {
  console.log('----------------------------------------------------');
  console.log(' Starting DevOpsHub Backend API Server');
  console.log(` Environment: ${config.env}`);
  console.log('----------------------------------------------------');

  // Attempt database connection
  await connectDB();

  const server = app.listen(config.port, () => {
    console.log(`[HTTP Server] DevOpsHub API listening on port ${config.port}`);
    console.log(`[Health Endpoint] http://localhost:${config.port}/api/health`);
    console.log(`[Database Status] ${getDBStatus().readyStateText} (${getDBStatus().host})`);
  });

  // Background metric recorder (every 60 seconds)
  const metricInterval = setInterval(async () => {
    try {
      const dbStatus = getDBStatus();
      if (dbStatus.isConnected) {
        const metrics = await collectSystemMetrics();
        await ServerMetric.create({
          serverName: config.serverName,
          cpuUsagePercent: metrics.metrics.cpu.usagePercent,
          memory: {
            totalBytes: metrics.metrics.memory.totalBytes,
            usedBytes: metrics.metrics.memory.usedBytes,
            freeBytes: metrics.metrics.memory.freeBytes,
            usagePercent: metrics.metrics.memory.usagePercent,
          },
          disk: {
            totalBytes: metrics.metrics.disk.totalBytes,
            usedBytes: metrics.metrics.disk.usedBytes,
            freeBytes: metrics.metrics.disk.freeBytes,
            usagePercent: metrics.metrics.disk.usagePercent,
            available: metrics.metrics.disk.available,
          },
          loadAverage: metrics.server.loadAverage,
          uptimeSeconds: metrics.server.uptimeSeconds,
          isContainer: metrics.server.isContainer,
          platform: metrics.server.platform,
          arch: metrics.server.arch,
          hostname: metrics.server.hostname,
        });
      }
    } catch {
      // Background metric collection error suppressed
    }
  }, 60000);

  // Graceful shutdown handling
  const handleShutdown = (signal) => {
    console.log(`\n[Shutdown] Received ${signal}. Shutting down gracefully...`);
    clearInterval(metricInterval);
    server.close(() => {
      console.log('[Shutdown] Closed remaining HTTP connections.');
      process.exit(0);
    });

    // Force exit after 10s if connections linger
    setTimeout(() => {
      console.error('[Shutdown] Forcefully terminating server.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
};

startServer().catch((err) => {
  console.error('[Fatal Error] Failed to start server:', err);
  process.exit(1);
});

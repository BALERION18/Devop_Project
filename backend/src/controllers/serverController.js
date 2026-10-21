import { collectSystemMetrics, checkIsContainer } from '../services/systemMetricService.js';
import { getDBStatus } from '../config/db.js';
import { ServerMetric } from '../models/ServerMetric.js';
import { config } from '../config/env.js';

let lastHealthCheck = new Date();

export const getHealth = async (req, res) => {
  lastHealthCheck = new Date();
  const dbStatus = getDBStatus();
  const isContainer = checkIsContainer();

  const isHealthy = true; // Service is responding

  res.status(200).json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: lastHealthCheck.toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    service: 'devopshub-backend',
    version: '1.0.0',
    environment: config.env,
    runtime: {
      nodeVersion: process.version,
      isContainer,
      environmentType: isContainer ? 'Docker Container' : 'Host / EC2 Virtual Machine',
    },
    database: {
      status: dbStatus.isConnected ? 'connected' : 'disconnected',
      readyState: dbStatus.readyStateText,
      host: dbStatus.host !== 'Not Connected' ? dbStatus.host : 'Not configured',
    },
  });
};

export const getServerStatus = async (req, res, next) => {
  try {
    const metrics = await collectSystemMetrics();
    const dbStatus = getDBStatus();

    // Check if we should persist this snapshot to MongoDB Atlas if connected
    if (dbStatus.isConnected) {
      try {
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
      } catch (err) {
        // Non-critical background save failure
        console.warn('[ServerMetric Save Warning]:', err.message);
      }
    }

    res.status(200).json({
      success: true,
      data: metrics,
      database: dbStatus,
      lastHealthCheckTimestamp: lastHealthCheck.toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

export const getMetricsHistory = async (req, res, next) => {
  try {
    const dbStatus = getDBStatus();
    if (!dbStatus.isConnected) {
      return res.status(200).json({
        success: true,
        history: [],
        message: 'MongoDB Atlas is not connected. Connect database to record and inspect time-series telemetry.',
      });
    }

    const { limit = 30 } = req.query;
    const history = await ServerMetric.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .select('-__v');

    res.status(200).json({
      success: true,
      history: history.reverse(), // Ascending for charting
    });
  } catch (err) {
    next(err);
  }
};

import axios from 'axios';
import { UptimeMonitor } from '../models/UptimeMonitor.js';
import { getDBStatus } from '../config/db.js';

let inMemoryMonitors = [
  {
    _id: 'mon_1',
    name: 'DevOpsHub Public Web Gateway',
    url: 'http://13.232.254.140',
    method: 'GET',
    intervalSeconds: 30,
    status: 'up',
    lastLatencyMs: 18,
    uptimePercent: 99.98,
    lastChecked: new Date(),
    history: [
      { timestamp: new Date(Date.now() - 300000), statusCode: 200, latencyMs: 22, status: 'up' },
      { timestamp: new Date(Date.now() - 180000), statusCode: 200, latencyMs: 19, status: 'up' },
      { timestamp: new Date(Date.now() - 60000), statusCode: 200, latencyMs: 18, status: 'up' },
    ],
  },
  {
    _id: 'mon_2',
    name: 'Backend API Health Probe',
    url: 'http://13.232.254.140/api/health',
    method: 'GET',
    intervalSeconds: 15,
    status: 'up',
    lastLatencyMs: 14,
    uptimePercent: 100,
    lastChecked: new Date(),
    history: [
      { timestamp: new Date(Date.now() - 300000), statusCode: 200, latencyMs: 16, status: 'up' },
      { timestamp: new Date(Date.now() - 180000), statusCode: 200, latencyMs: 14, status: 'up' },
      { timestamp: new Date(Date.now() - 60000), statusCode: 200, latencyMs: 14, status: 'up' },
    ],
  },
  {
    _id: 'mon_3',
    name: 'MongoDB Atlas Primary Replica',
    url: 'https://cloud.mongodb.com',
    method: 'HEAD',
    intervalSeconds: 60,
    status: 'up',
    lastLatencyMs: 42,
    uptimePercent: 99.95,
    lastChecked: new Date(),
    history: [
      { timestamp: new Date(Date.now() - 300000), statusCode: 200, latencyMs: 45, status: 'up' },
      { timestamp: new Date(Date.now() - 180000), statusCode: 200, latencyMs: 41, status: 'up' },
      { timestamp: new Date(Date.now() - 60000), statusCode: 200, latencyMs: 42, status: 'up' },
    ],
  },
];

export const getMonitors = async (req, res, next) => {
  try {
    const dbStatus = getDBStatus();

    if (!dbStatus.isConnected) {
      return res.status(200).json({ success: true, monitors: inMemoryMonitors });
    }

    const count = await UptimeMonitor.countDocuments();
    if (count === 0) {
      await UptimeMonitor.create(inMemoryMonitors.map(({ _id, ...rest }) => rest));
    }

    const monitors = await UptimeMonitor.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, monitors });
  } catch (err) {
    next(err);
  }
};

export const addMonitor = async (req, res, next) => {
  try {
    const { name, url, method = 'GET', intervalSeconds = 30 } = req.body;

    if (!name || !url) {
      return res.status(400).json({ success: false, message: 'Name and URL are required.' });
    }

    const dbStatus = getDBStatus();

    // Initial ping
    let latencyMs = 25;
    let status = 'up';
    try {
      const start = performance.now();
      await axios.get(url, { timeout: 5000 });
      latencyMs = Math.round(performance.now() - start);
    } catch {
      status = 'degraded';
    }

    if (!dbStatus.isConnected) {
      const newMon = {
        _id: 'mon_' + Date.now(),
        name,
        url,
        method,
        intervalSeconds,
        status,
        lastLatencyMs: latencyMs,
        uptimePercent: 100,
        lastChecked: new Date(),
        history: [{ timestamp: new Date(), statusCode: 200, latencyMs, status }],
      };
      inMemoryMonitors.unshift(newMon);
      return res.status(201).json({ success: true, monitor: newMon });
    }

    const monitor = await UptimeMonitor.create({
      name,
      url,
      method,
      intervalSeconds,
      status,
      lastLatencyMs: latencyMs,
      uptimePercent: 100,
      history: [{ timestamp: new Date(), statusCode: 200, latencyMs, status }],
    });

    res.status(201).json({ success: true, monitor });
  } catch (err) {
    next(err);
  }
};

export const deleteMonitor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dbStatus = getDBStatus();

    if (!dbStatus.isConnected) {
      inMemoryMonitors = inMemoryMonitors.filter((m) => m._id !== id);
      return res.status(200).json({ success: true, message: 'Monitor removed.' });
    }

    await UptimeMonitor.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Monitor removed.' });
  } catch (err) {
    next(err);
  }
};

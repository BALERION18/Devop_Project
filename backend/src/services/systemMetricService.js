import os from 'os';
import fs from 'fs';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

// Cache CPU ticks to calculate non-blocking delta CPU usage
let previousCpuSnapshot = null;

const getCpuTicks = () => {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;

  for (const cpu of cpus) {
    for (const type in cpu.times) {
      total += cpu.times[type];
    }
    idle += cpu.times.idle;
  }

  return { idle, total };
};

// Initialize snapshot
previousCpuSnapshot = getCpuTicks();

export const calculateCpuUsage = async () => {
  const current = getCpuTicks();
  if (!previousCpuSnapshot) {
    previousCpuSnapshot = current;
    return 0;
  }

  const idleDelta = current.idle - previousCpuSnapshot.idle;
  const totalDelta = current.total - previousCpuSnapshot.total;
  previousCpuSnapshot = current;

  if (totalDelta <= 0) return 0;
  const usage = 100 - Math.round((idleDelta / totalDelta) * 100);
  return Math.max(0, Math.min(100, usage));
};

export const checkIsContainer = () => {
  try {
    if (fs.existsSync('/.dockerenv')) return true;
    if (fs.existsSync('/proc/1/cgroup')) {
      const cgroup = fs.readFileSync('/proc/1/cgroup', 'utf8');
      return cgroup.includes('docker') || cgroup.includes('containerd') || cgroup.includes('kubepods');
    }
  } catch {
    // Ignore error
  }
  return false;
};

export const getDiskUsage = async () => {
  try {
    const isWin = os.platform() === 'win32';
    if (isWin) {
      // Use wmic or PowerShell to inspect system drive
      try {
        const { stdout } = await execAsync('powershell -NoProfile -Command "Get-PSDrive -PSProvider FileSystem | Select-Object Root,Free,Used | ConvertTo-Json"');
        const parsed = JSON.parse(stdout);
        const drive = Array.isArray(parsed) ? parsed[0] : parsed;
        if (drive && drive.Free !== undefined && drive.Used !== undefined) {
          const free = drive.Free;
          const used = drive.Used;
          const total = free + used;
          const usagePercent = Math.round((used / total) * 100);
          return {
            totalBytes: total,
            usedBytes: used,
            freeBytes: free,
            usagePercent,
            available: true,
            mountPoint: drive.Root || 'C:\\',
          };
        }
      } catch {
        // Fallback to wmic
        const { stdout } = await execAsync('wmic logicaldisk get Caption,FreeSpace,Size /format:csv');
        const lines = stdout.trim().split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('Node'));
        for (const line of lines) {
          const parts = line.split(',');
          if (parts.length >= 3) {
            const free = parseInt(parts[2], 10);
            const total = parseInt(parts[3], 10);
            if (!isNaN(free) && !isNaN(total) && total > 0) {
              const used = total - free;
              return {
                totalBytes: total,
                usedBytes: used,
                freeBytes: free,
                usagePercent: Math.round((used / total) * 100),
                available: true,
                mountPoint: parts[1],
              };
            }
          }
        }
      }
    } else {
      // Linux / Unix / EC2
      const { stdout } = await execAsync('df -k / | tail -n 1');
      const parts = stdout.trim().split(/\s+/);
      if (parts.length >= 5) {
        const total = parseInt(parts[1], 10) * 1024;
        const used = parseInt(parts[2], 10) * 1024;
        const free = parseInt(parts[3], 10) * 1024;
        const percentStr = parts[4].replace('%', '');
        return {
          totalBytes: total,
          usedBytes: used,
          freeBytes: free,
          usagePercent: parseInt(percentStr, 10),
          available: true,
          mountPoint: parts[5] || '/',
        };
      }
    }
  } catch (err) {
    // Return explicit unavailable status without fabrication
    return {
      totalBytes: 0,
      usedBytes: 0,
      freeBytes: 0,
      usagePercent: 0,
      available: false,
      mountPoint: 'Unavailable',
      error: 'Disk metric collection requires host filesystem permissions or is restricted inside container environment',
    };
  }

  return {
    totalBytes: 0,
    usedBytes: 0,
    freeBytes: 0,
    usagePercent: 0,
    available: false,
    mountPoint: 'Unavailable',
  };
};

export const collectSystemMetrics = async () => {
  const cpuPercent = await calculateCpuUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = Math.round((usedMem / totalMem) * 100);
  const disk = await getDiskUsage();
  const isContainer = checkIsContainer();

  return {
    timestamp: new Date(),
    server: {
      hostname: os.hostname(),
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      type: os.type(),
      uptimeSeconds: Math.floor(os.uptime()),
      loadAverage: os.loadavg(),
      cpuCount: os.cpus().length,
      cpuModel: os.cpus()[0]?.model || 'Standard CPU',
      isContainer,
      environmentType: isContainer ? 'Docker Container' : 'Host Operating System / EC2 Instance',
    },
    metrics: {
      cpu: {
        usagePercent: cpuPercent,
        cores: os.cpus().length,
      },
      memory: {
        totalBytes: totalMem,
        usedBytes: usedMem,
        freeBytes: freeMem,
        totalGB: Number((totalMem / (1024 * 1024 * 1024)).toFixed(2)),
        usedGB: Number((usedMem / (1024 * 1024 * 1024)).toFixed(2)),
        freeGB: Number((freeMem / (1024 * 1024 * 1024)).toFixed(2)),
        usagePercent: memUsagePercent,
      },
      disk: {
        ...disk,
        totalGB: Number((disk.totalBytes / (1024 * 1024 * 1024)).toFixed(2)),
        usedGB: Number((disk.usedBytes / (1024 * 1024 * 1024)).toFixed(2)),
        freeGB: Number((disk.freeBytes / (1024 * 1024 * 1024)).toFixed(2)),
      },
      process: {
        pid: process.pid,
        nodeVersion: process.version,
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsage: process.memoryUsage(),
      },
    },
  };
};

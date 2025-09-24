#!/usr/bin/env node
// =============================================================================
// Kha-Boom! Performance Monitor
// =============================================================================

const fs = require('fs');
const path = require('path');

class PerformanceMonitor {
  constructor() {
    this.stats = {
      memoryUsage: [],
      cpuUsage: [],
      responseTime: [],
      errors: 0,
      requests: 0
    };
    
    this.startTime = Date.now();
    this.logFile = path.join(__dirname, '../logs/performance.log');
  }

  startMonitoring() {
    console.log('🔍 Starting Kha-Boom! Performance Monitor...');
    
    // Monitor every 30 seconds
    setInterval(() => {
      this.collectMetrics();
      this.logMetrics();
    }, 30000);

    // Log hourly summary
    setInterval(() => {
      this.generateHourlySummary();
    }, 3600000);
  }

  collectMetrics() {
    const memory = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    this.stats.memoryUsage.push({
      timestamp: new Date(),
      rss: memory.rss,
      heapUsed: memory.heapUsed,
      heapTotal: memory.heapTotal,
      external: memory.external
    });

    this.stats.cpuUsage.push({
      timestamp: new Date(),
      user: cpuUsage.user,
      system: cpuUsage.system
    });
  }

  logMetrics() {
    const memory = process.memoryUsage();
    const uptime = process.uptime();
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      memory: {
        rss: Math.round(memory.rss / 1024 / 1024),
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024)
      },
      requests: this.stats.requests,
      errors: this.stats.errors
    };

    console.log(`📈 ${logEntry.timestamp} - Memory: ${logEntry.memory.heapUsed}MB, Uptime: ${logEntry.uptime}s, Requests: ${logEntry.requests}`);
    
    // Write to log file
    this.writeToLog(logEntry);
  }

  writeToLog(data) {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    fs.appendFileSync(this.logFile, JSON.stringify(data) + '\n');
  }

  generateHourlySummary() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    
    const hourlyMemory = this.stats.memoryUsage.filter(
      m => m.timestamp > oneHourAgo
    );

    if (hourlyMemory.length === 0) return;

    const avgMemory = hourlyMemory.reduce((sum, m) => sum + m.heapUsed, 0) / hourlyMemory.length;
    const maxMemory = Math.max(...hourlyMemory.map(m => m.heapUsed));
    
    const summary = {
      timestamp: now.toISOString(),
      period: 'hourly',
      avgMemoryMB: Math.round(avgMemory / 1024 / 1024),
      maxMemoryMB: Math.round(maxMemory / 1024 / 1024),
      totalRequests: this.stats.requests,
      totalErrors: this.stats.errors,
      errorRate: this.stats.requests > 0 ? (this.stats.errors / this.stats.requests * 100).toFixed(2) + '%' : '0%'
    };

    console.log('📊 Hourly Summary:', summary);
    this.writeToLog(summary);

    // Reset hourly counters
    this.stats.memoryUsage = this.stats.memoryUsage.slice(-10);
    this.stats.cpuUsage = this.stats.cpuUsage.slice(-10);
  }

  incrementRequests() {
    this.stats.requests++;
  }

  incrementErrors() {
    this.stats.errors++;
  }

  recordResponseTime(time) {
    this.stats.responseTime.push({
      timestamp: new Date(),
      time
    });
  }
}

// Start monitoring if run directly
if (require.main === module) {
  const monitor = new PerformanceMonitor();
  monitor.startMonitoring();

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('💀 Performance monitor shutting down...');
    process.exit(0);
  });
}

module.exports = PerformanceMonitor;
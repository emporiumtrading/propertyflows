import { performance } from 'perf_hooks';
import { randomUUID } from 'crypto';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private markers: Map<string, number> = new Map();
  private maxMetrics: number = 10000;

  startMeasure(name: string): string {
    const id = `${name}::${randomUUID()}`;
    this.markers.set(id, performance.now());
    return id;
  }

  endMeasure(id: string, name: string): number {
    const start = this.markers.get(id);
    if (!start) {
      return 0;
    }

    const duration = performance.now() - start;
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
    });

    this.markers.delete(id);
    
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
    
    return duration;
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const id = this.startMeasure(name);
    try {
      const result = await fn();
      this.endMeasure(id, name);
      return result;
    } catch (error) {
      this.endMeasure(id, name);
      throw error;
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getAverageByName(name: string): number {
    const filtered = this.metrics.filter(m => m.name === name);
    if (filtered.length === 0) return 0;
    
    const sum = filtered.reduce((acc, m) => acc + m.duration, 0);
    return sum / filtered.length;
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  logSummary(): void {
    const summary = new Map<string, { count: number; total: number; avg: number; min: number; max: number }>();

    this.metrics.forEach(metric => {
      if (!summary.has(metric.name)) {
        summary.set(metric.name, { count: 0, total: 0, avg: 0, min: Infinity, max: 0 });
      }
      
      const stats = summary.get(metric.name)!;
      stats.count++;
      stats.total += metric.duration;
      stats.min = Math.min(stats.min, metric.duration);
      stats.max = Math.max(stats.max, metric.duration);
      stats.avg = stats.total / stats.count;
    });

    console.log('\n=== Performance Summary ===');
    summary.forEach((stats, name) => {
      console.log(`${name}:`);
      console.log(`  Count: ${stats.count}`);
      console.log(`  Avg: ${stats.avg.toFixed(2)}ms`);
      console.log(`  Min: ${stats.min.toFixed(2)}ms`);
      console.log(`  Max: ${stats.max.toFixed(2)}ms`);
    });
    console.log('===========================\n');
  }
}

export const perfMonitor = new PerformanceMonitor();

export function measurePerformance(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const methodName = `${target.constructor.name}.${propertyName}`;
    const id = perfMonitor.startMeasure(methodName);
    
    try {
      const result = await originalMethod.apply(this, args);
      const duration = perfMonitor.endMeasure(id, methodName);
      
      if (duration > 1000) {
        console.warn(`Slow operation detected: ${methodName} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      perfMonitor.endMeasure(id, methodName);
      throw error;
    }
  };

  return descriptor;
}

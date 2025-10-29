# Performance Monitoring Integration Guide

## Overview
PropertyFlows includes performance monitoring utilities that can track request/response times, identify slow operations, and provide metrics for optimization.

## Current Status
⚠️ **Performance monitoring tools are available but not yet integrated into the application.**

The monitoring infrastructure is in place:
- `server/performance.ts` - Performance monitoring class
- `tests/performance/load-test.ts` - Load testing utility

## Integration Steps

### 1. Integrate into Express Middleware
Add performance monitoring to all API requests:

```typescript
// server/index.ts
import { perfMonitor } from './performance';

app.use((req, res, next) => {
  const requestId = `${req.method} ${req.originalUrl}`;
  perfMonitor.startMeasure(requestId);
  
  res.on('finish', () => {
    const duration = perfMonitor.endMeasure(requestId);
    if (duration > 1000) {
      console.warn(`Slow request: ${requestId} took ${duration.toFixed(2)}ms`);
    }
  });
  
  next();
});
```

### 2. Monitor Database Operations
Track slow database queries:

```typescript
// server/storage.ts
import { perfMonitor, measurePerformance } from './performance';

class DatabaseStorage implements IStorage {
  @measurePerformance
  async getProperties(userId: string) {
    // Database operation
  }
  
  @measurePerformance
  async createLease(lease: InsertLease) {
    // Database operation
  }
}
```

### 3. Monitor External API Calls
Track third-party API performance:

```typescript
// server/routes.ts
import { perfMonitor } from './performance';

app.post('/api/maintenance/:id/triage', async (req, res) => {
  const result = await perfMonitor.measureAsync('openai-triage', async () => {
    const completion = await openai.chat.completions.create({
      // OpenAI API call
    });
    return completion;
  });
  
  res.json(result);
});
```

### 4. Add Metrics Endpoint
Expose performance metrics for monitoring:

```typescript
// server/routes.ts
app.get('/api/metrics', requireAdmin, (req, res) => {
  const metrics = perfMonitor.getMetrics();
  
  const summary = metrics.reduce((acc, m) => {
    if (!acc[m.name]) {
      acc[m.name] = { count: 0, total: 0, avg: 0, min: Infinity, max: 0 };
    }
    acc[m.name].count++;
    acc[m.name].total += m.duration;
    acc[m.name].min = Math.min(acc[m.name].min, m.duration);
    acc[m.name].max = Math.max(acc[m.name].max, m.duration);
    acc[m.name].avg = acc[m.name].total / acc[m.name].count;
    return acc;
  }, {});
  
  res.json(summary);
});
```

### 5. Scheduled Reporting
Log performance summaries periodically:

```typescript
// server/index.ts
import { perfMonitor } from './performance';

setInterval(() => {
  perfMonitor.logSummary();
  perfMonitor.clearMetrics(); // Reset after logging
}, 3600000); // Every hour
```

## Load Testing

### Running Load Tests
```bash
npx tsx tests/performance/load-test.ts
```

### Custom Load Test Configuration
Edit `tests/performance/load-test.ts`:

```typescript
runLoadTest({
  url: 'http://localhost:5000/api/properties',
  method: 'GET',
  duration: 30000, // 30 seconds
  concurrency: 20, // 20 concurrent requests
  headers: {
    'Cookie': 'session_id=...' // Add auth if needed
  }
}).then(result => {
  console.log(result);
});
```

## Performance Targets

### Response Time Goals
- **API Endpoints:** < 200ms (95th percentile)
- **Database Queries:** < 100ms (95th percentile)
- **External API Calls:** < 2000ms (depends on third party)
- **Page Load:** < 1000ms (initial render)

### Optimization Strategies

**Slow Database Queries:**
1. Add database indexes
2. Optimize query joins
3. Implement query result caching
4. Use connection pooling

**Slow API Responses:**
1. Enable response compression
2. Implement response caching
3. Optimize payload size
4. Use pagination for large datasets

**Slow External APIs:**
1. Implement request timeouts
2. Add retry logic with exponential backoff
3. Cache responses when appropriate
4. Use webhooks instead of polling

## Monitoring Dashboard

### Recommended Metrics to Track
1. **Request Rate:** Requests per second
2. **Response Time:** p50, p95, p99 percentiles
3. **Error Rate:** Percentage of failed requests
4. **Database Performance:** Query time, connection pool usage
5. **External API Performance:** Response time, error rate

### Integration with Monitoring Services
Consider integrating with:
- **Datadog:** Full-stack monitoring
- **New Relic:** Application performance monitoring
- **Sentry:** Error tracking and performance monitoring
- **Prometheus + Grafana:** Self-hosted metrics

## Next Steps

To enable full performance monitoring:
1. ✅ Performance monitoring utilities created
2. ⚠️ Add middleware integration (see Integration Steps)
3. ⚠️ Add database operation tracking
4. ⚠️ Add external API tracking
5. ⚠️ Create metrics endpoint
6. ⚠️ Set up scheduled reporting
7. ⚠️ Configure production monitoring service

## Performance Optimization Checklist

Before going to production:
- [ ] All database queries are indexed
- [ ] Response compression is enabled
- [ ] Static assets are cached properly
- [ ] Database connection pooling is configured
- [ ] Rate limiting is tuned for expected traffic
- [ ] Performance metrics are being collected
- [ ] Slow operation alerts are configured
- [ ] Load testing has been performed
- [ ] Performance targets are being met

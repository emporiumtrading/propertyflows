import http from 'http';

interface LoadTestConfig {
  url: string;
  method: string;
  duration: number;
  concurrency: number;
  headers?: Record<string, string>;
  body?: any;
}

interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
}

async function makeRequest(config: LoadTestConfig): Promise<number> {
  const start = Date.now();
  
  return new Promise((resolve, reject) => {
    const url = new URL(config.url);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method: config.method,
      headers: config.headers || {},
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const duration = Date.now() - start;
        resolve(duration);
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (config.body) {
      req.write(JSON.stringify(config.body));
    }

    req.end();
  });
}

export async function runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
  const results: number[] = [];
  const errors: Error[] = [];
  const startTime = Date.now();
  const endTime = startTime + config.duration;

  console.log(`Starting load test for ${config.duration}ms with ${config.concurrency} concurrent requests`);

  while (Date.now() < endTime) {
    const batch = Array(config.concurrency).fill(null).map(() => 
      makeRequest(config)
        .then(duration => results.push(duration))
        .catch(err => errors.push(err))
    );

    await Promise.all(batch);
  }

  const totalRequests = results.length + errors.length;
  const successfulRequests = results.length;
  const failedRequests = errors.length;
  const averageResponseTime = results.reduce((a, b) => a + b, 0) / results.length || 0;
  const minResponseTime = Math.min(...results) || 0;
  const maxResponseTime = Math.max(...results) || 0;
  const actualDuration = Date.now() - startTime;
  const requestsPerSecond = (totalRequests / actualDuration) * 1000;
  const errorRate = (failedRequests / totalRequests) * 100;

  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    averageResponseTime,
    minResponseTime,
    maxResponseTime,
    requestsPerSecond,
    errorRate,
  };
}

if (require.main === module) {
  runLoadTest({
    url: 'http://localhost:5000/api/auth/user',
    method: 'GET',
    duration: 10000,
    concurrency: 10,
  }).then(result => {
    console.log('\n=== Load Test Results ===');
    console.log(`Total Requests: ${result.totalRequests}`);
    console.log(`Successful: ${result.successfulRequests}`);
    console.log(`Failed: ${result.failedRequests}`);
    console.log(`Avg Response Time: ${result.averageResponseTime.toFixed(2)}ms`);
    console.log(`Min Response Time: ${result.minResponseTime.toFixed(2)}ms`);
    console.log(`Max Response Time: ${result.maxResponseTime.toFixed(2)}ms`);
    console.log(`Requests/sec: ${result.requestsPerSecond.toFixed(2)}`);
    console.log(`Error Rate: ${result.errorRate.toFixed(2)}%`);
    console.log('========================\n');
  }).catch(console.error);
}

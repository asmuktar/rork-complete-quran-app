import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { timeout } from "hono/timeout";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

// Define context variables type
type Variables = {
  requestId: string;
};

// app will be mounted at /api
const app = new Hono<{ Variables: Variables }>();

// Enable CORS for all routes with proper headers for concurrent requests
app.use("*", cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposeHeaders: ['Content-Length', 'X-Request-ID'],
  credentials: false,
  maxAge: 86400, // 24 hours
}));

// Add timeout middleware for better concurrent request handling
app.use("*", timeout(30000)); // 30 second timeout

// Add request ID middleware for tracking concurrent requests
app.use("*", async (c, next) => {
  const requestId = crypto.randomUUID();
  c.set('requestId', requestId);
  c.header('X-Request-ID', requestId);
  
  const start = Date.now();
  console.log(`[${requestId}] ${c.req.method} ${c.req.url} - Started`);
  
  await next();
  
  const duration = Date.now() - start;
  console.log(`[${requestId}] ${c.req.method} ${c.req.url} - Completed in ${duration}ms`);
});

// Mount tRPC router at /trpc with enhanced configuration
app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
    batching: {
      enabled: true,
    },
    onError: ({ error, path, input, ctx }) => {
      const requestId = ctx?.req?.header('X-Request-ID') || 'unknown';
      console.error(`[${requestId}] tRPC Error on ${path}:`, {
        error: error.message,
        input,
        stack: error.stack,
      });
    },
  })
);

// Enhanced health check endpoint with system info
app.get("/", (c) => {
  return c.json({ 
    status: "ok", 
    message: "API is running with concurrent support",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    concurrent: true,
    features: {
      batching: true,
      timeout: '30s',
      cors: true,
      requestTracking: true
    }
  });
});

// Connection stats endpoint
app.get("/stats", (c) => {
  return c.json({
    timestamp: new Date().toISOString(),
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version
    },
    features: {
      concurrentRequests: true,
      requestBatching: true,
      timeouts: '30s',
      retryLogic: 'enabled'
    }
  });
});

// Batch endpoint for multiple simultaneous requests
app.post("/batch", async (c) => {
  try {
    const requests = await c.req.json();
    
    if (!Array.isArray(requests)) {
      return c.json({ error: "Requests must be an array" }, 400);
    }
    
    // Process all requests concurrently
    const results = await Promise.allSettled(
      requests.map(async (req, index) => {
        try {
          const response = await fetch(req.url, {
            method: req.method || 'GET',
            headers: req.headers || {},
            body: req.body ? JSON.stringify(req.body) : undefined,
          });
          
          const data = await response.json();
          return { index, success: true, data, status: response.status };
        } catch (error) {
          return { 
            index, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 500
          };
        }
      })
    );
    
    return c.json({
      results: results.map((result, idx) => {
        if (result.status === 'fulfilled') {
          return {
            index: idx,
            success: result.value.success,
            data: result.value.data,
            status: result.value.status
          };
        } else {
          return {
            index: idx,
            success: false,
            error: result.reason?.message || 'Request failed',
            status: 500
          };
        }
      })
    });
  } catch (error) {
    return c.json({ 
      error: "Batch processing failed", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;
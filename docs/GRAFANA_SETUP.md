# Grafana Telemetry Documentation

This document describes the telemetry system implemented for the Kanban Board application.

## Overview

The application sends operational metrics to Grafana Cloud for monitoring and observability. All tracking is done server-side using Prometheus metrics.

## What's Tracked

### Backend Metrics (Prometheus)
- ✅ **Task operations**: created, deleted, moved, updated
- ✅ **Column operations**: created, deleted  
- ✅ **Board views**: tracked on each board query
- ✅ **API performance**: request duration histogram with status codes
- ✅ **API errors**: tracked by operation and error type
- ⚠️ **User metrics**: placeholders for logins, registrations, active users (not yet implemented)


## System Architecture

```
┌─────────────┐
│   Browser   │
│  (Client)   │
└──────┬──────┘
       │
       │ GraphQL
       ▼
┌─────────────┐    /metrics     ┌──────────────┐
│   Server    │◀────────────────│   Grafana    │
│  (Backend)  │   scrape every  │    Alloy     │
└─────────────┘     15s         └──────┬───────┘
                                       │
                                       ▼
                                ┌──────────────┐
                                │   Grafana    │
                                │    Cloud     │
                                └──────────────┘
```

### Components

1. **Backend Server** (`/server`)
   - Exposes Prometheus metrics at `GET /metrics`
   - Uses `prom-client` library
   - Tracks metrics in GraphQL resolvers

2. **Grafana Alloy** (Docker container)
   - Scrapes metrics every 15 seconds
   - Sends to Grafana Cloud Prometheus
   - Config: `alloy-config.alloy`

3. **Grafana Cloud** (SaaS)
   - Stores and visualizes metrics
   - 14-day retention (free tier)
   - Prometheus-compatible query interface

## Implementation Details

### Backend Metrics (`/server/src/metrics.ts`)

All metrics are defined using `prom-client`:

```typescript
import { Counter, Histogram, Gauge, Registry } from 'prom-client';

// Task metrics
export const taskCreated = new Counter({
  name: 'kanban_tasks_created_total',
  help: 'Total number of tasks created',
  labelNames: ['board_id'],
});

export const taskDeleted = new Counter({
  name: 'kanban_tasks_deleted_total',
  help: 'Total number of tasks deleted',
  labelNames: ['board_id'],
});

export const taskMoved = new Counter({
  name: 'kanban_tasks_moved_total',
  help: 'Total number of tasks moved',
  labelNames: ['board_id', 'from_column', 'to_column'],
});

// API performance
export const apiDuration = new Histogram({
  name: 'kanban_api_duration_seconds',
  help: 'API request duration',
  labelNames: ['operation', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});
```

### Metrics Endpoint (`/server/src/server.ts`)

Exposed at `GET /metrics`:

```typescript
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### Tracking in Resolvers

**Task operations** (`/server/src/graphql/resolvers/taskResolver.ts`):
```typescript
await taskApi.createTask(backendTask);
taskCreated.inc({ board_id: 'default' });
```

**Column operations** (`/server/src/graphql/resolvers/columnResolver.ts`):
```typescript
await columnApi.addColumn(columnId);
columnCreated.inc({ board_id: 'default' });
```

**Board views** (`/server/src/graphql/resolvers/boardResolver.ts`):
```typescript
const board = await BoardService.getInstance().getFullBoard();
boardViews.inc({ board_id: 'default' });
```

**API duration middleware** (`/server/src/server.ts`):
```typescript
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    apiDuration.observe({ operation: req.path, status: res.statusCode.toString() }, duration);
  });
  next();
});
```

### Grafana Alloy Configuration (`alloy-config.alloy`)

```hcl
prometheus.scrape "kanban_metrics" {
  targets = [{
    __address__ = "host.docker.internal:8080",
    job         = "kanban-server",
  }]
  
  forward_to = [prometheus.remote_write.grafana_cloud.receiver]
  scrape_interval = "15s"
  metrics_path    = "/metrics"
}

prometheus.remote_write "grafana_cloud" {
  endpoint {
    url = env("GRAFANA_CLOUD_PROMETHEUS_URL")
    basic_auth {
      username = env("GRAFANA_CLOUD_PROMETHEUS_USER")
      password = env("GRAFANA_CLOUD_API_KEY")
    }
  }
}
```

### Docker Configuration (`docker-compose.yml`)

```yaml
grafana-alloy:
  image: grafana/alloy:latest
  container_name: kanban-grafana-alloy
  restart: unless-stopped
  environment:
    GRAFANA_CLOUD_PROMETHEUS_URL: ${GRAFANA_CLOUD_PROMETHEUS_URL}
    GRAFANA_CLOUD_PROMETHEUS_USER: ${GRAFANA_CLOUD_PROMETHEUS_USER}
    GRAFANA_CLOUD_API_KEY: ${GRAFANA_CLOUD_API_KEY}
  volumes:
    - ./alloy-config.alloy:/etc/alloy/config.alloy:ro
  ports:
    - "12345:12345"
```

## Environment Variables

Required in `.env`:

```bash
GRAFANA_CLOUD_PROMETHEUS_URL=https://prometheus-prod-XX-XX.grafana.net/api/prom/push
GRAFANA_CLOUD_PROMETHEUS_USER=123456
GRAFANA_CLOUD_API_KEY=glc_xxxxxxxxxxxxx
```

## Metrics Reference

| Metric Name | Type | Labels | Description |
|------------|------|--------|-------------|
| `kanban_tasks_created_total` | Counter | `board_id` | Total tasks created |
| `kanban_tasks_deleted_total` | Counter | `board_id` | Total tasks deleted |
| `kanban_tasks_moved_total` | Counter | `board_id`, `from_column`, `to_column` | Total tasks moved |
| `kanban_tasks_updated_total` | Counter | `board_id` | Total tasks edited |
| `kanban_columns_created_total` | Counter | `board_id` | Total columns created |
| `kanban_columns_deleted_total` | Counter | `board_id` | Total columns deleted |
| `kanban_api_duration_seconds` | Histogram | `operation`, `status` | API request duration |
| `kanban_api_errors_total` | Counter | `operation`, `error_type` | Total API errors |
| `kanban_board_views_total` | Counter | `board_id` | Total board views |
| `kanban_user_logins_total` | Counter | `status` | Total user logins (placeholder) |
| `kanban_user_registrations_total` | Counter | `status` | Total registrations (placeholder) |
| `kanban_active_users` | Gauge | - | Active users count (placeholder) |

## Useful Queries

### Task Activity
```promql
# Tasks created in last hour
increase(kanban_tasks_created_total[1h])

# Task creation rate (per minute)
rate(kanban_tasks_created_total[1m])

# Tasks deleted vs created
rate(kanban_tasks_deleted_total[5m]) / rate(kanban_tasks_created_total[5m])
```

### API Performance
```promql
# 95th percentile response time
histogram_quantile(0.95, rate(kanban_api_duration_seconds_bucket[5m]))

# Average response time by operation
rate(kanban_api_duration_seconds_sum[5m]) / rate(kanban_api_duration_seconds_count[5m])

# Request rate by status code
sum by (status) (rate(kanban_api_duration_seconds_count[5m]))
```

### Board Activity
```promql
# Board views per minute
rate(kanban_board_views_total[1m])

# Total operations (all types)
sum(rate(kanban_tasks_created_total[5m])) +
sum(rate(kanban_tasks_deleted_total[5m])) +
sum(rate(kanban_tasks_moved_total[5m]))
```

## Accessing Metrics

### Development
```bash
# View raw metrics
curl http://localhost:8080/metrics

# Check Alloy logs
docker logs kanban-grafana-alloy

# Alloy web UI
open http://localhost:12345
```

### Grafana Cloud
1. Go to https://grafana.com
2. Navigate to **Explore**
3. Select **Prometheus** data source
4. Run queries from above

## Monitoring & Alerts

### Recommended Alerts
- High error rate: `rate(kanban_api_errors_total[5m]) > 0.1`
- Slow API: `histogram_quantile(0.95, rate(kanban_api_duration_seconds_bucket[5m])) > 2`
- No activity: `rate(kanban_board_views_total[5m]) == 0` for 10+ minutes


## Future Enhancements

- Add authentication metrics (login/register tracking)
- Implement Grafana Loki for log aggregation
- Add custom dashboards in Grafana
- Set up alerting rules
- Add distributed tracing with OpenTelemetry (advanced)

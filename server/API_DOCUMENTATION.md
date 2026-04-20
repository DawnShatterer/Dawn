# Dawn LMS API Documentation

## Health Check Endpoint

### GET /api/Health

Public endpoint for monitoring system health and connectivity.

**Authentication:** None required

**Response Format:**

```json
{
  "status": "healthy" | "degraded" | "unhealthy",
  "database": "connected" | "disconnected",
  "cache": "connected" | "disconnected",
  "timestamp": "2026-04-18T16:03:54.1234567Z",
  "responseTime": "123ms"
}
```

**Status Codes:**

- `200 OK` - System is healthy or degraded (cache down but database up)
- `503 Service Unavailable` - Database is down (critical failure)

**Status Values:**

- `healthy` - All services (database and cache) are operational
- `degraded` - Database is operational but cache is unavailable
- `unhealthy` - Database is unavailable (critical)

**Example Responses:**

Healthy system:
```json
{
  "status": "healthy",
  "database": "connected",
  "cache": "connected",
  "timestamp": "2026-04-18T16:03:54.1234567Z",
  "responseTime": "45ms"
}
```

Degraded system (cache down):
```json
{
  "status": "degraded",
  "database": "connected",
  "cache": "disconnected",
  "timestamp": "2026-04-18T16:03:54.1234567Z",
  "responseTime": "120ms"
}
```

Unhealthy system (database down):
```json
{
  "status": "unhealthy",
  "database": "disconnected",
  "cache": "connected",
  "timestamp": "2026-04-18T16:03:54.1234567Z",
  "responseTime": "5000ms"
}
```

**Usage with Monitoring Tools:**

**Uptime Kuma:**
```
Monitor Type: HTTP(s)
URL: https://your-domain.com/api/Health
Method: GET
Expected Status Code: 200
```

**Prometheus:**
```yaml
scrape_configs:
  - job_name: 'dawn-api'
    metrics_path: '/api/Health'
    static_configs:
      - targets: ['your-domain.com:5159']
```

**Docker Health Check:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5159/api/Health || exit 1
```

**Notes:**

- The endpoint performs actual connectivity checks (not cached)
- Database check executes `SELECT 1` query
- Cache check performs write/read/delete test with a temporary key
- Response time includes all connectivity checks
- Recommended check interval: 30-60 seconds
- Alert on 503 status or response time > 5 seconds



---

## Cache Fallback Strategy

Dawn LMS implements graceful degradation when Redis cache is unavailable. The system continues to function by falling back to direct database queries.

### How It Works

1. **Cache Read Failure**: When `GetAsync()` fails, it returns `null` and logs a warning
2. **Automatic Fallback**: Controllers detect `null` cache response and query the database
3. **Cache Write Failure**: When `SetAsync()` fails, it logs a warning but doesn't throw exceptions
4. **No User Impact**: Users experience slightly slower response times but no errors

### Performance Impact

| Scenario | Response Time | User Experience |
|----------|---------------|-----------------|
| Cache Hit | ~50-100ms | Optimal |
| Cache Miss (DB Query) | ~200-500ms | Acceptable |
| Cache Down (DB Fallback) | ~200-500ms | Acceptable |

### Monitoring Recommendations

**Key Metrics to Track:**

1. **Cache Failure Rate**: Should be < 1% under normal conditions
2. **Response Time**: Alert if > 2 seconds for analytics endpoints
3. **Database Load**: Monitor for increased query volume when cache is down

**Alert Thresholds:**

- Cache failure rate > 10% for 5 minutes → Investigate Redis
- Analytics endpoint response time > 2 seconds → Check database performance
- Health check returns "degraded" for > 15 minutes → Redis maintenance required

### Troubleshooting Guide

**Symptom: Cache connection failures in logs**

```
Warning: Redis connection failed for key 'Courses_List_*'. Falling back to database.
```

**Possible Causes:**
1. Redis server is down or unreachable
2. Network connectivity issues
3. Redis server overloaded
4. Incorrect Redis connection string

**Resolution Steps:**

1. Check Redis server status:
   ```bash
   redis-cli ping
   ```

2. Verify connection string in `appsettings.json`:
   ```json
   "Redis": "localhost:6379"
   ```

3. Check Redis logs for errors:
   ```bash
   redis-cli info
   ```

4. Restart Redis if needed:
   ```bash
   # Windows
   net stop Redis
   net start Redis
   
   # Linux
   sudo systemctl restart redis
   ```

5. Monitor application logs for "Falling back to database" messages

**Symptom: Slow response times**

**Possible Causes:**
1. Cache is down (check health endpoint)
2. Database is slow (check query performance)
3. High concurrent user load

**Resolution Steps:**

1. Check health endpoint: `GET /api/Health`
2. If cache is down, restart Redis
3. If database is slow, check for missing indexes or long-running queries
4. Scale horizontally if needed

### Best Practices

1. **Monitor Health Endpoint**: Set up automated monitoring with 30-60 second intervals
2. **Log Analysis**: Review cache failure logs daily
3. **Capacity Planning**: Ensure Redis has sufficient memory (recommend 2GB minimum)
4. **Backup Strategy**: Redis persistence is optional since cache can be rebuilt from database
5. **Alerting**: Configure alerts for sustained cache failures (> 5 minutes)

### Cache Invalidation Strategy

The system invalidates cache entries when data changes:

- **Course Assignment**: Invalidates `Courses_List_*` prefix
- **Enrollment Changes**: Invalidates relevant course caches
- **Manual Invalidation**: Use `RemoveByPrefixAsync()` for bulk invalidation

**Example:**
```csharp
await _cache.RemoveByPrefixAsync("Courses_List_");
```

This ensures users always see fresh data after modifications.



---

## Database Migration: CourseAssignmentAudit

### Migration Details

**Migration Name:** `20260418160354_AddCourseAssignmentAudit`

**Purpose:** Adds audit trail for course-teacher assignments

**Changes:**
- Creates `CourseAssignmentAudits` table
- Adds foreign keys to `Courses` and `AspNetUsers` tables
- Creates indexes on `CourseId`, `AssignedAt`, `AdminUserId`, and `NewTeacherId`

### Table Schema

```sql
CREATE TABLE [CourseAssignmentAudits] (
    [Id] int NOT NULL IDENTITY,
    [CourseId] int NOT NULL,
    [PreviousTeacherId] nvarchar(max) NULL,
    [NewTeacherId] nvarchar(450) NOT NULL,
    [AdminUserId] nvarchar(450) NOT NULL,
    [AssignedAt] datetime2 NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_CourseAssignmentAudits] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_CourseAssignmentAudits_AspNetUsers_AdminUserId] 
        FOREIGN KEY ([AdminUserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_CourseAssignmentAudits_AspNetUsers_NewTeacherId] 
        FOREIGN KEY ([NewTeacherId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_CourseAssignmentAudits_Courses_CourseId] 
        FOREIGN KEY ([CourseId]) REFERENCES [Courses] ([Id]) ON DELETE CASCADE
);
```

### Applying the Migration

**Development Environment:**
```bash
dotnet ef database update --project server/Dawn.Infrastructure --startup-project server/Dawn.Api
```

**Production Environment:**
```bash
# 1. Backup database first
# 2. Stop the application
# 3. Apply migration
dotnet ef database update --project server/Dawn.Infrastructure --startup-project server/Dawn.Api --connection "YourProductionConnectionString"
# 4. Verify migration applied successfully
dotnet ef migrations list --project server/Dawn.Infrastructure --startup-project server/Dawn.Api
# 5. Start the application
```

### Rollback Procedure

If you need to rollback this migration:

```bash
# Rollback to previous migration
dotnet ef database update 20260418111931_RemoveB2CLogic --project server/Dawn.Infrastructure --startup-project server/Dawn.Api
```

This will:
1. Drop the `CourseAssignmentAudits` table
2. Remove all indexes
3. Remove all foreign key constraints

**Warning:** Rolling back will permanently delete all audit trail data. Backup the table before rollback if you need to preserve the data:

```sql
-- Backup audit data before rollback
SELECT * INTO CourseAssignmentAudits_Backup FROM CourseAssignmentAudits;
```

### Verification

After applying the migration, verify the table was created:

```sql
-- Check table exists
SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'CourseAssignmentAudits';

-- Check indexes
SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('CourseAssignmentAudits');

-- Check foreign keys
SELECT * FROM sys.foreign_keys WHERE parent_object_id = OBJECT_ID('CourseAssignmentAudits');
```

### Impact Assessment

- **Downtime Required:** No (table creation is non-blocking)
- **Data Loss Risk:** None (new table, no existing data)
- **Rollback Risk:** Low (simple DROP TABLE operation)
- **Performance Impact:** Minimal (indexes created for optimal query performance)



---

## Monitoring and Alerting Configuration

### Recommended Monitoring Setup

Dawn LMS requires monitoring for three critical areas:
1. System health (database and cache connectivity)
2. Cache failure rate
3. API response times

### 1. Health Check Monitoring

**Uptime Kuma Configuration:**

```yaml
Monitor Name: Dawn API Health Check
Monitor Type: HTTP(s)
URL: https://your-domain.com/api/Health
Method: GET
Heartbeat Interval: 60 seconds
Retries: 3
Expected Status Code: 200
Keyword (Optional): "healthy"
```

**Alert Conditions:**
- Status code is 503 for > 5 minutes → Critical (Database down)
- Response contains "degraded" for > 15 minutes → Warning (Cache down)
- Response time > 5 seconds → Warning (Performance issue)

### 2. Cache Failure Rate Monitoring

**Application Insights / Log Analytics Query:**

```kusto
traces
| where message contains "Redis connection failed" or message contains "Falling back to database"
| summarize FailureCount = count() by bin(timestamp, 5m)
| extend FailureRate = FailureCount / 300.0 * 100  // Percentage per 5 minutes
| where FailureRate > 10
```

**Alert Rule:**
- **Name:** High Cache Failure Rate
- **Condition:** Cache failure rate > 10% for 5 minutes
- **Severity:** Warning
- **Action:** Send notification to operations team
- **Description:** Redis cache is experiencing high failure rate. System is functioning but performance may be degraded.

### 3. Analytics Endpoint Response Time

**Application Insights / Log Analytics Query:**

```kusto
requests
| where url contains "/api/Analytics/admin"
| summarize AvgResponseTime = avg(duration), MaxResponseTime = max(duration) by bin(timestamp, 5m)
| where AvgResponseTime > 2000  // 2 seconds
```

**Alert Rule:**
- **Name:** Slow Analytics Endpoint
- **Condition:** Average response time > 2 seconds for 5 minutes
- **Severity:** Warning
- **Action:** Send notification to development team
- **Description:** Analytics endpoint is responding slowly. May indicate database performance issues or high load.

### 4. Health Check 503 Status

**Application Insights / Log Analytics Query:**

```kusto
requests
| where url contains "/api/Health"
| where resultCode == "503"
| summarize Count = count() by bin(timestamp, 1m)
| where Count > 0
```

**Alert Rule:**
- **Name:** Database Connectivity Failure
- **Condition:** Health check returns 503 status for > 5 minutes
- **Severity:** Critical
- **Action:** 
  - Send SMS/call to on-call engineer
  - Create incident ticket
  - Trigger automated failover (if configured)
- **Description:** Database is unreachable. Application is down. Immediate action required.

### Prometheus Configuration

If using Prometheus for monitoring:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'dawn-api'
    scrape_interval: 30s
    metrics_path: '/api/Health'
    static_configs:
      - targets: ['your-domain.com:5159']
    metric_relabel_configs:
      - source_labels: [status]
        target_label: health_status
```

**Prometheus Alert Rules:**

```yaml
# alerts.yml
groups:
  - name: dawn_api_alerts
    interval: 30s
    rules:
      - alert: DatabaseDown
        expr: health_status == "unhealthy"
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Dawn API database is down"
          description: "Health check has been returning unhealthy status for more than 5 minutes"

      - alert: CacheDown
        expr: health_status == "degraded"
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Dawn API cache is down"
          description: "Redis cache has been unavailable for more than 15 minutes"

      - alert: SlowHealthCheck
        expr: health_check_response_time_ms > 5000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Dawn API health check is slow"
          description: "Health check response time has been over 5 seconds for more than 5 minutes"
```

### Grafana Dashboard

**Recommended Panels:**

1. **System Health Status** (Gauge)
   - Query: Current health status (healthy/degraded/unhealthy)
   - Thresholds: Green (healthy), Yellow (degraded), Red (unhealthy)

2. **Database Connectivity** (Stat)
   - Query: Database connection status
   - Display: Connected/Disconnected

3. **Cache Connectivity** (Stat)
   - Query: Cache connection status
   - Display: Connected/Disconnected

4. **Health Check Response Time** (Time Series)
   - Query: Response time over last 24 hours
   - Alert line at 5 seconds

5. **Cache Failure Rate** (Time Series)
   - Query: Percentage of cache failures per minute
   - Alert line at 10%

6. **Analytics Endpoint Response Time** (Time Series)
   - Query: Average response time over last 24 hours
   - Alert line at 2 seconds

### Email Alert Template

```
Subject: [{{ severity }}] Dawn LMS - {{ alert_name }}

Alert: {{ alert_name }}
Severity: {{ severity }}
Time: {{ timestamp }}
Duration: {{ duration }}

Description:
{{ description }}

Current Status:
- Health: {{ health_status }}
- Database: {{ database_status }}
- Cache: {{ cache_status }}
- Response Time: {{ response_time }}ms

Action Required:
{{ action_steps }}

Dashboard: https://your-monitoring-dashboard.com/dawn-api
Runbook: https://your-wiki.com/runbooks/dawn-api-alerts
```

### Incident Response Runbook

**Database Down (503 Status):**
1. Check database server status
2. Verify network connectivity
3. Check database logs for errors
4. Restart database service if needed
5. Verify application reconnects automatically
6. Monitor health endpoint for recovery

**Cache Down (Degraded Status):**
1. Check Redis server status
2. Verify Redis logs for errors
3. Check memory usage (may be out of memory)
4. Restart Redis service if needed
5. Verify application reconnects automatically
6. Monitor cache failure rate for recovery

**Slow Response Times:**
1. Check database query performance
2. Review slow query logs
3. Check for missing indexes
4. Verify cache hit rate
5. Check server resource usage (CPU, memory, disk I/O)
6. Scale horizontally if needed


# Dawn LMS - Production Deployment Guide

## Pre-Deployment Checklist

### 1. Database Backup
```sql
-- Create full database backup
BACKUP DATABASE DawnDb 
TO DISK = 'C:\Backups\DawnDb_PreDeployment_20260418.bak'
WITH FORMAT, COMPRESSION;
```

### 2. Verify Migration Status
```bash
dotnet ef migrations list --project server/Dawn.Infrastructure --startup-project server/Dawn.Api
```

Ensure `20260418160354_AddCourseAssignmentAudit` is listed and applied.

### 3. Configuration Review

**appsettings.Production.json:**
- Update connection string for production database
- Update Redis connection string
- Update JWT secret key (use strong, unique key)
- Update email SMTP settings
- Remove or secure sensitive information

### 4. Build Verification
```bash
# Backend
cd server/Dawn.Api
dotnet build --configuration Release

# Frontend
cd client
npm run build
```

## Deployment Steps

### Step 1: Stop the Application

**Windows Service:**
```powershell
Stop-Service -Name "DawnApiService"
```

**IIS:**
```powershell
Stop-WebAppPool -Name "DawnApiAppPool"
```

**Manual Process:**
```powershell
# Find and stop the process
Get-Process -Name "Dawn.Api" | Stop-Process -Force
```

### Step 2: Apply Database Migration

```bash
cd server/Dawn.Api
dotnet ef database update --project ../Dawn.Infrastructure --startup-project . --connection "Server=PROD_SERVER;Database=DawnDb;User Id=sa;Password=***;TrustServerCertificate=True;"
```

**Verify migration applied:**
```bash
dotnet ef migrations list --project ../Dawn.Infrastructure --startup-project .
```

Expected output should show `20260418160354_AddCourseAssignmentAudit` without "(Pending)".

### Step 3: Deploy Backend Changes

**Option A: Copy Files (Manual)**
```powershell
# Publish the application
dotnet publish --configuration Release --output ./publish

# Copy to production directory
Copy-Item -Path ./publish/* -Destination "C:\inetpub\DawnApi\" -Recurse -Force
```

**Option B: Using CI/CD Pipeline**
- Push changes to main branch
- CI/CD pipeline will automatically build and deploy
- Monitor pipeline logs for errors

### Step 4: Deploy Frontend Changes

```bash
cd client

# Build production bundle
npm run build

# Copy to web server
# Option A: IIS
Copy-Item -Path ./dist/* -Destination "C:\inetpub\DawnClient\" -Recurse -Force

# Option B: Nginx
scp -r ./dist/* user@server:/var/www/dawn-client/
```

### Step 5: Update Configuration Files

**Backend (appsettings.Production.json):**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=PROD_SERVER;Database=DawnDb;User Id=sa;Password=***;TrustServerCertificate=True;"
  },
  "Redis": "prod-redis-server:6379",
  "Jwt": {
    "Key": "PRODUCTION_SECRET_KEY_CHANGE_THIS",
    "Issuer": "DawnApi",
    "Audience": "DawnUsers"
  }
}
```

**Frontend (.env.production):**
```
VITE_API_BASE_URL=https://api.yourdomain.com
```

### Step 6: Start the Application

**Windows Service:**
```powershell
Start-Service -Name "DawnApiService"
```

**IIS:**
```powershell
Start-WebAppPool -Name "DawnApiAppPool"
```

**Manual Process:**
```bash
cd server/Dawn.Api
dotnet run --configuration Release
```

### Step 7: Verify Deployment

**1. Health Check:**
```bash
curl https://api.yourdomain.com/api/Health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "cache": "connected",
  "timestamp": "2026-04-18T16:03:54Z",
  "responseTime": "45ms"
}
```

**2. Analytics Endpoint:**
```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" https://api.yourdomain.com/api/Analytics/admin
```

Verify:
- No SQL errors in response
- New metrics are present: `activeUsersLast24Hours`, `newEnrollmentsLast7Days`, `totalTeachers`, `totalStudents`
- No `totalRevenue` field (removed)

**3. Frontend Dashboard:**
- Navigate to https://yourdomain.com/admin/analytics
- Verify charts display live data (no hardcoded values)
- Verify new metric cards are visible
- Verify error states work (disconnect Redis temporarily)
- Verify loading states work (refresh page)

**4. Teacher Assignment:**
- Navigate to Admin Dashboard → Module Assignment
- Assign a teacher to a course
- Verify teacher name updates immediately
- Check database for audit log entry:

```sql
SELECT TOP 1 * FROM CourseAssignmentAudits ORDER BY AssignedAt DESC;
```

**5. Cache Fallback:**
- Stop Redis temporarily
- Verify health endpoint returns "degraded" status
- Verify application continues to function
- Verify logs show "Falling back to database" messages
- Restart Redis
- Verify health endpoint returns "healthy" status

### Step 8: Monitor Logs

**Backend Logs:**
```bash
# Windows Event Viewer
Get-EventLog -LogName Application -Source "Dawn.Api" -Newest 50

# Or file logs (if configured)
Get-Content "C:\Logs\DawnApi\log-20260418.txt" -Tail 50 -Wait
```

**Look for:**
- ✅ "Application started successfully"
- ✅ "Database connection established"
- ✅ "Redis cache connected"
- ❌ Any exceptions or errors
- ❌ SQL translation errors
- ❌ Cache connection failures (should be < 1%)

## Post-Deployment Verification

### Smoke Tests

**1. User Login:**
- Test student login
- Test teacher login
- Test admin login

**2. Course Operations:**
- View course list
- Enroll student in course
- Assign teacher to course
- Verify audit log created

**3. Analytics:**
- View platform analytics dashboard
- Verify all metrics display correctly
- Verify charts render without errors

**4. Performance:**
- Check analytics endpoint response time (should be < 2 seconds)
- Check health endpoint response time (should be < 500ms)
- Monitor cache hit rate (should be > 80%)

### Rollback Procedure

If deployment fails or critical issues are discovered:

**1. Stop the application**

**2. Rollback database migration:**
```bash
dotnet ef database update 20260418111931_RemoveB2CLogic --project server/Dawn.Infrastructure --startup-project server/Dawn.Api
```

**3. Restore previous application version:**
```powershell
# Restore from backup
Copy-Item -Path "C:\Backups\DawnApi\*" -Destination "C:\inetpub\DawnApi\" -Recurse -Force
Copy-Item -Path "C:\Backups\DawnClient\*" -Destination "C:\inetpub\DawnClient\" -Recurse -Force
```

**4. Restore database backup (if needed):**
```sql
RESTORE DATABASE DawnDb 
FROM DISK = 'C:\Backups\DawnDb_PreDeployment_20260418.bak'
WITH REPLACE;
```

**5. Start the application**

**6. Verify rollback successful:**
```bash
curl https://api.yourdomain.com/api/Health
```

## Deployment Checklist

- [ ] Database backup created
- [ ] Migration status verified
- [ ] Build completed successfully (backend and frontend)
- [ ] Application stopped
- [ ] Database migration applied
- [ ] Backend files deployed
- [ ] Frontend files deployed
- [ ] Configuration files updated
- [ ] Application started
- [ ] Health check returns 200 OK
- [ ] Analytics endpoint tested
- [ ] Frontend dashboard tested
- [ ] Teacher assignment tested
- [ ] Audit log verified in database
- [ ] Cache fallback tested
- [ ] Logs reviewed for errors
- [ ] Smoke tests passed
- [ ] Monitoring alerts configured
- [ ] Team notified of deployment

## Troubleshooting

### Issue: Migration fails with "database locked"

**Solution:**
```sql
-- Check for active connections
SELECT * FROM sys.dm_exec_sessions WHERE database_id = DB_ID('DawnDb');

-- Kill blocking sessions (if safe)
KILL <session_id>;
```

### Issue: Health check returns 503

**Solution:**
1. Check database server is running
2. Verify connection string is correct
3. Check firewall rules
4. Review database logs

### Issue: Cache connection failures

**Solution:**
1. Check Redis server is running
2. Verify Redis connection string
3. Check Redis logs: `redis-cli info`
4. Restart Redis if needed

### Issue: Frontend shows old data

**Solution:**
1. Clear browser cache
2. Verify frontend build includes latest changes
3. Check API responses in browser DevTools
4. Invalidate CDN cache (if using CDN)

## Support Contacts

- **Database Issues:** DBA Team - dba@yourdomain.com
- **Infrastructure Issues:** DevOps Team - devops@yourdomain.com
- **Application Issues:** Development Team - dev@yourdomain.com
- **Emergency:** On-call Engineer - +1-XXX-XXX-XXXX


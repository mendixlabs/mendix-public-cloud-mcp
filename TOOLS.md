# Mendix Public Cloud MCP Tools Reference

Complete reference for all 24 tools available in the Mendix Public Cloud MCP server.

## Deploy API v4 Tools

### mendix_list_apps
Lists all Mendix applications accessible to the authenticated user.

**Parameters:**
- `offset` (number, optional) - Pagination offset
- `limit` (number, optional) - Maximum apps to return
- `licenseType` (string, optional) - Filter by "free" or "licensed"

**Example:**
```json
{
  "offset": 0,
  "limit": 10,
  "licenseType": "licensed"
}
```

---

### mendix_get_app
Retrieves detailed information about a specific app.

**Parameters:**
- `appId` (string, required) - UUID of the application

**Example:**
```json
{
  "appId": "12345678-1234-1234-1234-123456789abc"
}
```

---

### mendix_list_environments
Lists all environments for a specific app.

**Parameters:**
- `appId` (string, required) - UUID of the application
- `expand` (string, optional) - Set to "package" to include deployed package details

**Example:**
```json
{
  "appId": "12345678-1234-1234-1234-123456789abc",
  "expand": "package"
}
```

---

### mendix_get_environment
Gets detailed information about a specific environment.

**Parameters:**
- `appId` (string, required) - UUID of the application
- `environmentId` (string, required) - UUID of the environment
- `expand` (string, optional) - Set to "package" for package details

**Example:**
```json
{
  "appId": "12345678-1234-1234-1234-123456789abc",
  "environmentId": "87654321-4321-4321-4321-cba987654321",
  "expand": "package"
}
```

---

## Deploy API v1 Tools

### mendix_start_environment
Starts a stopped environment (returns JobId for tracking).

**Parameters:**
- `appId` (string, required) - Subdomain name of the application
- `mode` (string, required) - Environment mode (Test, Acceptance, Production, etc.)
- `autoSyncDb` (boolean, optional) - Auto-sync database (default: true)

**Example:**
```json
{
  "appId": "myapp",
  "mode": "Production",
  "autoSyncDb": true
}
```

---

### mendix_stop_environment
Stops a running environment.

**Parameters:**
- `appId` (string, required) - Subdomain name
- `mode` (string, required) - Environment mode

**Example:**
```json
{
  "appId": "myapp",
  "mode": "Test"
}
```

---

### mendix_get_environment_status
Gets the current status of an environment.

**Parameters:**
- `appId` (string, required) - Subdomain name
- `mode` (string, required) - Environment mode

**Example:**
```json
{
  "appId": "myapp",
  "mode": "Acceptance"
}
```

---

### mendix_transport_package
Transports (deploys) a package to an environment.

**Parameters:**
- `appId` (string, required) - Subdomain name
- `mode` (string, required) - Target environment mode
- `packageId` (string, required) - Package ID to deploy

**Example:**
```json
{
  "appId": "myapp",
  "mode": "Test",
  "packageId": "package-uuid-123"
}
```

---

### mendix_get_app_logs
Gets download URL for application logs for a specific date.

**Parameters:**
- `appId` (string, required) - Subdomain name
- `mode` (string, required) - Environment mode
- `date` (string, required) - Date in YYYY-MM-DD format

**Example:**
```json
{
  "appId": "myapp",
  "mode": "Production",
  "date": "2024-01-15"
}
```

---

### mendix_get_environment_settings
Retrieves environment settings (constants, custom settings, scheduled events).

**Parameters:**
- `appId` (string, required) - Subdomain name
- `mode` (string, required) - Environment mode

**Example:**
```json
{
  "appId": "myapp",
  "mode": "Production"
}
```

---

## Deploy API v2 Tools

### mendix_get_job_status
Gets the status of an asynchronous job (e.g., package upload).

**Parameters:**
- `appId` (string, required) - Subdomain name of the application
- `jobId` (string, required) - Job ID returned from a previous operation

**Example:**
```json
{
  "appId": "myapp",
  "jobId": "66046953-ecf7-4550-a889-4b7e9f1e1705"
}
```

**Response States:**
- `Queued` - Job is waiting to be processed
- `Running` - Job is currently being processed
- `Completed` - Job finished successfully
- `Failed` - Job encountered an error

---

## Build API v1 Tools

### mendix_list_packages
Lists all deployment packages for an app.

**Parameters:**
- `appId` (string, required) - Subdomain name

**Example:**
```json
{
  "appId": "myapp"
}
```

---

### mendix_get_package
Retrieves information about a specific package.

**Parameters:**
- `appId` (string, required) - Subdomain name
- `packageId` (string, required) - Package identifier
- `includeUrl` (boolean, optional) - Include download URL (default: false)

**Example:**
```json
{
  "appId": "myapp",
  "packageId": "package-123",
  "includeUrl": true
}
```

---

### mendix_start_build
Starts building a new deployment package from source control.

**Parameters:**
- `appId` (string, required) - Subdomain name
- `version` (string, required) - Semantic version (e.g., "2.3.5")
- `branch` (string, optional) - Branch name ("main", "trunk", "branches/feature-x")
- `revision` (string, optional) - Git commit hash or SVN revision number
- `description` (string, optional) - Package description

**Example:**
```json
{
  "appId": "myapp",
  "branch": "main",
  "revision": "1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t",
  "version": "2.3.5",
  "description": "Production release"
}
```

---

### mendix_delete_package
Deletes a deployment package.

**Parameters:**
- `appId` (string, required) - Subdomain name
- `packageId` (string, required) - Package ID to delete

**Example:**
```json
{
  "appId": "myapp",
  "packageId": "package-123"
}
```

---

## Backups API v2 Tools

### mendix_list_snapshots
Lists all snapshots for an environment.

**Parameters:**
- `projectId` (string, required) - Project/app identifier
- `environmentId` (string, required) - Environment identifier
- `offset` (number, optional) - Pagination offset (default: 0)
- `limit` (number, optional) - Maximum items (default: 100)

**Example:**
```json
{
  "projectId": "myapp",
  "environmentId": "env-123",
  "offset": 0,
  "limit": 50
}
```

---

### mendix_create_snapshot
Creates a new backup snapshot of an environment.

**Parameters:**
- `projectId` (string, required) - Project/app identifier
- `environmentId` (string, required) - Environment identifier
- `comment` (string, optional) - Description of the snapshot

**Example:**
```json
{
  "projectId": "myapp",
  "environmentId": "env-123",
  "comment": "Pre-deployment backup"
}
```

---

### mendix_get_snapshot
Gets the status and details of a specific snapshot.

**Parameters:**
- `projectId` (string, required) - Project/app identifier
- `environmentId` (string, required) - Environment identifier
- `snapshotId` (string, required) - Snapshot identifier

**Example:**
```json
{
  "projectId": "myapp",
  "environmentId": "env-123",
  "snapshotId": "snapshot-abc-123"
}
```

---

### mendix_delete_snapshot
Deletes a snapshot permanently.

**Parameters:**
- `projectId` (string, required) - Project/app identifier
- `environmentId` (string, required) - Environment identifier
- `snapshotId` (string, required) - Snapshot ID to delete

**Example:**
```json
{
  "projectId": "myapp",
  "environmentId": "env-123",
  "snapshotId": "snapshot-abc-123"
}
```

---

### mendix_create_archive
Creates a downloadable backup archive from a snapshot.

**Parameters:**
- `projectId` (string, required) - Project/app identifier
- `environmentId` (string, required) - Environment identifier
- `snapshotId` (string, required) - Snapshot identifier
- `dataType` (string, optional) - "database_only" or "files_and_database" (default)

**Example:**
```json
{
  "projectId": "myapp",
  "environmentId": "env-123",
  "snapshotId": "snapshot-abc-123",
  "dataType": "files_and_database"
}
```

---

### mendix_get_archive
Gets the status of an archive (includes download URL when completed).

**Parameters:**
- `projectId` (string, required) - Project/app identifier
- `environmentId` (string, required) - Environment identifier
- `snapshotId` (string, required) - Snapshot identifier
- `archiveId` (string, required) - Archive identifier

**Example:**
```json
{
  "projectId": "myapp",
  "environmentId": "env-123",
  "snapshotId": "snapshot-abc-123",
  "archiveId": "archive-xyz-789"
}
```

---

### mendix_restore_snapshot
Restores an environment from a snapshot (environment must be stopped).

**Parameters:**
- `projectId` (string, required) - Project/app identifier
- `environmentId` (string, required) - Target environment identifier
- `sourceSnapshotId` (string, required) - Snapshot to restore from
- `dbOnly` (boolean, optional) - Database-only restore (default: false)

**Example:**
```json
{
  "projectId": "myapp",
  "environmentId": "env-test",
  "sourceSnapshotId": "snapshot-from-prod",
  "dbOnly": false
}
```

---

### mendix_get_restore_status
Gets the status of a restore operation.

**Parameters:**
- `projectId` (string, required) - Project/app identifier
- `environmentId` (string, required) - Environment identifier
- `restoreId` (string, required) - Restore operation identifier

**Example:**
```json
{
  "projectId": "myapp",
  "environmentId": "env-123",
  "restoreId": "restore-operation-456"
}
```

---

## Common Patterns

### Typical Deployment Workflow

1. **Build**: `mendix_start_build` - Create package from source
2. **Monitor**: `mendix_get_package` - Check build status
3. **Transport**: `mendix_transport_package` - Deploy to environment
4. **Start**: `mendix_start_environment` - Start the environment

### Backup & Restore Workflow

1. **Create**: `mendix_create_snapshot` - Take a backup
2. **Monitor**: `mendix_get_snapshot` - Wait for completion
3. **Archive**: `mendix_create_archive` - Generate download
4. **Download**: `mendix_get_archive` - Get download URL
5. **Restore**: `mendix_restore_snapshot` - Restore if needed

### Environment Management

1. **List**: `mendix_list_environments` - See all environments
2. **Check**: `mendix_get_environment_status` - Check status
3. **Stop**: `mendix_stop_environment` - Stop if needed
4. **Restore**: `mendix_restore_snapshot` - Restore from backup
5. **Start**: `mendix_start_environment` - Start environment

---

## Notes

- **API v1 vs v4**: v1 uses subdomain names (e.g., "myapp"), v4 uses UUIDs
- **Async Operations**: Build, snapshot, archive, and restore operations are async
- **State Tracking**: Use `queued` → `running` → `completed`/`failed`
- **Permissions**: All operations require API Rights; backups require additional permissions
- **Archive URLs**: Valid for 8 hours after completion

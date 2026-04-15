# Mendix Public Cloud MCP Server

A comprehensive Model Context Protocol (MCP) server that provides tools for interacting with the Mendix Public Cloud APIs: Deploy API, Build API, and Backups API.

## Features

This MCP server provides **24 tools** covering:

### Deploy API (v1, v2 & v4)
- **Apps Management**: List apps, get app details
- **Environments**: List/get environments, start/stop operations, get settings
- **Package Transport**: Deploy packages to environments
- **Job Tracking**: Monitor asynchronous operations
- **Logs**: Download application logs

### Build API (v1)
- **Package Management**: List, get, build, and delete deployment packages
- **Build Operations**: Trigger builds from Git/SVN, track build status

### Backups API (v2)
- **Snapshots**: Create, list, get, and delete environment backups
- **Archives**: Generate downloadable backup archives (database-only or full)
- **Restores**: Restore environments from snapshots with status tracking

## Prerequisites

- Node.js 18 or higher
- Mendix account with API access
- Mendix Username and API Key

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

## Configuration

### Getting Mendix API Credentials

1. Log in to your Mendix account
2. Go to your user profile settings
3. Generate or retrieve your API key
4. Note your Mendix username (email address)

### Setting up the MCP Server

#### Authentication Configuration

**Option 1: API Key (Works with all APIs)**

Set these environment variables:
- `MENDIX_USERNAME`: Your Mendix account username/email
- `MENDIX_API_KEY`: Your Mendix API key

**Option 2: Personal Access Token (Deploy API v4 only)**

Set this environment variable:
- `MENDIX_MX_TOKEN`: Your Personal Access Token

**Note:** You can use both authentication methods simultaneously. The server will use PAT for Deploy API v4 calls when `MENDIX_MX_TOKEN` is set, and API Key for all other APIs.

#### For Claude Desktop

Add to your Claude Desktop configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mendix-public-cloud": {
      "command": "node",
      "args": ["/absolute/path/to/mendix-public-cloud-mcp/dist/index.js"],
      "env": {
        "MENDIX_USERNAME": "your-email@example.com",
        "MENDIX_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Using Personal Access Token (PAT) for Deploy API v4:
```json
{
  "mcpServers": {
    "mendix-public-cloud": {
      "command": "node",
      "args": ["/absolute/path/to/mendix-public-cloud-mcp/dist/index.js"],
      "env": {
        "MENDIX_USERNAME": "your-email@example.com",
        "MENDIX_API_KEY": "your-api-key-here",
        "MENDIX_MX_TOKEN": "your-personal-access-token-here"
      }
    }
  }
}
```

#### For Other MCP Clients (stdio)

Export the environment variables:

**Using API Key:**
```bash
export MENDIX_USERNAME="your-email@example.com"
export MENDIX_API_KEY="your-api-key-here"
node dist/index.js
```

**Using Personal Access Token for Deploy API v4:**
```bash
export MENDIX_USERNAME="your-email@example.com"
export MENDIX_API_KEY="your-api-key-here"
export MENDIX_MX_TOKEN="your-personal-access-token-here"
node dist/index.js
```

## Available Tools

### Deploy API Tools

#### Apps Management
- `mendix_list_apps` - List all accessible applications
- `mendix_get_app` - Get detailed app information

#### Environments
- `mendix_list_environments` - List app environments
- `mendix_get_environment` - Get environment details
- `mendix_start_environment` - Start a stopped environment
- `mendix_stop_environment` - Stop a running environment
- `mendix_get_environment_status` - Get current environment status
- `mendix_get_environment_settings` - Get environment configuration

#### Package Transport
- `mendix_transport_package` - Deploy a package to an environment

#### Job Tracking
- `mendix_get_job_status` - Get status of asynchronous jobs (Deploy API v2)

#### Logs
- `mendix_get_app_logs` - Get download URL for application logs

### Build API Tools

- `mendix_list_packages` - List all deployment packages
- `mendix_get_package` - Get package details (optionally with download URL)
- `mendix_start_build` - Trigger new build from source control
- `mendix_delete_package` - Delete a deployment package

### Backups API Tools

#### Snapshots
- `mendix_list_snapshots` - List all snapshots for an environment
- `mendix_create_snapshot` - Create a new backup snapshot
- `mendix_get_snapshot` - Get snapshot status
- `mendix_delete_snapshot` - Delete a snapshot

#### Archives
- `mendix_create_archive` - Generate downloadable backup archive
- `mendix_get_archive` - Get archive status and download URL

#### Restores
- `mendix_restore_snapshot` - Restore environment from snapshot
- `mendix_get_restore_status` - Get restore operation status

## Usage Examples

### List all your apps
```
Can you list all my Mendix applications?
```

### Start an environment
```
Start the Test environment for app 'myapp'
```

### Create a build
```
Build version 2.3.5 from the main branch for app 'myapp'
```

### Create a backup
```
Create a snapshot of the Production environment with comment "Pre-deployment backup"
```

### Restore from backup
```
Restore the Acceptance environment from snapshot abc-123 (make sure environment is stopped first)
```

### Get application logs
```
Get the application logs for Production environment on 2024-01-15
```

## API Versions Used

- **Deploy API v4**: Modern API for apps and environments (https://cloud.home.mendix.com/api/v4)
- **Deploy API v2**: Job status tracking (https://deploy.mendix.com/api/v2)
- **Deploy API v1**: Legacy API for environment operations (https://deploy.mendix.com/api/1)
- **Build API v1**: Package management (https://deploy.mendix.com/api/1)
- **Backups API v2**: Snapshot and restore operations (https://deploy.mendix.com/api/v2)

## Development

### Watch mode
```bash
npm run watch
```

### Running locally
```bash
npm run dev
```

## Important Notes

### Permissions
- All tools require **API Rights** enabled in your app's Permissions tab
- Backup tools additionally require **Access to Backups** permission
- Some operations require **Transport Rights**

### Async Operations
- Build operations, snapshot creation, archive generation, and restores are asynchronous
- Use the `get_*_status` tools to monitor progress
- States: `queued` → `running` → `completed` or `failed`

### Environment Operations
- Environments must be stopped before restore operations
- Starting environments returns a JobId to track progress
- Use appropriate environment modes: Test, Acceptance, Production

### Archive Downloads
- Archive download URLs expire after 8 hours
- Archives can be database-only or include files
- Archives are zip files containing backup data

### Build Operations
- Supports both Git and SVN version control
- Git: Use full commit hashes for large repositories
- SVN: Use integer revision numbers
- Version must follow semantic versioning (e.g., "2.3.5")

## Troubleshooting

### "MENDIX_USERNAME and MENDIX_API_KEY environment variables are required"
Make sure both environment variables are set with valid credentials.

### "403 Forbidden" errors
- Verify your API key is valid and not expired
- Check that API Rights are enabled for your user in the app's Permissions tab
- Ensure you have the necessary permissions for the operation

### "404 Not Found" errors
- Verify the app ID, environment ID, or other identifiers are correct
- UUIDs are used for v4 APIs, subdomain names for v1/v2 APIs
- Ensure you have access to the specified resource

### Environment is busy
Wait for any ongoing operations to complete before starting new ones.

## API Documentation

For detailed API documentation, see:
- Deploy API v1: https://docs.mendix.com/apidocs-mxsdk/apidocs/deploy-api/
- Deploy API v2: https://docs.mendix.com/apidocs-mxsdk/apidocs/deploy-api-2/
- Deploy API v4: https://docs.mendix.com/apidocs-mxsdk/apidocs/deploy-api-4/
- Build API: https://docs.mendix.com/apidocs-mxsdk/apidocs/build-api/
- Backups API: https://docs.mendix.com/apidocs-mxsdk/apidocs/backups-api/

## License

MIT

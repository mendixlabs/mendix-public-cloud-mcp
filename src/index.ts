#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// API Base URLs
const DEPLOY_API_V1 = "https://deploy.mendix.com/api/1";
const DEPLOY_API_V2 = "https://deploy.mendix.com/api/v2";
const DEPLOY_API_V4 = "https://cloud.home.mendix.com/api/v4";

interface MendixConfig {
  username?: string;
  apiKey?: string;
}

const config: MendixConfig = {
  username: process.env.MENDIX_USERNAME,
  apiKey: process.env.MENDIX_API_KEY,
};

/**
 * Makes an authenticated request to the Mendix API
 */
async function mendixApiRequest(
  baseUrl: string,
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
  body?: unknown,
  queryParams?: Record<string, string | number | boolean>
): Promise<unknown> {
  if (!config.username || !config.apiKey) {
    throw new Error(
      "MENDIX_USERNAME and MENDIX_API_KEY environment variables are required"
    );
  }

  let url = `${baseUrl}${endpoint}`;

  if (queryParams) {
    const params = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      params.append(key, String(value));
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {
    "Mendix-Username": config.username,
    "Mendix-ApiKey": config.apiKey,
    "Content-Type": "application/json",
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && method !== "GET" && method !== "DELETE") {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (response.status === 204) {
    return { success: true };
  }

  const contentType = response.headers.get("content-type");
  let responseData: unknown;

  if (contentType?.includes("application/json")) {
    responseData = await response.json();
  } else {
    responseData = await response.text();
  }

  if (!response.ok) {
    const errorMsg = typeof responseData === "object" && responseData !== null
      ? JSON.stringify(responseData, null, 2)
      : String(responseData);
    throw new Error(`Mendix API error (${response.status}): ${errorMsg}`);
  }

  return responseData;
}

const tools: Tool[] = [
  // ============================================================================
  // DEPLOY API v4 - Apps
  // ============================================================================
  {
    name: "mendix_list_apps",
    description:
      "Lists all Mendix applications that the authenticated user has access to (Deploy API v4)",
    inputSchema: {
      type: "object",
      properties: {
        offset: {
          type: "number",
          description: "Pagination offset",
        },
        limit: {
          type: "number",
          description: "Maximum number of apps to return",
        },
        licenseType: {
          type: "string",
          enum: ["free", "licensed"],
          description: "Filter by license type",
        },
      },
    },
  },
  {
    name: "mendix_get_app",
    description: "Retrieves detailed information about a specific app (Deploy API v4)",
    inputSchema: {
      type: "object",
      properties: {
        appId: {
          type: "string",
          description: "The UUID of the application",
        },
      },
      required: ["appId"],
    },
  },

  // ============================================================================
  // DEPLOY API v4 - Environments
  // ============================================================================
  {
    name: "mendix_list_environments",
    description: "Lists all environments for a specific app (Deploy API v4)",
    inputSchema: {
      type: "object",
      properties: {
        appId: {
          type: "string",
          description: "The UUID of the application",
        },
        expand: {
          type: "string",
          enum: ["package"],
          description: "Expand related resources (only 'package' is supported)",
        },
      },
      required: ["appId"],
    },
  },
  {
    name: "mendix_get_environment",
    description:
      "Retrieves detailed information about a specific environment (Deploy API v4)",
    inputSchema: {
      type: "object",
      properties: {
        appId: {
          type: "string",
          description: "The UUID of the application",
        },
        environmentId: {
          type: "string",
          description: "The UUID of the environment",
        },
        expand: {
          type: "string",
          enum: ["package"],
          description: "Expand related resources",
        },
      },
      required: ["appId", "environmentId"],
    },
  },

  // ============================================================================
  // DEPLOY API v1 - Environment Operations
  // ============================================================================
  {
    name: "mendix_start_environment",
    description: "Starts a stopped environment (Deploy API v1)",
    inputSchema: {
      type: "object",
      properties: {
        appId: {
          type: "string",
          description: "The subdomain name of the application",
        },
        mode: {
          type: "string",
          description: "Environment mode (Test, Acceptance, Production, etc.)",
        },
        autoSyncDb: {
          type: "boolean",
          description: "Whether to automatically synchronize the database",
          default: true,
        },
      },
      required: ["appId", "mode"],
    },
  },
  {
    name: "mendix_stop_environment",
    description: "Stops a running environment (Deploy API v1)",
    inputSchema: {
      type: "object",
      properties: {
        appId: {
          type: "string",
          description: "The subdomain name of the application",
        },
        mode: {
          type: "string",
          description: "Environment mode (Test, Acceptance, Production, etc.)",
        },
      },
      required: ["appId", "mode"],
    },
  },
  {
    name: "mendix_get_environment_status",
    description: "Gets the current status of an environment (Deploy API v1)",
    inputSchema: {
      type: "object",
      properties: {
        appId: {
          type: "string",
          description: "The subdomain name of the application",
        },
        mode: {
          type: "string",
          description: "Environment mode",
        },
      },
      required: ["appId", "mode"],
    },
  },

  // ============================================================================
  // DEPLOY API v2 - Package Upload & Jobs
  // ============================================================================
  {
    name: "mendix_get_job_status",
    description:
      "Gets the status of an asynchronous job (e.g., package upload) (Deploy API v2)",
    inputSchema: {
      type: "object",
      properties: {
        appId: {
          type: "string",
          description: "The subdomain name of the application",
        },
        jobId: {
          type: "string",
          description: "The job ID returned from a previous operation",
        },
      },
      required: ["appId", "jobId"],
    },
  },

  // ============================================================================
  // BUILD API v1 - Package Management
  // ============================================================================
  {
    name: "mendix_list_packages",
    description: "Lists all deployment packages for an app (Build API v1)",
    inputSchema: {
      type: "object",
      properties: {
        appId: {
          type: "string",
          description: "The subdomain name of the application",
        },
      },
      required: ["appId"],
    },
  },
  {
    name: "mendix_get_package",
    description: "Retrieves information about a specific package (Build API v1)",
    inputSchema: {
      type: "object",
      properties: {
        appId: {
          type: "string",
          description: "The subdomain name of the application",
        },
        packageId: {
          type: "string",
          description: "The unique identifier of the package",
        },
        includeUrl: {
          type: "boolean",
          description: "Include temporary download URL",
          default: false,
        },
      },
      required: ["appId", "packageId"],
    },
  },
  {
    name: "mendix_start_build",
    description:
      "Starts building a new deployment package from source control (Build API v1)",
    inputSchema: {
      type: "object",
      properties: {
        appId: {
          type: "string",
          description: "The subdomain name of the application",
        },
        branch: {
          type: "string",
          description: "Branch to build from (e.g., 'main', 'trunk', 'branches/feature-x')",
        },
        revision: {
          type: "string",
          description: "Specific revision (Git commit hash or SVN revision number)",
        },
        version: {
          type: "string",
          description: "Semantic version for the package (e.g., '2.3.5')",
        },
        description: {
          type: "string",
          description: "Optional description for the package",
        },
      },
      required: ["appId", "version"],
    },
  },
  {
    name: "mendix_delete_package",
    description: "Deletes a deployment package (Build API v1)",
    inputSchema: {
      type: "object",
      properties: {
        appId: {
          type: "string",
          description: "The subdomain name of the application",
        },
        packageId: {
          type: "string",
          description: "The unique identifier of the package to delete",
        },
      },
      required: ["appId", "packageId"],
    },
  },

  // ============================================================================
  // DEPLOY API v1 - Package Transport
  // ============================================================================
  {
    name: "mendix_transport_package",
    description:
      "Transports a package to an environment for deployment (Deploy API v1)",
    inputSchema: {
      type: "object",
      properties: {
        appId: {
          type: "string",
          description: "The subdomain name of the application",
        },
        mode: {
          type: "string",
          description: "Target environment mode",
        },
        packageId: {
          type: "string",
          description: "The ID of the package to transport",
        },
      },
      required: ["appId", "mode", "packageId"],
    },
  },

  // ============================================================================
  // BACKUPS API v2 - Snapshots
  // ============================================================================
  {
    name: "mendix_list_snapshots",
    description: "Lists all snapshots for an environment (Backups API v2)",
    inputSchema: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "The project/app identifier",
        },
        environmentId: {
          type: "string",
          description: "The environment identifier",
        },
        offset: {
          type: "number",
          description: "Pagination offset",
          default: 0,
        },
        limit: {
          type: "number",
          description: "Maximum items to return",
          default: 100,
        },
      },
      required: ["projectId", "environmentId"],
    },
  },
  {
    name: "mendix_create_snapshot",
    description: "Creates a new backup snapshot of an environment (Backups API v2)",
    inputSchema: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "The project/app identifier",
        },
        environmentId: {
          type: "string",
          description: "The environment identifier",
        },
        comment: {
          type: "string",
          description: "Optional comment describing the snapshot",
        },
      },
      required: ["projectId", "environmentId"],
    },
  },
  {
    name: "mendix_get_snapshot",
    description: "Gets the status of a specific snapshot (Backups API v2)",
    inputSchema: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "The project/app identifier",
        },
        environmentId: {
          type: "string",
          description: "The environment identifier",
        },
        snapshotId: {
          type: "string",
          description: "The snapshot identifier",
        },
      },
      required: ["projectId", "environmentId", "snapshotId"],
    },
  },
  {
    name: "mendix_delete_snapshot",
    description: "Deletes a snapshot (Backups API v2)",
    inputSchema: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "The project/app identifier",
        },
        environmentId: {
          type: "string",
          description: "The environment identifier",
        },
        snapshotId: {
          type: "string",
          description: "The snapshot identifier to delete",
        },
      },
      required: ["projectId", "environmentId", "snapshotId"],
    },
  },

  // ============================================================================
  // BACKUPS API v2 - Archives
  // ============================================================================
  {
    name: "mendix_create_archive",
    description:
      "Creates a downloadable backup archive from a snapshot (Backups API v2)",
    inputSchema: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "The project/app identifier",
        },
        environmentId: {
          type: "string",
          description: "The environment identifier",
        },
        snapshotId: {
          type: "string",
          description: "The snapshot identifier",
        },
        dataType: {
          type: "string",
          enum: ["database_only", "files_and_database"],
          description: "Type of data to include in the archive",
          default: "files_and_database",
        },
      },
      required: ["projectId", "environmentId", "snapshotId"],
    },
  },
  {
    name: "mendix_get_archive",
    description:
      "Gets the status of an archive (includes download URL when ready) (Backups API v2)",
    inputSchema: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "The project/app identifier",
        },
        environmentId: {
          type: "string",
          description: "The environment identifier",
        },
        snapshotId: {
          type: "string",
          description: "The snapshot identifier",
        },
        archiveId: {
          type: "string",
          description: "The archive identifier",
        },
      },
      required: ["projectId", "environmentId", "snapshotId", "archiveId"],
    },
  },

  // ============================================================================
  // BACKUPS API v2 - Restores
  // ============================================================================
  {
    name: "mendix_restore_snapshot",
    description:
      "Restores an environment from a snapshot (environment must be stopped) (Backups API v2)",
    inputSchema: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "The project/app identifier",
        },
        environmentId: {
          type: "string",
          description: "The target environment identifier",
        },
        sourceSnapshotId: {
          type: "string",
          description: "The snapshot ID to restore from (can be from another environment)",
        },
        dbOnly: {
          type: "boolean",
          description: "If true, restore database only (files not restored)",
          default: false,
        },
      },
      required: ["projectId", "environmentId", "sourceSnapshotId"],
    },
  },
  {
    name: "mendix_get_restore_status",
    description: "Gets the status of a restore operation (Backups API v2)",
    inputSchema: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "The project/app identifier",
        },
        environmentId: {
          type: "string",
          description: "The environment identifier",
        },
        restoreId: {
          type: "string",
          description: "The restore operation identifier",
        },
      },
      required: ["projectId", "environmentId", "restoreId"],
    },
  },

  // ============================================================================
  // DEPLOY API v1 - Logs
  // ============================================================================
  {
    name: "mendix_get_app_logs",
    description: "Gets download URL for application logs for a specific date (Deploy API v1)",
    inputSchema: {
      type: "object",
      properties: {
        appId: {
          type: "string",
          description: "The subdomain name of the application",
        },
        mode: {
          type: "string",
          description: "Environment mode",
        },
        date: {
          type: "string",
          description: "Date in YYYY-MM-DD format",
          pattern: "^\\d{4}-\\d{2}-\\d{2}$",
        },
      },
      required: ["appId", "mode", "date"],
    },
  },

  // ============================================================================
  // DEPLOY API v1 - Environment Settings
  // ============================================================================
  {
    name: "mendix_get_environment_settings",
    description: "Retrieves environment settings including constants and scheduled events (Deploy API v1)",
    inputSchema: {
      type: "object",
      properties: {
        appId: {
          type: "string",
          description: "The subdomain name of the application",
        },
        mode: {
          type: "string",
          description: "Environment mode",
        },
      },
      required: ["appId", "mode"],
    },
  },
];

const server = new Server(
  {
    name: "mendix-public-cloud-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // ========================================================================
      // DEPLOY API v4 - Apps
      // ========================================================================
      case "mendix_list_apps": {
        const { offset, limit, licenseType } = args as {
          offset?: number;
          limit?: number;
          licenseType?: string;
        };
        const queryParams: Record<string, string | number> = {};
        if (offset !== undefined) queryParams.offset = offset;
        if (limit !== undefined) queryParams.limit = limit;
        if (licenseType) queryParams.licenseType = licenseType;

        const result = await mendixApiRequest(
          DEPLOY_API_V4,
          "/apps",
          "GET",
          undefined,
          queryParams
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "mendix_get_app": {
        const { appId } = args as { appId: string };
        const result = await mendixApiRequest(DEPLOY_API_V4, `/apps/${appId}`);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      // ========================================================================
      // DEPLOY API v4 - Environments
      // ========================================================================
      case "mendix_list_environments": {
        const { appId, expand } = args as { appId: string; expand?: string };
        const queryParams: Record<string, string> = {};
        if (expand) queryParams.expand = expand;

        const result = await mendixApiRequest(
          DEPLOY_API_V4,
          `/apps/${appId}/environments`,
          "GET",
          undefined,
          queryParams
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "mendix_get_environment": {
        const { appId, environmentId, expand } = args as {
          appId: string;
          environmentId: string;
          expand?: string;
        };
        const queryParams: Record<string, string> = {};
        if (expand) queryParams.expand = expand;

        const result = await mendixApiRequest(
          DEPLOY_API_V4,
          `/apps/${appId}/environments/${environmentId}`,
          "GET",
          undefined,
          queryParams
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      // ========================================================================
      // DEPLOY API v1 - Environment Operations
      // ========================================================================
      case "mendix_start_environment": {
        const { appId, mode, autoSyncDb = true } = args as {
          appId: string;
          mode: string;
          autoSyncDb?: boolean;
        };
        const result = await mendixApiRequest(
          DEPLOY_API_V1,
          `/apps/${appId}/environments/${mode}/start`,
          "POST",
          { AutoSyncDb: autoSyncDb }
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "mendix_stop_environment": {
        const { appId, mode } = args as { appId: string; mode: string };
        const result = await mendixApiRequest(
          DEPLOY_API_V1,
          `/apps/${appId}/environments/${mode}/stop`,
          "POST"
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "mendix_get_environment_status": {
        const { appId, mode } = args as { appId: string; mode: string };
        const result = await mendixApiRequest(
          DEPLOY_API_V1,
          `/apps/${appId}/environments/${mode}`
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      // ========================================================================
      // DEPLOY API v2 - Package Upload & Jobs
      // ========================================================================
      case "mendix_get_job_status": {
        const { appId, jobId } = args as { appId: string; jobId: string };
        const result = await mendixApiRequest(
          DEPLOY_API_V2,
          `/apps/${appId}/jobs/${jobId}`
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      // ========================================================================
      // BUILD API v1 - Package Management
      // ========================================================================
      case "mendix_list_packages": {
        const { appId } = args as { appId: string };
        const result = await mendixApiRequest(
          DEPLOY_API_V1,
          `/apps/${appId}/packages`
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "mendix_get_package": {
        const { appId, packageId, includeUrl = false } = args as {
          appId: string;
          packageId: string;
          includeUrl?: boolean;
        };
        const result = await mendixApiRequest(
          DEPLOY_API_V1,
          `/apps/${appId}/packages/${packageId}`,
          "GET",
          undefined,
          includeUrl ? { url: true } : undefined
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "mendix_start_build": {
        const { appId, branch, revision, version, description } = args as {
          appId: string;
          branch?: string;
          revision?: string;
          version: string;
          description?: string;
        };
        const body: Record<string, string> = { Version: version };
        if (branch) body.Branch = branch;
        if (revision) body.Revision = revision;
        if (description) body.Description = description;

        const result = await mendixApiRequest(
          DEPLOY_API_V1,
          `/apps/${appId}/packages`,
          "POST",
          body
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "mendix_delete_package": {
        const { appId, packageId } = args as {
          appId: string;
          packageId: string;
        };
        const result = await mendixApiRequest(
          DEPLOY_API_V1,
          `/apps/${appId}/packages/${packageId}`,
          "DELETE"
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      // ========================================================================
      // DEPLOY API v1 - Package Transport
      // ========================================================================
      case "mendix_transport_package": {
        const { appId, mode, packageId } = args as {
          appId: string;
          mode: string;
          packageId: string;
        };
        const result = await mendixApiRequest(
          DEPLOY_API_V1,
          `/apps/${appId}/environments/${mode}/transport`,
          "POST",
          { PackageId: packageId }
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      // ========================================================================
      // BACKUPS API v2 - Snapshots
      // ========================================================================
      case "mendix_list_snapshots": {
        const { projectId, environmentId, offset = 0, limit = 100 } = args as {
          projectId: string;
          environmentId: string;
          offset?: number;
          limit?: number;
        };
        const result = await mendixApiRequest(
          DEPLOY_API_V2,
          `/apps/${projectId}/environments/${environmentId}/snapshots`,
          "GET",
          undefined,
          { offset, limit }
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "mendix_create_snapshot": {
        const { projectId, environmentId, comment } = args as {
          projectId: string;
          environmentId: string;
          comment?: string;
        };
        const body = comment ? { comment } : {};
        const result = await mendixApiRequest(
          DEPLOY_API_V2,
          `/apps/${projectId}/environments/${environmentId}/snapshots`,
          "POST",
          body
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "mendix_get_snapshot": {
        const { projectId, environmentId, snapshotId } = args as {
          projectId: string;
          environmentId: string;
          snapshotId: string;
        };
        const result = await mendixApiRequest(
          DEPLOY_API_V2,
          `/apps/${projectId}/environments/${environmentId}/snapshots/${snapshotId}`
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "mendix_delete_snapshot": {
        const { projectId, environmentId, snapshotId } = args as {
          projectId: string;
          environmentId: string;
          snapshotId: string;
        };
        const result = await mendixApiRequest(
          DEPLOY_API_V2,
          `/apps/${projectId}/environments/${environmentId}/snapshots/${snapshotId}`,
          "DELETE"
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      // ========================================================================
      // BACKUPS API v2 - Archives
      // ========================================================================
      case "mendix_create_archive": {
        const {
          projectId,
          environmentId,
          snapshotId,
          dataType = "files_and_database",
        } = args as {
          projectId: string;
          environmentId: string;
          snapshotId: string;
          dataType?: string;
        };
        const result = await mendixApiRequest(
          DEPLOY_API_V2,
          `/apps/${projectId}/environments/${environmentId}/snapshots/${snapshotId}/archives`,
          "POST",
          undefined,
          { data_type: dataType }
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "mendix_get_archive": {
        const { projectId, environmentId, snapshotId, archiveId } = args as {
          projectId: string;
          environmentId: string;
          snapshotId: string;
          archiveId: string;
        };
        const result = await mendixApiRequest(
          DEPLOY_API_V2,
          `/apps/${projectId}/environments/${environmentId}/snapshots/${snapshotId}/archives/${archiveId}`
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      // ========================================================================
      // BACKUPS API v2 - Restores
      // ========================================================================
      case "mendix_restore_snapshot": {
        const {
          projectId,
          environmentId,
          sourceSnapshotId,
          dbOnly = false,
        } = args as {
          projectId: string;
          environmentId: string;
          sourceSnapshotId: string;
          dbOnly?: boolean;
        };
        const result = await mendixApiRequest(
          DEPLOY_API_V2,
          `/apps/${projectId}/environments/${environmentId}/restores`,
          "POST",
          undefined,
          { source_snapshot_id: sourceSnapshotId, db_only: dbOnly }
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "mendix_get_restore_status": {
        const { projectId, environmentId, restoreId } = args as {
          projectId: string;
          environmentId: string;
          restoreId: string;
        };
        const result = await mendixApiRequest(
          DEPLOY_API_V2,
          `/apps/${projectId}/environments/${environmentId}/restores/${restoreId}`
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      // ========================================================================
      // DEPLOY API v1 - Logs
      // ========================================================================
      case "mendix_get_app_logs": {
        const { appId, mode, date } = args as {
          appId: string;
          mode: string;
          date: string;
        };
        const result = await mendixApiRequest(
          DEPLOY_API_V1,
          `/apps/${appId}/environments/${mode}/logs/${date}`
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      // ========================================================================
      // DEPLOY API v1 - Environment Settings
      // ========================================================================
      case "mendix_get_environment_settings": {
        const { appId, mode } = args as { appId: string; mode: string };
        const result = await mendixApiRequest(
          DEPLOY_API_V1,
          `/apps/${appId}/environments/${mode}/settings`
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Mendix Public Cloud MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});

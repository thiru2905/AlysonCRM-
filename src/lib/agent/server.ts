import { createServerFn } from "@tanstack/react-start";
import { createPairingCode, getPrimaryDeviceStatus, listDesktopAgents } from "./services/devices";
import {
  getAutomationRun,
  listAutomationRuns,
  listPendingApprovals,
  reconcileStaleAutomationRuns,
  resolveApproval,
  startAutomation,
} from "./services/automation";
import {
  addProspect,
  createCampaign,
  createMessageDraft,
  listCampaigns,
  listProspects,
  listProfiles,
  getProfile,
} from "./services/linkedin-outreach";
import { backfillProspectsFromToolCalls } from "./services/prospect-sync";
import { getDesktopDevCommand } from "./installer";
import {
  getBrowserWorkersStats,
  listConnections,
  listToolCalls,
} from "./services/browser-workers";
import {
  createAndStartHermesMission,
  createHermesMission,
  getHermesEngineStatus,
  getHermesMissionSynced,
  listHermesMissionsSynced,
  startHermesMission,
} from "./services/hermes-engine";
import { getHermesLiveStatus } from "./services/hermes-live";
import { refreshHermesConnectionStatuses } from "./services/connection-refresh";
import type { CreateHermesMissionInput } from "@/lib/hermes/types";

export const createPairingCodeFn = createServerFn({ method: "POST" })
  .handler(async () => createPairingCode());

export const getDeviceStatusFn = createServerFn({ method: "GET" }).handler(async () =>
  getPrimaryDeviceStatus()
);

export const getDesktopInstallInfoFn = createServerFn({ method: "GET" }).handler(async () => ({
  devCommand: getDesktopDevCommand(),
  batUrl: "/api/agent/installer/windows.bat",
  ps1Url: "/api/agent/installer/windows.ps1",
}));

export const listDevicesFn = createServerFn({ method: "GET" }).handler(async () =>
  listDesktopAgents()
);

export const startAutomationFn = createServerFn({ method: "POST" })
  .validator((payload: { prompt: string; deviceId?: string }) => payload)
  .handler(async ({ data }) => startAutomation(data.prompt, data.deviceId));

export const listAutomationRunsFn = createServerFn({ method: "GET" }).handler(async () =>
  listAutomationRuns()
);

export const getAutomationRunFn = createServerFn({ method: "POST" })
  .validator((payload: { runId: string }) => payload)
  .handler(async ({ data }) => getAutomationRun(data.runId));

export const listApprovalsFn = createServerFn({ method: "POST" })
  .validator((payload: { runId?: string }) => payload)
  .handler(async ({ data }) => listPendingApprovals(data.runId));

export const resolveApprovalFn = createServerFn({ method: "POST" })
  .validator(
    (payload: {
      approvalId: string;
      status: "approved" | "rejected" | "edited";
    }) => payload
  )
  .handler(async ({ data }) => {
    resolveApproval(data.approvalId, data.status);
    return { ok: true };
  });

export const listCampaignsFn = createServerFn({ method: "GET" }).handler(async () =>
  listCampaigns()
);

export const createCampaignFn = createServerFn({ method: "POST" })
  .validator(
    (payload: { name: string; targetAudience?: string; dailyLimit?: number }) => payload
  )
  .handler(async ({ data }) => createCampaign(data));

export const listProspectsFn = createServerFn({ method: "POST" })
  .validator((payload: { campaignId?: string }) => payload)
  .handler(async ({ data }) => listProspects(data.campaignId));

export const listProfilesFn = createServerFn({ method: "GET" }).handler(async () => {
  reconcileStaleAutomationRuns();
  backfillProspectsFromToolCalls();
  return listProfiles();
});

export const getProfileFn = createServerFn({ method: "POST" })
  .validator((payload: { id: string }) => payload)
  .handler(async ({ data }) => {
    const profile = getProfile(data.id);
    if (!profile) throw new Error("Profile not found");
    return profile;
  });

export const addProspectFn = createServerFn({ method: "POST" })
  .validator(
    (payload: {
      campaignId?: string;
      name: string;
      profileUrl: string;
      company?: string;
      title?: string;
      location?: string;
    }) => payload
  )
  .handler(async ({ data }) => addProspect(data));

export const createMessageDraftFn = createServerFn({ method: "POST" })
  .validator((payload: { prospectId: string; body: string }) => payload)
  .handler(async ({ data }) => createMessageDraft(data.prospectId, data.body));

export const getBrowserWorkersDashboardFn = createServerFn({ method: "GET" }).handler(
  async () => {
    backfillProspectsFromToolCalls();
    return {
      stats: getBrowserWorkersStats(),
      connections: listConnections(false),
      hermesConnections: listConnections(true),
      toolCalls: listToolCalls(40),
      runs: listAutomationRuns(20),
    };
  }
);

export const getHermesLiveStatusFn = createServerFn({ method: "GET" }).handler(async () =>
  getHermesLiveStatus()
);

export const refreshHermesConnectionStatusesFn = createServerFn({ method: "POST" }).handler(
  async () => refreshHermesConnectionStatuses()
);

export const getRunToolCallsFn = createServerFn({ method: "POST" })
  .validator((payload: { runId: string }) => payload)
  .handler(async ({ data }) => listToolCalls(100, data.runId));

export const getHermesEngineStatusFn = createServerFn({ method: "GET" }).handler(async () =>
  getHermesEngineStatus()
);

export const listHermesMissionsFn = createServerFn({ method: "GET" }).handler(async () => {
  reconcileStaleAutomationRuns();
  return listHermesMissionsSynced();
});

export const getHermesMissionFn = createServerFn({ method: "POST" })
  .validator((payload: { missionId: string }) => payload)
  .handler(async ({ data }) => {
    const mission = getHermesMissionSynced(data.missionId);
    if (!mission) throw new Error("Mission not found");
    return mission;
  });

export const createHermesMissionFn = createServerFn({ method: "POST" })
  .validator((payload: CreateHermesMissionInput) => payload)
  .handler(async ({ data }) => createHermesMission(data));

export const startHermesMissionFn = createServerFn({ method: "POST" })
  .validator((payload: { missionId: string; deviceId?: string }) => payload)
  .handler(async ({ data }) => startHermesMission(data.missionId, data.deviceId));

export const createAndStartHermesMissionFn = createServerFn({ method: "POST" })
  .validator((payload: CreateHermesMissionInput & { deviceId?: string }) => payload)
  .handler(async ({ data }) => {
    const { deviceId, ...input } = data;
    return createAndStartHermesMission(input, deviceId);
  });

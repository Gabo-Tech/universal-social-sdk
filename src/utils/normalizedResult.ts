export function normalizeActionResult<TPlatform extends string>(params: {
  platform: TPlatform;
  action: string;
  raw?: unknown;
}) {
  return {
    platform: params.platform,
    action: params.action,
    success: true,
    raw: params.raw
  };
}

export function normalizeDeleteResult<TPlatform extends string>(params: {
  platform: TPlatform;
  targetId: string;
  raw?: unknown;
}) {
  return {
    platform: params.platform,
    targetId: params.targetId,
    deleted: true,
    success: true,
    raw: params.raw
  };
}

export function normalizeMutationResult<TPlatform extends string>(params: {
  platform: TPlatform;
  resourceId?: string;
  raw?: unknown;
}) {
  return {
    platform: params.platform,
    resourceId: params.resourceId,
    success: true,
    raw: params.raw
  };
}

export function normalizeDetailResult<TPlatform extends string>(params: {
  platform: TPlatform;
  raw?: unknown;
}) {
  return {
    platform: params.platform,
    success: true,
    raw: params.raw
  };
}

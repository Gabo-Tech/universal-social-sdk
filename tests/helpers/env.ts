import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test"), override: false });
dotenv.config({ path: path.resolve(process.cwd(), ".env"), override: false });

export interface IntegrationEnvStatus {
  platform: "x" | "facebook" | "instagram" | "linkedin";
  enabled: boolean;
  missingVars: string[];
}

function hasValue(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

function check(required: string[]): { enabled: boolean; missingVars: string[] } {
  const missingVars = required.filter((key) => !hasValue(process.env[key]));
  return { enabled: missingVars.length === 0, missingVars };
}

export function getIntegrationEnvStatus(): IntegrationEnvStatus[] {
  const x = check([
    "X_API_KEY",
    "X_API_SECRET",
    "X_ACCESS_TOKEN",
    "X_ACCESS_SECRET",
    "X_TEST_TWEET_ID"
  ]);
  const facebook = check(["FB_PAGE_ACCESS_TOKEN", "FB_PAGE_ID"]);
  const instagram = check(["IG_ACCESS_TOKEN", "IG_USER_ID"]);
  const linkedin = check(["LINKEDIN_ACCESS_TOKEN", "LINKEDIN_ORG_URN"]);

  return [
    { platform: "x", ...x },
    { platform: "facebook", ...facebook },
    { platform: "instagram", ...instagram },
    { platform: "linkedin", ...linkedin }
  ];
}

export function platformEnabled(
  platform: IntegrationEnvStatus["platform"]
): IntegrationEnvStatus {
  const status = getIntegrationEnvStatus().find((s) => s.platform === platform);
  if (!status) {
    throw new Error(`Unknown platform: ${platform}`);
  }
  return status;
}

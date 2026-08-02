import type { Findings } from "./types";
import { normalizeSeverity } from "../utils/normalize";

export function auditParse(json: any): Findings[] {
  const findings: Findings[] = [];

  const scanTime =
    json.metadata?.created ??
    json.metadata?.timestamp ??
    new Date().toISOString(); // Fix 3: fall back to now if audit JSON has no timestamp

  for (const [name, vuln] of Object.entries<any>(json.vulnerabilities ?? {})) {
    const advisory = Array.isArray(vuln.via)
      ? vuln.via.find(
          (entry: any) =>
            typeof entry === "object" && entry !== null && !Array.isArray(entry),
        )
      : undefined;

    // Fix 4: Skip transitive wrapper entries — these have no real advisory of
    // their own (via is only strings pointing to other packages). They are
    // already represented by the package that caused them.
    if (!advisory) continue;

    const severity = advisory?.severity ?? vuln.severity ?? vuln.Severity;

    const dependencyPath = Array.from(
      new Set(
        [vuln.name, ...(Array.isArray(vuln.effects) ? vuln.effects : [])].filter(
          Boolean,
        ) as string[],
      ),
    );

    // Fix 2: Count fixAvailable: true as fixable too (fix exists but no
    // pinned version). Only exclude fixAvailable: false (no fix at all).
    let fixedVersion: string | undefined;
    if (
      vuln.fixAvailable !== null &&
      typeof vuln.fixAvailable === "object" &&
      !Array.isArray(vuln.fixAvailable) &&
      typeof vuln.fixAvailable.version === "string" &&
      vuln.fixAvailable.version
    ) {
      // Has a specific version to upgrade to
      fixedVersion = vuln.fixAvailable.version;
    } else if (vuln.fixAvailable === true) {
      // Fix exists but no pinned version (breaking change path)
      fixedVersion = "See npm audit fix";
    } else {
      fixedVersion = undefined;
    }

    // Fix 1: nodes contains paths like "node_modules/body-parser", not
    // "name@version". npm audit v2 doesn't expose the installed version
    // directly — leave it undefined so the UI correctly shows "—".
    const installedVersion = undefined;

    findings.push({
      id: `npm-audit:${name}:${advisory?.source ?? name}`,
      title: advisory?.title ?? name,
      cvssScore: advisory?.cvss?.score,
      packageName: vuln.name,
      severity: normalizeSeverity(severity),
      installedVersion,
      fixedVersion,
      isDirect: vuln.isDirect,
      vulnerabilityId: String(advisory?.source ?? name),
      advisoryUrl: advisory?.url,
      target: "package-lock.json",
      scanner: "audit",
      description: undefined,
      cweIds: advisory?.cwe,
      cvssVector: advisory?.cvss?.vectorString,
      dependencyPath,
      publishedAt: scanTime,
    });
  }

  return findings;
}
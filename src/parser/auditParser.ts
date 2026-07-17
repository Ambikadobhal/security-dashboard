import type { Findings } from "./types";
import { normalizeSeverity } from "../utils/normalize";

export function auditParse(json: any): Findings[] {
  const findings: Findings[] = [];

  for (const [name, vuln] of Object.entries<any>(json.vulnerabilities ?? {})) {
    const advisory = Array.isArray(vuln.via)
      ? vuln.via.find((entry: any) => typeof entry === 'object' && entry !== null && !Array.isArray(entry))
      : undefined;
    const severity = advisory?.severity ?? vuln.severity ?? vuln.Severity;
    const dependencyPath = Array.from(
      new Set([vuln.name, ...(Array.isArray(vuln.effects) ? vuln.effects : [])].filter(Boolean) as string[]),
    );

    findings.push({
      id: `npm-audit:${name}:${advisory?.source ?? name}`,
      title: advisory?.title ?? name,
      cvssScore: advisory?.cvss?.score,
      packageName: vuln.name,
      severity: normalizeSeverity(severity),
      installedVersion: undefined,
      fixedVersion: typeof vuln.fixAvailable === 'object' ? vuln.fixAvailable.version : undefined,
      isDirect: vuln.isDirect,
      vulnerabilityId: String(advisory?.source ?? name),
      advisoryUrl: advisory?.url,
      target: 'package-lock.json',
      scanner: 'audit',
      description: undefined,
      cweIds: advisory?.cwe,
      cvssVector: advisory?.cvss?.vectorString,
      dependencyPath,
    });
  }

  return findings;
}
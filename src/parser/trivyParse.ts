import { normalizeSeverity } from "../utils/normalize";
import type { Findings } from "./types";

export function trivyParse(json: any): Findings[] {
  const findings: Findings[] = [];

  for (const result of json.Results ?? []) {
    for (const vuln of result.Vulnerabilities ?? []) {
      findings.push({
        id:`trivy:${result.Target}:${vuln.PkgName}:${vuln.VulnerabilityID}`,
        title: vuln.Title,
        cvssScore: vuln.CVSS?.V3Score || vuln.CVSS?.V2Score,
        packageName: vuln.PkgName,
        severity: normalizeSeverity(vuln.Severity),
        installedVersion: vuln.InstalledVersion,
        fixedVersion: vuln.FixedVersion,
        isDirect: false,
        vulnerabilityId: vuln.VulnerabilityID,
        target: result.Target || "",
        scanner: "trivy",
      });
    }
  }

  return findings;
}
import { normalizeSeverity } from "../utils/normalize";
import type { Findings } from "./types";

export function trivyParse(json: any): Findings[] {
  const findings: Findings[] = [];

  for (const result of json.Results ?? []) {
    for (const vuln of result.Vulnerabilities ?? []) {
      const trivyCvss = vuln.CVSS ?? {};
      const cvssScore = trivyCvss?.nvd?.V3Score ?? trivyCvss?.nvd?.V2Score ?? trivyCvss?.redhat?.V3Score ?? trivyCvss?.redhat?.V2Score;

      findings.push({
        id:`trivy:${result.Target}:${vuln.PkgName}:${vuln.VulnerabilityID}`,
        title: vuln.Title,
        cvssScore,
        cvssVector: trivyCvss?.nvd?.V3Vector ?? trivyCvss?.nvd?.V2Vector ?? trivyCvss?.redhat?.V3Vector ?? trivyCvss?.redhat?.V2Vector,
        packageName: vuln.PkgName,
        severity: normalizeSeverity(vuln.Severity),
        installedVersion: vuln.InstalledVersion,
        fixedVersion: vuln.FixedVersion,
        isDirect: false,
        vulnerabilityId: vuln.VulnerabilityID,
        target: result.Target || "",
        scanner: "trivy",
        description: vuln.Description,
        cweIds: vuln.CweIDs,
        references: vuln.References,
        dependencyPath: result.Target ? [result.Target] : [],
        publishedAt: vuln.PublishedDate ?? undefined,
      });
    }
  }

  return findings;
}
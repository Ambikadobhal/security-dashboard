import { normalizeSeverity } from "../utils/normalize";
import type { Findings } from "./types";

export function trivyParse(json: any): Findings[] {
  const findings: Findings[] = [];

  for (const result of json.Results ?? []) {
   
    const isDirectFallback = result.Class === "lang-pkgs";

    for (const vuln of result.Vulnerabilities ?? []) {
      const isDirect = vuln.Relationship ? vuln.Relationship === "direct" : isDirectFallback;
      const trivyCvss = vuln.CVSS ?? {};
      const cvssScore =
        trivyCvss?.nvd?.V3Score ??
        trivyCvss?.nvd?.V2Score ??
        trivyCvss?.redhat?.V3Score ??
        trivyCvss?.redhat?.V2Score ??
        trivyCvss?.ghsa?.V3Score ??
        trivyCvss?.ghsa?.V2Score ??
        trivyCvss?.bitnami?.V3Score ??
        trivyCvss?.bitnami?.V2Score;
      const fixedVersion = vuln.FixedVersion || undefined;

      findings.push({
        id: `trivy:${result.Target}:${vuln.PkgName}:${vuln.VulnerabilityID}`,
        title: vuln.Title,
        cvssScore,
        cvssVector:
          trivyCvss?.nvd?.V3Vector ??
          trivyCvss?.nvd?.V2Vector ??
          trivyCvss?.redhat?.V3Vector ??
          trivyCvss?.redhat?.V2Vector ??
          trivyCvss?.ghsa?.V3Vector ??
          trivyCvss?.ghsa?.V2Vector ??
          trivyCvss?.bitnami?.V3Vector ??
          trivyCvss?.bitnami?.V2Vector,
        packageName: vuln.PkgName,
        severity: normalizeSeverity(vuln.Severity),
        installedVersion: vuln.InstalledVersion || undefined,
        fixedVersion,                      
        isDirect,                          
        vulnerabilityId: vuln.VulnerabilityID,
        target: result.Target || "",
        scanner: "trivy",
        description: vuln.Description,
        cweIds: vuln.CweIDs,
        references: vuln.References,
        dependencyPath: result.Target ? [result.Target] : [],
        publishedAt: json.CreatedAt ?? json.Metadata?.ImageConfig?.created,
      });
    }
  }

  return findings;
}
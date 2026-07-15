export interface Findings {
    id: string;                    // stable row key, e.g. `${scanner}:${target}:${vulnerabilityId}:${packageName}`
  severity: string;                  // CVSS severity, e.g. "CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN"
  cvssScore?: number;            // absent when a source gives no score
  packageName: string;
  installedVersion?: string;
  fixedVersion?: string;         // absent = no fix available yet
  isDirect: boolean;
  vulnerabilityId: string;       // CVE-… or GHSA-…
  advisoryUrl?: string;
  title: string;
  target: string;                // image tag or lockfile path
  scanner: string;                  // e.g. "trivy", "grype", "snyk"
 
  // detail-panel only — deliberately NOT columns (too long / low triage value)
  description?: string;
  cweIds?: string[];
  cvssVector?: string;
  references?: string[];
  publishedAt?: string;
  dependencyPath?: string[];   
}

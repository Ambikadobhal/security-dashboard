import type { Findings } from "./types";


export function createSummary(findings: Findings[]) {
    return {
        total: findings.length,
        critical: findings.filter(f => f.severity === "critical").length,
        high: findings.filter(f => f.severity === "high").length,
        medium: findings.filter(f => f.severity === "medium").length,
        low: findings.filter(f => f.severity === "low").length,
        info: findings.filter(f => f.severity === "info").length,
        fixable: findings.filter(f => f.fixedVersion).length,
    };
}
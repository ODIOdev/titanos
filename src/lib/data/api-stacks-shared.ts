export type ApiStackLight = "green" | "yellow" | "red";

export type ApiStackMetric = {
  label: string;
  value: string;
};

export type ApiStackReport = {
  id: string;
  name: string;
  description: string;
  /** green = active, yellow = problem, red = error */
  light: ApiStackLight;
  /** Live probe reading before sticky resolution is applied. */
  probedLight: ApiStackLight;
  statusLabel: string;
  detail: string;
  metrics: ApiStackMetric[];
  docsUrl?: string;
  logoUrl?: string;
  /** Concrete remediation steps for the Diagnose → agent prompt. */
  fixSteps?: string[];
};

export const API_STACK_STATUS_LABEL: Record<ApiStackLight, string> = {
  green: "Active",
  yellow: "Problem",
  red: "Error",
};

const lightRank: Record<ApiStackLight, number> = {
  green: 0,
  yellow: 1,
  red: 2,
};

/**
 * Traffic lights can worsen immediately, but only hard-upgrade back to green
 * once a probe confirms the issue is actually resolved.
 */
export function resolveStickyLight(
  previous: ApiStackLight | undefined,
  probed: ApiStackLight,
): ApiStackLight {
  if (!previous) return probed;
  if (lightRank[probed] > lightRank[previous]) return probed;
  if (probed === "green") return "green";
  return previous;
}

export function buildApiStackDiagnosePrompt(stack: ApiStackReport): string {
  const metrics = stack.metrics
    .map((m) => `- ${m.label}: ${m.value}`)
    .join("\n");
  const steps = (stack.fixSteps ?? [])
    .map((step, i) => `${i + 1}. ${step}`)
    .join("\n");

  return [
    `Fix the ${stack.name} API stack integration in this Titan Safety Co. Next.js repo.`,
    "",
    `Current sticky traffic light: ${stack.light.toUpperCase()} (${stack.statusLabel})`,
    `Live probe reading: ${stack.probedLight.toUpperCase()}`,
    `Detail: ${stack.detail}`,
    "",
    "Metrics:",
    metrics || "- none",
    "",
    "Suggested fix steps:",
    steps ||
      "1. Investigate env configuration and API connectivity for this stack.",
    "",
    "Requirements:",
    "- Do not mark the traffic light green until the live probe actually returns healthy.",
    "- Keep changes scoped to this integration.",
    "- After fixing, refresh /admin/settings and confirm the sticky light upgrades only when resolved.",
  ].join("\n");
}

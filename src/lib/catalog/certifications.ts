import {
  parseAnsiClasses,
  SAFETY_CERTIFICATION_OPTIONS,
} from "@/lib/data/catalog-options";

export type CertificationAnswer = {
  name: string;
  value: string;
};

/** Match a stored cert string to the longest known option name. */
function matchKnownCertification(trimmed: string): string | undefined {
  const exact = SAFETY_CERTIFICATION_OPTIONS.find((opt) => trimmed === opt);
  if (exact) return exact;

  let best: string | undefined;
  for (const opt of SAFETY_CERTIFICATION_OPTIONS) {
    const isPrefixed =
      trimmed.startsWith(`${opt}:`) ||
      trimmed.startsWith(`${opt} —`) ||
      trimmed.startsWith(`${opt} -`);
    if (!isPrefixed) continue;
    if (!best || opt.length > best.length) best = opt;
  }
  return best;
}

/** Parse metadata certifications into form rows for the admin editor. */
export function parseCertificationAnswers(
  raw: unknown,
): CertificationAnswer[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    .map((item) => {
      const trimmed = item.trim();
      const known = matchKnownCertification(trimmed);
      if (known) {
        const rest = trimmed
          .slice(known.length)
          .replace(/^[\s:—-]+/, "")
          .trim();
        return { name: known, value: rest };
      }
      return { name: trimmed, value: "" };
    });
}

/**
 * Merge legacy `ansi_class` column values into certification rows so the
 * unified ANSI Safety certification field shows everything selected.
 */
export function mergeAnsiClassesIntoCertifications(
  certifications: CertificationAnswer[],
  ansiClassRaw: string | null | undefined,
): CertificationAnswer[] {
  const existing = new Set(certifications.map((row) => row.name));
  const extras = parseAnsiClasses(ansiClassRaw)
    .filter((name) => !existing.has(name))
    .map((name) => ({ name, value: "" }));
  return extras.length > 0 ? [...certifications, ...extras] : certifications;
}

export function serializeCertificationAnswers(
  rows: CertificationAnswer[],
): string[] {
  return rows
    .filter((row) => row.name.trim())
    .map((row) =>
      row.value.trim() ? `${row.name}: ${row.value.trim()}` : row.name,
    );
}

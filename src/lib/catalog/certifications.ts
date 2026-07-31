import { SAFETY_CERTIFICATION_OPTIONS } from "@/lib/data/catalog-options";

export type CertificationAnswer = {
  name: string;
  value: string;
};

/** Parse metadata certifications into form rows for the admin editor. */
export function parseCertificationAnswers(
  raw: unknown,
): CertificationAnswer[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    .map((item) => {
      const trimmed = item.trim();
      const known = SAFETY_CERTIFICATION_OPTIONS.find(
        (opt) =>
          trimmed === opt ||
          trimmed.startsWith(`${opt}:`) ||
          trimmed.startsWith(`${opt} —`) ||
          trimmed.startsWith(`${opt} -`),
      );
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

export function serializeCertificationAnswers(
  rows: CertificationAnswer[],
): string[] {
  return rows
    .filter((row) => row.name.trim())
    .map((row) =>
      row.value.trim() ? `${row.name}: ${row.value.trim()}` : row.name,
    );
}

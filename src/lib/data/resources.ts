import type { Resource } from "@/types";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const STATIC_RESOURCES: Resource[] = [
  {
    id: "resource-ansi-hard-hat-guide",
    title: "ANSI Hard Hat Selection Guide",
    slug: "ansi-hard-hat-selection-guide",
    excerpt:
      "How to choose Type I vs Type II hard hats and Class G, E, and C electrical ratings for your jobsite.",
    content: `## Choosing the right hard hat

Hard hats are rated under ANSI/ISEA Z89.1. Matching the right type and class to the hazard keeps crews protected without over-specifying gear.

### Impact types

- **Type I** — Top-impact protection for most construction and industrial environments.
- **Type II** — Top and lateral impact protection for environments with side-impact risk.

### Electrical classes

- **Class G (General)** — Proven dielectric protection up to 2,200 volts.
- **Class E (Electrical)** — Higher dielectric protection up to 20,000 volts.
- **Class C (Conductive)** — Lightweight vented designs; not for electrical hazard areas.

### Fit and suspension

A secure ratchet or pin-lock suspension improves all-day comfort. Replace suspensions on schedule and retire shells after significant impacts or UV degradation.

Need help outfitting a crew? [Request a quote](/quote) or [contact sales](/contact).`,
    cover_image: null,
    published: true,
    created_at: "2026-01-15T00:00:00.000Z",
  },
  {
    id: "resource-hi-vis-vest-classes",
    title: "Hi-Vis Vest Classes Explained",
    slug: "hi-vis-vest-classes-explained",
    excerpt:
      "A practical breakdown of ANSI/ISEA 107 Class 2 and Class 3 garments for roadway and construction work.",
    content: `## High-visibility apparel classes

ANSI/ISEA 107 defines minimum amounts of background material and retroreflective trim.

### Class 2

Common for construction sites, utility work, and many roadway support roles. Provides daytime conspicuity with required reflective coverage.

### Class 3

Highest conspicuity for high-speed traffic environments. Includes sleeves or equivalent coverage for 360° visibility.

### Color and care

Fluorescent yellow-green and orange-red are the standard background colors. Wash per label instructions — excessive industrial laundry cycles can reduce reflective performance.

Shop [safety vests](/shop?category=safety-vests) or ask us about crew kits.`,
    cover_image: null,
    published: true,
    created_at: "2026-02-02T00:00:00.000Z",
  },
  {
    id: "resource-traffic-control-checklist",
    title: "Jobsite Traffic Control Checklist",
    slug: "jobsite-traffic-control-checklist",
    excerpt:
      "A field checklist covering cones, barricades, signs, and PPE staging before lane closures begin.",
    content: `## Before you close a lane

Use this checklist to stage traffic-control inventory and PPE.

1. Confirm the traffic control plan and required device spacing.
2. Stage cones, drums, and barricades in deployment order.
3. Verify sign legends match the approved plan (road work ahead, lane ends, etc.).
4. Outfit flaggers with Class 3 garments and stop/slow paddles.
5. Check night work lighting and device reflectivity.
6. Document device counts for shift turnover.

### Stocking tip

Many municipalities prefer consistent device condition and reflectivity. Ask about volume pricing for cones, barricades, and construction signs via our [bulk order program](/bulk-orders).`,
    cover_image: null,
    published: true,
    created_at: "2026-03-10T00:00:00.000Z",
  },
  {
    id: "resource-fall-protection-basics",
    title: "Fall Protection Basics for Crews",
    slug: "fall-protection-basics-for-crews",
    excerpt:
      "Anchor points, harness fit, and inspection habits that keep elevated work crews safer.",
    content: `## Fall protection fundamentals

When work elevates workers six feet or more in construction (or four feet in general industry), a fall protection plan is essential.

### Core system components

- Full-body harness sized and adjusted correctly
- Compatible connecting device (lanyard or SRL)
- Rated anchorage meeting applicable standards

### Daily inspections

Check webbing for cuts, fraying, and UV damage. Verify hardware gates and locking function. Remove damaged equipment from service immediately.

Browse [fall protection](/shop?category=fall-protection) gear or contact us for kit recommendations.`,
    cover_image: null,
    published: true,
    created_at: "2026-04-01T00:00:00.000Z",
  },
];

export async function getResources(): Promise<Resource[]> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase
        .from("resources")
        .select("*")
        .eq("published", true)
        .eq("is_private", false)
        .order("created_at", { ascending: false });

      if (data?.length) {
        return data.map((row) => ({
          id: row.id,
          title: row.title,
          slug: row.slug,
          excerpt: row.excerpt,
          content: row.content,
          cover_image: row.cover_image,
          published: row.published,
          created_at: row.created_at,
        }));
      }
    } catch {
      // Fall through to static resources
    }
  }

  return STATIC_RESOURCES;
}

export async function getResourceBySlug(slug: string): Promise<Resource | null> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase
        .from("resources")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();

      if (data) {
        return {
          id: data.id,
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt,
          content: data.content,
          cover_image: data.cover_image,
          published: data.published,
          created_at: data.created_at,
        };
      }
    } catch {
      // Fall through
    }
  }

  return STATIC_RESOURCES.find((r) => r.slug === slug) ?? null;
}

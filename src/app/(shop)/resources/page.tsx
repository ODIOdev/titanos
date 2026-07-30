import type { Metadata } from "next";
import Link from "next/link";
import { getResources } from "@/lib/data/resources";
import { SITE_CONFIG } from "@/lib/data/seed-data";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Resources",
  description: `Safety guides and jobsite resources from ${SITE_CONFIG.name}.`,
};

export default async function ResourcesPage() {
  const resources = await getResources();

  return (
    <div className="container-titan py-10 lg:py-14">
      <h1 className="font-heading text-4xl uppercase tracking-wide text-dark-charcoal md:text-5xl">
        Resources
      </h1>
      <p className="mt-4 max-w-2xl text-medium-gray">
        Practical guides on PPE selection, traffic control, and compliance for crews and
        purchasing teams.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {resources.map((resource) => (
          <Link
            key={resource.id}
            href={`/resources/${resource.slug}`}
            className="rounded-sm border border-border-gray bg-white p-6 transition-colors hover:border-dark-charcoal"
          >
            <p className="text-xs uppercase tracking-wide text-medium-gray">
              {formatDate(resource.created_at)}
            </p>
            <h2 className="mt-2 font-heading text-xl uppercase tracking-wide text-dark-charcoal">
              {resource.title}
            </h2>
            {resource.excerpt ? (
              <p className="mt-2 text-sm text-medium-gray">{resource.excerpt}</p>
            ) : null}
            <span className="mt-4 inline-block text-sm font-medium text-dark-charcoal underline-offset-2 hover:underline">
              Read guide →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

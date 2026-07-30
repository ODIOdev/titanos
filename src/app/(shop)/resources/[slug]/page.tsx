import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getResourceBySlug, getResources } from "@/lib/data/resources";
import { formatDate } from "@/lib/utils";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const resources = await getResources();
  return resources.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const resource = await getResourceBySlug(slug);
  if (!resource) return { title: "Resource" };
  return {
    title: resource.title,
    description: resource.excerpt ?? undefined,
  };
}

function renderContent(content: string) {
  // Lightweight markdown-ish rendering for headings, lists, paragraphs, and links
  const blocks = content.trim().split(/\n\n+/);

  return blocks.map((block, index) => {
    const trimmed = block.trim();

    if (trimmed.startsWith("### ")) {
      return (
        <h3
          key={index}
          className="mt-8 font-heading text-xl uppercase tracking-wide text-dark-charcoal"
        >
          {trimmed.slice(4)}
        </h3>
      );
    }
    if (trimmed.startsWith("## ")) {
      return (
        <h2
          key={index}
          className="mt-10 font-heading text-2xl uppercase tracking-wide text-dark-charcoal"
        >
          {trimmed.slice(3)}
        </h2>
      );
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("1. ")) {
      const lines = trimmed.split("\n");
      const ordered = lines[0]?.match(/^\d+\./);
      const ListTag = ordered ? "ol" : "ul";
      return (
        <ListTag
          key={index}
          className={`mt-4 space-y-2 pl-5 text-medium-gray ${ordered ? "list-decimal" : "list-disc"}`}
        >
          {lines.map((line, i) => (
            <li key={i}>{formatInline(line.replace(/^(- |\d+\.\s*)/, ""))}</li>
          ))}
        </ListTag>
      );
    }

    return (
      <p key={index} className="mt-4 text-medium-gray leading-relaxed">
        {formatInline(trimmed)}
      </p>
    );
  });
}

function formatInline(text: string): ReactNode[] {
  const parts = text.split(/(\[.*?\]\(.*?\)|\*\*.*?\*\*)/g);
  return parts.filter(Boolean).map((part, i) => {
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      return (
        <Link
          key={i}
          href={linkMatch[2]}
          className="text-dark-charcoal underline-offset-2 hover:underline"
        >
          {linkMatch[1]}
        </Link>
      );
    }
    const boldMatch = part.match(/^\*\*(.*?)\*\*$/);
    if (boldMatch) {
      return (
        <strong key={i} className="font-semibold text-dark-charcoal">
          {boldMatch[1]}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default async function ResourceDetailPage({ params }: Props) {
  const { slug } = await params;
  const resource = await getResourceBySlug(slug);
  if (!resource) notFound();

  return (
    <article className="container-titan max-w-3xl py-10 lg:py-14">
      <Link
        href="/resources"
        className="text-sm text-medium-gray underline-offset-2 hover:text-dark-charcoal hover:underline"
      >
        ← All resources
      </Link>
      <p className="mt-6 text-xs uppercase tracking-wide text-medium-gray">
        {formatDate(resource.created_at)}
      </p>
      <h1 className="mt-2 font-heading text-4xl uppercase tracking-wide text-dark-charcoal md:text-5xl">
        {resource.title}
      </h1>
      {resource.excerpt ? (
        <p className="mt-4 text-lg text-medium-gray">{resource.excerpt}</p>
      ) : null}
      <div className="mt-2 border-t border-border-gray pt-2 text-base">
        {resource.content ? renderContent(resource.content) : null}
      </div>
    </article>
  );
}

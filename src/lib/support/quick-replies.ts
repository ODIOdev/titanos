export type QuickSupportReply = {
  text: string;
  links: { label: string; href: string }[];
};

/**
 * Instant answers for common page/nav questions (no LLM needed).
 */
export function matchQuickSupportReply(
  rawText: string,
): QuickSupportReply | null {
  const text = rawText.trim().toLowerCase();
  if (!text) return null;

  const mentions = (re: RegExp) => re.test(text);

  if (mentions(/\bfaqs?\b|\bfrequently asked\b/)) {
    return {
      text: "Sure — our FAQ covers shipping, returns, sizing, bulk quotes, and more.",
      links: [{ label: "FAQ", href: "/faq" }],
    };
  }

  if (mentions(/\bresources?\b|\bguides?\b|\bhow-?tos?\b/)) {
    return {
      text: "Yes — PPE guides, checklists, and jobsite tips are on our Resources page.",
      links: [{ label: "Resources", href: "/resources" }],
    };
  }

  if (mentions(/\breturns?\b|\brefunds?\b|\brma\b/)) {
    return {
      text: "Unused gear can be returned within 30 days. Full details are on our returns page.",
      links: [{ label: "Returns", href: "/returns" }],
    };
  }

  if (mentions(/\bshipping\b|\bdelivery\b|\bfree shipping\b/)) {
    return {
      text: "We offer free shipping on qualifying orders over $199. See shipping details here.",
      links: [{ label: "Shipping", href: "/shipping" }],
    };
  }

  if (
    mentions(
      /\bbulk orders?\b|\bvolume (discount|pricing|price)\b|\brequest a quote\b|\bquote form\b|\bget a quote\b|\bmunicipality\b/,
    )
  ) {
    return {
      text: "We quote crews and multi-site accounts within one business day.",
      links: [
        { label: "Request a quote", href: "/quote" },
        { label: "Bulk orders", href: "/bulk-orders" },
      ],
    };
  }

  if (
    mentions(
      /\bcontact (us|support)\b|\bphone number\b|\bemail support\b|\bsupport email\b/,
    )
  ) {
    return {
      text: "You can reach Titan support by phone or email anytime.",
      links: [
        { label: "FAQ", href: "/faq" },
        {
          label: "Email support",
          href: "mailto:support@titansafetyco.com",
        },
      ],
    };
  }

  return null;
}

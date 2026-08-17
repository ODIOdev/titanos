import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  API_STACK_STATUS_LABEL,
  resolveStickyLight,
  type ApiStackLight,
  type ApiStackReport,
} from "@/lib/data/api-stacks-shared";

export type {
  ApiStackLight,
  ApiStackMetric,
  ApiStackReport,
} from "@/lib/data/api-stacks-shared";
export {
  buildApiStackDiagnosePrompt,
  resolveStickyLight,
  API_STACK_STATUS_LABEL,
} from "@/lib/data/api-stacks-shared";

type ProbeContext = {
  now: Date;
};

type ApiStackProbe = {
  id: string;
  name: string;
  description: string;
  docsUrl?: string;
  logoUrl?: string;
  check: (
    ctx: ProbeContext,
  ) => Promise<
    Omit<
      ApiStackReport,
      "id" | "name" | "description" | "docsUrl" | "logoUrl" | "probedLight"
    >
  >;
};

function hostFromUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    return new URL(raw).host;
  } catch {
    return null;
  }
}

function maskTail(value: string | undefined, keep = 4): string {
  if (!value) return "—";
  if (value.length <= keep) return "••••";
  return `••••${value.slice(-keep)}`;
}

function parseGithubRemote(remote: string): { owner: string; repo: string } | null {
  const cleaned = remote.trim();
  const match = cleaned.match(
    /(?:github\.com[:/]|git@github\.com:)([^/]+)\/([^/\s]+?)(?:\.git)?$/i,
  );
  if (!match) return null;
  return { owner: match[1]!, repo: match[2]! };
}

type GithubApiResponse = {
  ok: boolean;
  status: number;
  latencyMs: number;
  remaining: string | null;
  limit: string | null;
  json: Record<string, unknown> | null;
};

function isRetryableGithubError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return (
    err.name === "AbortError" ||
    err.name === "TimeoutError" ||
    /timeout|aborted|ECONNRESET|ETIMEDOUT|ENETUNREACH|EAI_AGAIN/i.test(
      err.message,
    )
  );
}

function headerValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/** IPv4 GitHub GET that bypasses Next.js fetch (avoids patched-fetch / AAAA hangs). */
function githubHttpsGet(
  url: string,
  headers: Record<string, string>,
  timeoutMs: number,
): Promise<GithubApiResponse> {
  return new Promise((resolve, reject) => {
    void (async () => {
      try {
        const https = await import("node:https");
        const started = Date.now();
        const parsed = new URL(url);
        const req = https.request(
          {
            protocol: "https:",
            hostname: parsed.hostname,
            path: `${parsed.pathname}${parsed.search}`,
            method: "GET",
            family: 4,
            headers,
            timeout: timeoutMs,
          },
          (res) => {
            const chunks: Buffer[] = [];
            res.on("data", (chunk: Buffer) => {
              chunks.push(chunk);
            });
            res.on("end", () => {
              const raw = Buffer.concat(chunks).toString("utf8");
              let json: Record<string, unknown> | null = null;
              try {
                json = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
              } catch {
                json = null;
              }
              const status = res.statusCode ?? 0;
              resolve({
                ok: status >= 200 && status < 300,
                status,
                latencyMs: Date.now() - started,
                remaining: headerValue(res.headers["x-ratelimit-remaining"]),
                limit: headerValue(res.headers["x-ratelimit-limit"]),
                json,
              });
            });
          },
        );
        req.on("timeout", () => {
          req.destroy();
          reject(new Error("The operation was aborted due to timeout"));
        });
        req.on("error", reject);
        req.end();
      } catch (err) {
        reject(err);
      }
    })();
  });
}

async function githubApiGet(
  url: string,
  headers: Record<string, string>,
): Promise<GithubApiResponse> {
  const timeoutMs = 10000;
  const attempts = 2;
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await githubHttpsGet(url, headers, timeoutMs);
    } catch (err) {
      lastError = err;
      if (!isRetryableGithubError(err) || attempt === attempts - 1) {
        throw err;
      }
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("GitHub API probe failed.");
}

async function resolveGithubRepoMeta(): Promise<{
  owner: string | null;
  repo: string | null;
  commit: string | null;
  source: string;
}> {
  const envRepo = process.env.GITHUB_REPOSITORY?.trim() || null;
  if (envRepo?.includes("/")) {
    const [owner, repo] = envRepo.split("/");
    return {
      owner: owner || null,
      repo: repo || null,
      commit:
        process.env.VERCEL_GIT_COMMIT_SHA ||
        process.env.GITHUB_SHA ||
        null,
      source: "env",
    };
  }

  const owner =
    process.env.VERCEL_GIT_REPO_OWNER ||
    process.env.GITHUB_REPOSITORY_OWNER ||
    null;
  const repo =
    process.env.VERCEL_GIT_REPO_SLUG ||
    null;
  if (owner && repo) {
    return {
      owner,
      repo,
      commit:
        process.env.VERCEL_GIT_COMMIT_SHA ||
        process.env.GITHUB_SHA ||
        null,
      source: "vercel",
    };
  }

  try {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const pkgRaw = await readFile(join(process.cwd(), "package.json"), "utf8");
    const pkg = JSON.parse(pkgRaw) as {
      repository?: string | { url?: string; type?: string };
    };
    const repoUrl =
      typeof pkg.repository === "string"
        ? pkg.repository
        : pkg.repository?.url;
    if (repoUrl) {
      const parsed = parseGithubRemote(
        repoUrl.replace(/^git\+/, "").replace(/^ssh:\/\//, ""),
      );
      if (parsed) {
        let commit: string | null = null;
        try {
          const head = await readFile(join(process.cwd(), ".git", "HEAD"), "utf8");
          const ref = head.trim();
          if (ref.startsWith("ref:")) {
            const refPath = ref.replace(/^ref:\s*/, "");
            commit = (
              await readFile(join(process.cwd(), ".git", refPath), "utf8")
            ).trim();
          } else if (/^[0-9a-f]{7,40}$/i.test(ref)) {
            commit = ref;
          }
        } catch {
          // Optional local commit lookup.
        }
        return { ...parsed, commit, source: "package.json" };
      }
    }
  } catch {
    // Fall through to git config.
  }

  try {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const config = await readFile(
      join(process.cwd(), ".git", "config"),
      "utf8",
    );
    const origin = config.match(
      /\[remote "origin"\][\s\S]*?url\s*=\s*(.+)/,
    )?.[1]?.trim();
    if (origin) {
      const parsed = parseGithubRemote(origin);
      if (parsed) {
        let commit: string | null = null;
        try {
          const head = await readFile(join(process.cwd(), ".git", "HEAD"), "utf8");
          const ref = head.trim();
          if (ref.startsWith("ref:")) {
            const refPath = ref.replace(/^ref:\s*/, "");
            commit = (
              await readFile(join(process.cwd(), ".git", refPath), "utf8")
            ).trim();
          }
        } catch {
          // Optional.
        }
        return { ...parsed, commit, source: "git" };
      }
    }
  } catch {
    // No local git metadata available (e.g. slim deploy without .git).
  }

  return { owner: null, repo: null, commit: null, source: "none" };
}

async function resolveVercelProjectMeta(): Promise<{
  projectId: string | null;
  orgId: string | null;
  name: string | null;
  source: string;
}> {
  const envProjectId =
    process.env.VERCEL_PROJECT_ID || process.env.VERCEL_PROJECT_ID_SLUG || null;
  const envOrgId = process.env.VERCEL_ORG_ID || process.env.VERCEL_TEAM_ID || null;
  const envName =
    process.env.VERCEL_PROJECT_NAME ||
    process.env.VERCEL_GIT_REPO_SLUG ||
    null;

  if (envProjectId || envName) {
    return {
      projectId: envProjectId,
      orgId: envOrgId,
      name: envName,
      source: "env",
    };
  }

  try {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const raw = await readFile(
      join(process.cwd(), ".vercel", "project.json"),
      "utf8",
    );
    const linked = JSON.parse(raw) as {
      projectId?: string;
      orgId?: string;
      projectName?: string;
    };
    if (linked.projectId || linked.projectName) {
      return {
        projectId: linked.projectId ?? null,
        orgId: linked.orgId ?? null,
        name: linked.projectName ?? null,
        source: ".vercel/project.json",
      };
    }
  } catch {
    // Not linked locally.
  }

  return { projectId: null, orgId: null, name: null, source: "none" };
}

const probes: ApiStackProbe[] = [
  {
    id: "supabase",
    name: "Supabase",
    description: "Database, auth, and storage",
    docsUrl: "https://supabase.com/dashboard",
    logoUrl: "/images/integrations/supabase.svg",
    async check() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const configured = isSupabaseConfigured();
      const host = hostFromUrl(url);

      if (!configured) {
        return {
          light: "red",
          statusLabel: "Error",
          detail: "Supabase env vars are missing or still placeholders.",
          metrics: [
            { label: "URL", value: host ?? "Not set" },
            { label: "Anon key", value: anon ? "Present" : "Missing" },
            { label: "Service role", value: service ? "Present" : "Missing" },
          ],
          fixSteps: [
            "Set NEXT_PUBLIC_SUPABASE_URL to the project URL from Supabase → Settings → API.",
            "Set NEXT_PUBLIC_SUPABASE_ANON_KEY to the anon/public key.",
            "Set SUPABASE_SERVICE_ROLE_KEY to the service_role key (server only).",
            "Restart `npm run dev` and recheck this stack.",
          ],
        };
      }

      try {
        const started = Date.now();
        let latencyMs = 0;
        let queryError: string | null = null;

        if (service) {
          const { createServiceClient } = await import("@/lib/supabase/admin");
          const supabase = createServiceClient();
          const { error } = await supabase
            .from("site_settings")
            .select("key")
            .limit(1);
          latencyMs = Date.now() - started;
          if (error) queryError = error.message;
        } else {
          const { createClient } = await import("@/lib/supabase/server");
          const supabase = await createClient();
          const { error } = await supabase
            .from("site_settings")
            .select("key")
            .limit(1);
          latencyMs = Date.now() - started;
          if (error) queryError = error.message;
        }

        if (queryError) {
          return {
            light: "yellow",
            statusLabel: "Problem",
            detail: queryError,
            metrics: [
              { label: "Project", value: host ?? "—" },
              { label: "Latency", value: `${latencyMs} ms` },
              { label: "Service role", value: service ? "Present" : "Missing" },
            ],
          };
        }

        const degraded = !service || latencyMs > 1500;
        return {
          light: degraded ? "yellow" : "green",
          statusLabel: degraded ? "Problem" : "Active",
          detail: degraded
            ? !service
              ? "Reachable, but service role key is missing for admin writes."
              : "Reachable, but response latency is high."
            : "Database reachable and responding normally.",
          metrics: [
            { label: "Project", value: host ?? "—" },
            { label: "Latency", value: `${latencyMs} ms` },
            { label: "Service role", value: service ? "Present" : "Missing" },
          ],
        };
      } catch (err) {
        return {
          light: "red",
          statusLabel: "Error",
          detail:
            err instanceof Error
              ? err.message
              : "Could not create a Supabase client.",
          metrics: [
            { label: "Project", value: host ?? "—" },
            { label: "Anon key", value: anon ? "Present" : "Missing" },
            { label: "Service role", value: service ? "Present" : "Missing" },
          ],
        };
      }
    },
  },
  {
    id: "github",
    name: "GitHub",
    description: "Source control and deploy hooks",
    docsUrl: "https://github.com",
    logoUrl: "/images/integrations/github.svg",
    async check() {
      const token =
        process.env.GITHUB_TOKEN ||
        process.env.GH_TOKEN ||
        process.env.GITHUB_API_TOKEN;
      const meta = await resolveGithubRepoMeta();
      const owner = meta.owner;
      const repo = meta.repo;
      const commit = meta.commit;
      const repoLabel =
        owner && repo ? `${owner}/${repo}` : owner || repo || "Not linked";

      if (!token && !owner && !repo) {
        return {
          light: "red",
          statusLabel: "Error",
          detail: "No GitHub repo metadata or API token detected.",
          metrics: [
            { label: "Repo", value: "—" },
            { label: "Token", value: "Missing" },
            { label: "Commit", value: "—" },
          ],
          fixSteps: [
            "Set package.json repository to your GitHub URL, or set GITHUB_REPOSITORY=owner/repo.",
            "Connect the Vercel project to GitHub so VERCEL_GIT_* vars are injected on deploy.",
            "Optionally add GITHUB_TOKEN for authenticated API checks and higher rate limits.",
          ],
        };
      }

      try {
        const endpoint =
          owner && repo
            ? `https://api.github.com/repos/${owner}/${repo}`
            : "https://api.github.com/rate_limit";
        const headerMap: Record<string, string> = {
          Accept: "application/vnd.github+json",
          "User-Agent": "titan-safety-admin-status",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
        const response = await githubApiGet(endpoint, headerMap);
        const remaining = response.remaining;
        const limit = response.limit;

        if (!response.ok) {
          return {
            light: response.status === 404 ? "red" : "yellow",
            statusLabel: response.status === 404 ? "Error" : "Problem",
            detail:
              response.status === 404
                ? `GitHub repo ${repoLabel} was not found (private without token, or wrong slug).`
                : `GitHub API responded with ${response.status}.`,
            metrics: [
              { label: "Repo", value: repoLabel },
              { label: "Token", value: token ? maskTail(token) : "Missing" },
              { label: "Latency", value: `${response.latencyMs} ms` },
            ],
            fixSteps: [
              token
                ? "Verify GITHUB_TOKEN can read this repository."
                : "Add GITHUB_TOKEN if the repository is private.",
              "Confirm GITHUB_REPOSITORY / package.json repository matches owner/repo.",
              "Recheck this stack after credentials are updated.",
            ],
          };
        }

        const body = response.json as {
          private?: boolean;
          default_branch?: string;
          rate?: { remaining?: number; limit?: number };
        } | null;

        const authLabel = token ? "Authenticated" : "Public";
        return {
          light: "green",
          statusLabel: "Active",
          detail: token
            ? "GitHub API authenticated and repository reachable."
            : `GitHub repository ${repoLabel} reachable via public API (${meta.source}).`,
          metrics: [
            { label: "Repo", value: repoLabel },
            {
              label: token ? "Rate limit" : "Access",
              value: token
                ? remaining && limit
                  ? `${remaining}/${limit}`
                  : body?.rate?.remaining != null && body?.rate?.limit != null
                    ? `${body.rate.remaining}/${body.rate.limit}`
                    : "Available"
                : authLabel,
            },
            {
              label: "Commit",
              value: commit ? commit.slice(0, 7) : "—",
            },
          ],
        };
      } catch (err) {
        return {
          light: "yellow",
          statusLabel: "Problem",
          detail:
            err instanceof Error ? err.message : "GitHub API probe failed.",
          metrics: [
            { label: "Repo", value: repoLabel },
            { label: "Token", value: token ? maskTail(token) : "Missing" },
            { label: "Commit", value: commit ? commit.slice(0, 7) : "—" },
          ],
          fixSteps: [
            "Check network access to api.github.com from this runtime.",
            "Retry after connectivity is restored.",
          ],
        };
      }
    },
  },
  {
    id: "vercel",
    name: "Vercel",
    description: "Hosting, previews, and production deploys",
    docsUrl: "https://vercel.com/dashboard",
    logoUrl: "/images/integrations/vercel.svg",
    async check() {
      const onVercel = process.env.VERCEL === "1";
      const env = process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV;
      const url =
        process.env.VERCEL_URL ||
        process.env.NEXT_PUBLIC_VERCEL_URL ||
        process.env.VERCEL_PROJECT_PRODUCTION_URL ||
        process.env.NEXT_PUBLIC_SITE_URL;
      const region = process.env.VERCEL_REGION;
      const token = process.env.VERCEL_TOKEN || process.env.VERCEL_API_TOKEN;
      const project = await resolveVercelProjectMeta();
      const projectLabel = project.name || project.projectId || "—";
      const runtimeLabel = onVercel ? "Vercel" : "Local";

      if (token) {
        try {
          const started = Date.now();
          const endpoint =
            project.projectId != null
              ? `https://api.vercel.com/v9/projects/${encodeURIComponent(project.projectId)}${
                  project.orgId
                    ? `?teamId=${encodeURIComponent(project.orgId)}`
                    : ""
                }`
              : "https://api.vercel.com/v2/user";
          const response = await fetch(endpoint, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
            signal: AbortSignal.timeout(5000),
          });
          const latencyMs = Date.now() - started;
          if (!response.ok) {
            return {
              light: "yellow",
              statusLabel: "Problem",
              detail: `Vercel API responded with ${response.status}.`,
              metrics: [
                { label: "Project", value: projectLabel },
                { label: "Runtime", value: runtimeLabel },
                { label: "Latency", value: `${latencyMs} ms` },
              ],
              fixSteps: [
                "Verify VERCEL_TOKEN has access to this Vercel team/project.",
                "Confirm `.vercel/project.json` matches the intended project (`vercel link`).",
                "Recheck this stack after credentials are updated.",
              ],
            };
          }

          const body = (await response.json().catch(() => null)) as {
            name?: string;
            accountId?: string;
            targets?: { production?: { alias?: string[] } };
            user?: { username?: string };
          } | null;
          const resolvedName = body?.name || project.name || projectLabel;
          const productionAlias =
            body?.targets?.production?.alias?.[0] ||
            process.env.VERCEL_PROJECT_PRODUCTION_URL ||
            null;

          return {
            light: "green",
            statusLabel: "Active",
            detail: project.projectId
              ? `Vercel project ${resolvedName} reachable via API (${project.source}).`
              : "Vercel API authenticated.",
            metrics: [
              { label: "Project", value: resolvedName },
              {
                label: "Env",
                value: env ?? (onVercel ? "vercel" : "local"),
              },
              {
                label: "Host",
                value:
                  hostFromUrl(productionAlias ?? undefined) ||
                  hostFromUrl(url) ||
                  "—",
              },
            ],
          };
        } catch (err) {
          return {
            light: onVercel ? "yellow" : "red",
            statusLabel: onVercel ? "Problem" : "Error",
            detail:
              err instanceof Error
                ? err.message
                : "Vercel API probe failed.",
            metrics: [
              { label: "Project", value: projectLabel },
              { label: "Runtime", value: runtimeLabel },
              { label: "Host", value: hostFromUrl(url) ?? "—" },
            ],
            fixSteps: [
              "Check network access to api.vercel.com from this runtime.",
              "Retry after connectivity is restored.",
            ],
          };
        }
      }

      // Local / no token: prove the configured production deployment is live.
      const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || null;

      if (!onVercel && productionUrl) {
        try {
          const started = Date.now();
          const response = await fetch(productionUrl, {
            method: "HEAD",
            redirect: "follow",
            cache: "no-store",
            signal: AbortSignal.timeout(5000),
          });
          const latencyMs = Date.now() - started;
          const vercelId = response.headers.get("x-vercel-id");
          const server = response.headers.get("server");
          const isVercelHost =
            Boolean(vercelId) ||
            (server != null && /vercel/i.test(server));

          if (response.ok && isVercelHost) {
            return {
              light: "green",
              statusLabel: "Active",
              detail: `Production deployment reachable at ${hostFromUrl(productionUrl)} (${project.source || "url"}).`,
              metrics: [
                { label: "Project", value: projectLabel },
                { label: "Runtime", value: "Local" },
                { label: "Latency", value: `${latencyMs} ms` },
              ],
            };
          }

          return {
            light: "yellow",
            statusLabel: "Problem",
            detail: isVercelHost
              ? `Production URL responded with ${response.status}.`
              : "Production URL did not look like a Vercel deployment.",
            metrics: [
              { label: "Project", value: projectLabel },
              { label: "Host", value: hostFromUrl(productionUrl) ?? "—" },
              { label: "Latency", value: `${latencyMs} ms` },
            ],
            fixSteps: [
              "Confirm the production deployment is Ready in the Vercel dashboard.",
              "Set VERCEL_PROJECT_PRODUCTION_URL to your production alias if it differs from {project}.vercel.app.",
              "Optionally add VERCEL_TOKEN for authenticated project API checks.",
            ],
          };
        } catch (err) {
          return {
            light: "yellow",
            statusLabel: "Problem",
            detail:
              err instanceof Error
                ? err.message
                : "Could not reach the Vercel production URL.",
            metrics: [
              { label: "Project", value: projectLabel },
              { label: "Host", value: hostFromUrl(productionUrl) ?? "—" },
              { label: "Token", value: "Missing" },
            ],
            fixSteps: [
              "Add VERCEL_TOKEN for API-level health checks while developing locally.",
              "Set VERCEL_PROJECT_PRODUCTION_URL to your production deployment URL.",
              "Confirm network access to the production host.",
            ],
          };
        }
      }

      if (onVercel || env) {
        return {
          light: "green",
          statusLabel: "Active",
          detail:
            "Running on Vercel. Add VERCEL_TOKEN for API-level status checks.",
          metrics: [
            { label: "Project", value: projectLabel },
            { label: "Env", value: env ?? "vercel" },
            { label: "Host", value: hostFromUrl(url) ?? "—" },
          ],
        };
      }

      return {
        light: "yellow",
        statusLabel: "Problem",
        detail: project.projectId
          ? `Linked to ${projectLabel}, but no Vercel token or production URL check is available.`
          : "Running locally — not connected to a Vercel deployment runtime.",
        metrics: [
          { label: "Runtime", value: "Local" },
          { label: "Project", value: projectLabel },
          { label: "URL", value: hostFromUrl(url) ?? "localhost" },
        ],
        fixSteps: [
          "Deploy or link this project with the Vercel CLI (`vercel link`).",
          "Add VERCEL_TOKEN for API-level health checks while developing locally.",
          "Optionally set VERCEL_PROJECT_PRODUCTION_URL to your production alias.",
        ],
      };
    },
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Payments and checkout webhooks",
    docsUrl: "https://dashboard.stripe.com",
    logoUrl: "/images/integrations/stripe.svg",
    async check() {
      const {
        isValidStripePublishableKey,
        isValidStripeSecretKey,
        isValidStripeWebhookSecret,
      } = await import("@/lib/stripe");

      const secretRaw = process.env.STRIPE_SECRET_KEY?.trim() || "";
      const webhookRaw = process.env.STRIPE_WEBHOOK_SECRET?.trim() || "";
      const publishableRaw = (
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
        process.env.STRIPE_PUBLISHABLE_KEY ||
        ""
      ).trim();

      const secretOk = isValidStripeSecretKey(secretRaw);
      const publishableOk = isValidStripePublishableKey(publishableRaw);
      const webhookOk = isValidStripeWebhookSecret(webhookRaw);

      if (!secretOk) {
        const hadPlaceholder =
          Boolean(secretRaw) &&
          (/\.\.\./.test(secretRaw) || secretRaw.length < 20);
        return {
          light: "red",
          statusLabel: "Error",
          detail: hadPlaceholder
            ? "Stripe secret key is still a placeholder (e.g. sk_test_...). Replace it with a real test key."
            : "Stripe secret key is not configured.",
          metrics: [
            {
              label: "Secret",
              value: hadPlaceholder ? "Placeholder" : "Missing",
            },
            {
              label: "Publishable",
              value: publishableOk
                ? "Present"
                : publishableRaw
                  ? "Placeholder"
                  : "Missing",
            },
            {
              label: "Webhook",
              value: webhookOk
                ? "Present"
                : webhookRaw
                  ? "Placeholder"
                  : "Missing",
            },
          ],
          fixSteps: [
            "Open https://dashboard.stripe.com/test/apikeys and copy the Secret key (sk_test_…).",
            "Set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env.local (not the sk_test_... placeholders).",
            "Add STRIPE_WEBHOOK_SECRET from Stripe CLI (`stripe listen`) or Dashboard → Webhooks.",
            "Restart the server and recheck Stripe.",
          ],
        };
      }

      try {
        const started = Date.now();
        const response = await fetch("https://api.stripe.com/v1/balance", {
          headers: { Authorization: `Bearer ${secretRaw}` },
          cache: "no-store",
          signal: AbortSignal.timeout(5000),
        });
        const latencyMs = Date.now() - started;
        const mode = secretRaw.startsWith("sk_live") ? "Live" : "Test";

        if (!response.ok) {
          const errBody = (await response.json().catch(() => null)) as {
            error?: { code?: string; message?: string };
          } | null;
          const errCode = errBody?.error?.code;
          return {
            light: response.status === 401 ? "red" : "yellow",
            statusLabel: response.status === 401 ? "Error" : "Problem",
            detail:
              response.status === 401
                ? `Stripe rejected the secret key${errCode ? ` (${errCode})` : ""}. Replace STRIPE_SECRET_KEY with a valid key from the Dashboard.`
                : `Stripe API responded with ${response.status}${errCode ? ` (${errCode})` : ""}.`,
            metrics: [
              { label: "Mode", value: mode },
              { label: "Latency", value: `${latencyMs} ms` },
              {
                label: "Webhook",
                value: webhookOk
                  ? "Present"
                  : webhookRaw
                    ? "Placeholder"
                    : "Missing",
              },
            ],
            fixSteps: [
              "Confirm STRIPE_SECRET_KEY matches Dashboard → Developers → API keys (test vs live).",
              "Rotate the secret key if it was revoked or copied incompletely.",
              "Restart the app so process.env picks up the new value, then Recheck.",
            ],
          };
        }

        const degraded = !webhookOk || !publishableOk;
        return {
          light: degraded ? "yellow" : "green",
          statusLabel: degraded ? "Problem" : "Active",
          detail: degraded
            ? "Stripe API is healthy, but publishable key or webhook secret is missing/placeholder."
            : "Stripe API authenticated and balance endpoint reachable.",
          metrics: [
            { label: "Mode", value: mode },
            { label: "Latency", value: `${latencyMs} ms` },
            {
              label: "Webhook",
              value: webhookOk
                ? "Present"
                : webhookRaw
                  ? "Placeholder"
                  : "Missing",
            },
          ],
          fixSteps: degraded
            ? ([
                !publishableOk
                  ? "Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to the matching pk_test_… key."
                  : null,
                !webhookOk
                  ? "Set STRIPE_WEBHOOK_SECRET (whsec_…) for /api/webhooks/stripe."
                  : null,
                "Restart and recheck Stripe.",
              ].filter(Boolean) as string[])
            : undefined,
        };
      } catch (err) {
        return {
          light: "red",
          statusLabel: "Error",
          detail:
            err instanceof Error ? err.message : "Stripe API probe failed.",
          metrics: [
            {
              label: "Mode",
              value: secretRaw.startsWith("sk_live") ? "Live" : "Test",
            },
            {
              label: "Publishable",
              value: publishableOk ? "Present" : "Missing",
            },
            {
              label: "Webhook",
              value: webhookOk ? "Present" : "Missing",
            },
          ],
          fixSteps: [
            "Check network access to api.stripe.com from this runtime.",
            "Retry after connectivity is restored.",
          ],
        };
      }
    },
  },
  {
    id: "shipengine",
    name: "ShipEngine",
    description: "Carrier rates and shipping labels",
    docsUrl: "https://www.shipengine.com/docs/",
    logoUrl: "/images/integrations/shipengine.svg",
    async check() {
      const {
        isShipEngineDirectConfigured,
        getConfiguredCarrierIds,
      } = await import("@/lib/shipengine/config");
      const apiKey = process.env.SHIPENGINE_API_KEY?.trim() || "";
      const pinnedCarriers = getConfiguredCarrierIds();
      const supabaseReady = Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
      );

      if (!isShipEngineDirectConfigured()) {
        return {
          light: "red",
          statusLabel: "Error",
          detail: supabaseReady
            ? "SHIPENGINE_API_KEY is missing for direct probes. Edge function path may still work if the key is in Supabase secrets."
            : "ShipEngine API key is not configured.",
          metrics: [
            { label: "API key", value: "Missing" },
            {
              label: "Path",
              value: supabaseReady ? "Edge only" : "None",
            },
            {
              label: "Carriers",
              value: pinnedCarriers.length
                ? `${pinnedCarriers.length} pinned`
                : "Auto",
            },
          ],
          fixSteps: [
            "Create an API key in ShipEngine / ShipStation → API management.",
            "Set SHIPENGINE_API_KEY in .env.local (and Vercel env) or `supabase secrets set SHIPENGINE_API_KEY=…`.",
            "Optionally set SHIPENGINE_CARRIER_IDS to pin rate-shopping accounts.",
            "Restart the server and recheck this stack.",
          ],
        };
      }

      try {
        const started = Date.now();
        const response = await fetch(
          "https://api.shipengine.com/v1/carriers",
          {
            headers: {
              "API-Key": apiKey,
              Accept: "application/json",
            },
            cache: "no-store",
            signal: AbortSignal.timeout(6000),
          },
        );
        const latencyMs = Date.now() - started;
        const body = (await response.json().catch(() => null)) as {
          carriers?: unknown[];
          message?: string;
          errors?: Array<{ message?: string }>;
        } | null;
        const carrierCount = Array.isArray(body?.carriers)
          ? body.carriers.length
          : null;

        if (!response.ok) {
          const errMsg =
            body?.errors?.[0]?.message ||
            body?.message ||
            `ShipEngine responded with ${response.status}.`;
          return {
            light: response.status === 401 ? "red" : "yellow",
            statusLabel: response.status === 401 ? "Error" : "Problem",
            detail: errMsg,
            metrics: [
              { label: "API key", value: maskTail(apiKey) },
              { label: "Latency", value: `${latencyMs} ms` },
              {
                label: "Carriers",
                value: pinnedCarriers.length
                  ? `${pinnedCarriers.length} pinned`
                  : "—",
              },
            ],
            fixSteps: [
              "Confirm SHIPENGINE_API_KEY is a valid production/sandbox key.",
              "Rotate the key in ShipEngine if it was revoked or copied incompletely.",
              "Restart the app and recheck.",
            ],
          };
        }

        const degraded =
          carrierCount === 0 ||
          (pinnedCarriers.length > 0 &&
            carrierCount != null &&
            carrierCount < pinnedCarriers.length);

        return {
          light: degraded ? "yellow" : "green",
          statusLabel: degraded ? "Problem" : "Active",
          detail: degraded
            ? carrierCount === 0
              ? "Authenticated, but no carriers are connected in ShipEngine."
              : "Authenticated, but fewer carriers returned than SHIPENGINE_CARRIER_IDS."
            : "ShipEngine API authenticated and carriers reachable.",
          metrics: [
            { label: "API key", value: maskTail(apiKey) },
            { label: "Latency", value: `${latencyMs} ms` },
            {
              label: "Carriers",
              value:
                carrierCount != null
                  ? pinnedCarriers.length
                    ? `${carrierCount} · ${pinnedCarriers.length} pinned`
                    : String(carrierCount)
                  : pinnedCarriers.length
                    ? `${pinnedCarriers.length} pinned`
                    : "—",
            },
          ],
          fixSteps: degraded
            ? [
                "Connect UPS / USPS / FedEx (or other) accounts in the ShipEngine dashboard.",
                "Update SHIPENGINE_CARRIER_IDS to match active carrier_id values.",
                "Recheck this stack after carriers are linked.",
              ]
            : undefined,
        };
      } catch (err) {
        return {
          light: "red",
          statusLabel: "Error",
          detail:
            err instanceof Error
              ? err.message
              : "ShipEngine API probe failed.",
          metrics: [
            { label: "API key", value: maskTail(apiKey) },
            { label: "Host", value: "api.shipengine.com" },
            {
              label: "Carriers",
              value: pinnedCarriers.length
                ? `${pinnedCarriers.length} pinned`
                : "Auto",
            },
          ],
          fixSteps: [
            "Check network access to api.shipengine.com from this runtime.",
            "Retry after connectivity is restored.",
          ],
        };
      }
    },
  },
  {
    id: "google-places",
    name: "Google Places",
    description: "Maps / Places address autocomplete",
    docsUrl: "https://console.cloud.google.com/google/maps-apis",
    logoUrl: "/images/integrations/google-maps.svg",
    async check() {
      const {
        getGooglePlacesApiKey,
        isGooglePlacesConfigured,
      } = await import("@/lib/google/places");
      const apiKey = getGooglePlacesApiKey();
      const keySource = process.env.GOOGLE_PLACES_API_KEY?.trim()
        ? "GOOGLE_PLACES_API_KEY"
        : process.env.GOOGLE_MAPS_API_KEY?.trim()
          ? "GOOGLE_MAPS_API_KEY"
          : process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim()
            ? "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"
            : "—";

      if (!isGooglePlacesConfigured()) {
        return {
          light: "red",
          statusLabel: "Error",
          detail: "Google Places / Maps API key is not configured.",
          metrics: [
            { label: "API key", value: "Missing" },
            { label: "Source", value: "—" },
            { label: "API", value: "Places (New)" },
          ],
          fixSteps: [
            "Enable Places API (New) in Google Cloud Console.",
            "Create an API key restricted to Places Autocomplete + Place Details.",
            "Set GOOGLE_PLACES_API_KEY (preferred) or GOOGLE_MAPS_API_KEY in .env.local / Vercel.",
            "Restart the server and recheck this stack.",
          ],
        };
      }

      try {
        const started = Date.now();
        const response = await fetch(
          "https://places.googleapis.com/v1/places:autocomplete",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": apiKey,
            },
            body: JSON.stringify({
              input: "Houston TX",
              includedRegionCodes: ["us"],
            }),
            cache: "no-store",
            signal: AbortSignal.timeout(6000),
          },
        );
        const latencyMs = Date.now() - started;
        const body = (await response.json().catch(() => null)) as {
          suggestions?: unknown[];
          error?: { message?: string; status?: string };
        } | null;
        const suggestionCount = Array.isArray(body?.suggestions)
          ? body.suggestions.length
          : 0;

        if (!response.ok) {
          const errMsg =
            body?.error?.message ||
            `Places API responded with ${response.status}.`;
          const unauthorized = response.status === 401 || response.status === 403;
          return {
            light: unauthorized ? "red" : "yellow",
            statusLabel: unauthorized ? "Error" : "Problem",
            detail: errMsg,
            metrics: [
              { label: "API key", value: maskTail(apiKey) },
              { label: "Source", value: keySource },
              { label: "Latency", value: `${latencyMs} ms` },
            ],
            fixSteps: [
              "Confirm Places API (New) is enabled for this Google Cloud project.",
              "Check API key restrictions (HTTP referrers / IP / API allowlist).",
              "Billing must be enabled on the Google Cloud project.",
              "Restart and recheck after updating the key.",
            ],
          };
        }

        return {
          light: suggestionCount > 0 ? "green" : "yellow",
          statusLabel: suggestionCount > 0 ? "Active" : "Problem",
          detail:
            suggestionCount > 0
              ? "Places Autocomplete authenticated and returning suggestions."
              : "Places Autocomplete reachable, but the probe query returned no suggestions.",
          metrics: [
            { label: "API key", value: maskTail(apiKey) },
            { label: "Source", value: keySource },
            { label: "Latency", value: `${latencyMs} ms` },
          ],
          fixSteps:
            suggestionCount > 0
              ? undefined
              : [
                  "Verify Places API (New) quota and region settings.",
                  "Try the admin ship-to address search and watch for client errors.",
                ],
        };
      } catch (err) {
        return {
          light: "red",
          statusLabel: "Error",
          detail:
            err instanceof Error
              ? err.message
              : "Google Places API probe failed.",
          metrics: [
            { label: "API key", value: maskTail(apiKey) },
            { label: "Source", value: keySource },
            { label: "Host", value: "places.googleapis.com" },
          ],
          fixSteps: [
            "Check network access to places.googleapis.com from this runtime.",
            "Retry after connectivity is restored.",
          ],
        };
      }
    },
  },
];

/** Register another stack probe — new stacks automatically appear in the card. */
export function registerApiStackProbe(probe: ApiStackProbe) {
  const index = probes.findIndex((item) => item.id === probe.id);
  if (index >= 0) probes[index] = probe;
  else probes.push(probe);
}

export const API_STACK_STICKY_KEY = "api_stack_lights";

type StickyLights = Record<
  string,
  { light: ApiStackLight; detail: string; updatedAt: string }
>;

let demoStickyLights: StickyLights = {};

async function readStickyLights(): Promise<StickyLights> {
  if (!isSupabaseConfigured()) return { ...demoStickyLights };

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", API_STACK_STICKY_KEY)
      .maybeSingle();
    const value = data?.value as StickyLights | null;
    return value && typeof value === "object" ? value : {};
  } catch {
    return { ...demoStickyLights };
  }
}

async function writeStickyLights(next: StickyLights): Promise<void> {
  demoStickyLights = { ...next };

  if (!isSupabaseConfigured()) return;

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    await supabase.from("site_settings").upsert(
      { key: API_STACK_STICKY_KEY, value: next },
      { onConflict: "key" },
    );
  } catch {
    // Sticky persistence is best-effort; probes still return live data.
  }
}

export async function getApiStackReports(): Promise<{
  checkedAt: string;
  stacks: ApiStackReport[];
  summary: { green: number; yellow: number; red: number; total: number };
}> {
  const now = new Date();
  const sticky = await readStickyLights();
  const nextSticky: StickyLights = { ...sticky };

  const stacks = await Promise.all(
    probes.map(async (probe) => {
      const result = await probe.check({ now });
      const probedLight = result.light;
      const stickyLight = resolveStickyLight(
        sticky[probe.id]?.light,
        probedLight,
      );

      nextSticky[probe.id] = {
        light: stickyLight,
        detail: result.detail,
        updatedAt: now.toISOString(),
      };

      const lightChanged = sticky[probe.id]?.light !== stickyLight;
      const detail =
        stickyLight !== probedLight && probedLight === "green"
          ? result.detail
          : stickyLight !== probedLight
            ? `${result.detail} Traffic light stays ${API_STACK_STATUS_LABEL[stickyLight].toLowerCase()} until a healthy probe confirms resolution.`
            : result.detail;

      return {
        id: probe.id,
        name: probe.name,
        description: probe.description,
        docsUrl: probe.docsUrl,
        logoUrl: probe.logoUrl,
        ...result,
        light: stickyLight,
        probedLight,
        statusLabel: API_STACK_STATUS_LABEL[stickyLight],
        detail,
        // Only surface agent fix steps while sticky light is not healthy,
        // or when the light just changed and still needs attention.
        fixSteps:
          stickyLight === "green"
            ? undefined
            : result.fixSteps ??
              (lightChanged
                ? undefined
                : [
                    `Investigate ${probe.name} configuration and connectivity.`,
                    "Recheck this stack after applying the fix.",
                  ]),
      } satisfies ApiStackReport;
    }),
  );

  await writeStickyLights(nextSticky);

  const summary = {
    green: stacks.filter((s) => s.light === "green").length,
    yellow: stacks.filter((s) => s.light === "yellow").length,
    red: stacks.filter((s) => s.light === "red").length,
    total: stacks.length,
  };

  return {
    checkedAt: now.toISOString(),
    stacks,
    summary,
  };
}

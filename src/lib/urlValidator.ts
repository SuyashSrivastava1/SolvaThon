/**
 * URL Validation & SSRF Prevention Utility (MED-01)
 * Enforces strict domain allowlists and blocks internal network targets, metadata endpoints, and non-HTTPS protocols.
 */

const ALLOWED_PRESENTATION_DOMAINS = [
  "docs.google.com",
  "drive.google.com",
  "slides.google.com",
  "canva.com",
  "notion.so",
  "notion.site",
  "onedrive.live.com",
  "1drv.ms",
];

const ALLOWED_PROJECT_DOMAINS = [
  "github.com",
  "gitlab.com",
  "bitbucket.org",
  "docs.google.com",
  "drive.google.com",
  "notion.so",
  "notion.site",
  "youtube.com",
  "youtu.be",
  "loom.com",
  "vimeo.com",
  "vercel.app",
  "netlify.app",
  "pages.dev",
  "firebaseapp.com",
  "web.app",
  "github.io",
  "render.com",
  "canva.com",
];

const FORBIDDEN_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0/,
  /^169\.254\./, // AWS / Cloud metadata endpoint
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^::1$/,
  /\.internal$/i,
  /\.local$/i,
];

function isForbiddenHost(hostname: string): boolean {
  return FORBIDDEN_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
}

function matchesDomainList(hostname: string, domainList: string[]): boolean {
  const host = hostname.toLowerCase();
  return domainList.some((d) => host === d || host.endsWith("." + d));
}

/**
 * Validates participant presentation submission URLs (Google Slides, Canva, Drive, etc.)
 */
export function validatePresentationUrl(urlStr?: string | null): { valid: boolean; error?: string } {
  if (!urlStr || typeof urlStr !== "string") {
    return { valid: false, error: "Presentation link is required." };
  }

  const trimmed = urlStr.trim();

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: "Please enter a valid URL." };
  }

  if (parsed.protocol !== "https:") {
    return { valid: false, error: "Only secure HTTPS URLs are permitted (https://)." };
  }

  if (isForbiddenHost(parsed.hostname)) {
    return { valid: false, error: "Submission contains an invalid or restricted host." };
  }

  if (!matchesDomainList(parsed.hostname, ALLOWED_PRESENTATION_DOMAINS)) {
    return {
      valid: false,
      error:
        "Please provide a link from an approved platform: Google Slides/Drive, Canva, or Notion.",
    };
  }

  return { valid: true };
}

/**
 * Validates participant final project deliverable URLs (Repo, Docs, Demo, Deployment)
 */
export function validateDeliverableUrl(
  urlStr?: string | null,
  fieldName: string = "Deliverable"
): { valid: boolean; error?: string } {
  if (!urlStr || typeof urlStr !== "string") {
    return { valid: false, error: `${fieldName} URL is required.` };
  }

  const trimmed = urlStr.trim();

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: `Please enter a valid ${fieldName} URL.` };
  }

  if (parsed.protocol !== "https:") {
    return { valid: false, error: "Only secure HTTPS URLs are permitted (https://)." };
  }

  if (isForbiddenHost(parsed.hostname)) {
    return { valid: false, error: "Submission contains an invalid or restricted host." };
  }

  if (!matchesDomainList(parsed.hostname, ALLOWED_PROJECT_DOMAINS)) {
    return {
      valid: false,
      error: `${fieldName} link must be hosted on an approved platform (e.g. GitHub, GitLab, Google Drive, Notion, YouTube, Loom, Vercel, Netlify).`,
    };
  }

  return { valid: true };
}

/**
 * Protected Admin Configuration & Role-Based Access Control
 * 
 * Admin and Super Admin emails are loaded strictly from server-side environment variables (.env)
 * to prevent hardcoding sensitive credentials or exposing them in the client bundle.
 */

function parseEmailList(rawList?: string): string[] {
  if (!rawList) return [];
  return rawList
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => Boolean(e) && (e.endsWith("@vitstudent.ac.in") || e.endsWith("@vit.ac.in")));
}

/**
 * Retrieves the list of Super Admin emails strictly from server environment variables (.env).
 */
export function getSuperAdminEmails(): string[] {
  const envEmails = process.env.SUPER_ADMIN_EMAILS || "";
  return parseEmailList(envEmails);
}

/**
 * Retrieves the list of all Admin emails (Super Admin + Evaluators) strictly from server environment variables (.env).
 */
export function getAdminEmails(): string[] {
  const envEmails = process.env.ADMIN_EMAILS || "";
  const admins = parseEmailList(envEmails);
  const superAdmins = getSuperAdminEmails();
  return Array.from(new Set([...admins, ...superAdmins]));
}

/**
 * Checks if the email belongs to the Super Admin (configured in .env)
 */
export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const superAdmins = getSuperAdminEmails();
  return superAdmins.includes(normalized);
}

/**
 * Checks if the email has admin privileges (Super Admin or Evaluator, configured in .env)
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const admins = getAdminEmails();
  return admins.includes(normalized);
}

/**
 * Validates domain allowance:
 * - Only @vitstudent.ac.in and @vit.ac.in are allowed.
 */
export function isValidAuthDomain(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return normalized.endsWith("@vitstudent.ac.in") || normalized.endsWith("@vit.ac.in");
}

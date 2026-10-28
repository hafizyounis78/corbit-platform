/**
 * الصفحات التي لا تتبّع فيها ولا شريط موافقة: صفحات المطوّرين والسياسات القانونية
 * ورمز التحقق وتغيير كلمة المرور. التتبّع لزوار الإعلانات والتسجيل ولوحة العميل.
 */
const UNTRACKED_PREFIXES = ["/developers", "/privacy", "/terms", "/dpa", "/auth"];

export function isTrackedPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return !UNTRACKED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

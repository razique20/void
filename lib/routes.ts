/**
 * Routes that render without the workspace shell (sidebar + top bar).
 *
 * Shared by the Navbar and the pre-paint script in app/layout.tsx so both
 * agree on every path. Prefix entries cover nested routes such as Clerk's
 * /sign-in/factor-one or /sign-up/verify-email-address.
 */
export const PUBLIC_EXACT_PATHS = [
  '/',
  '/privacy',
  '/terms',
  '/dpa',
  '/docs',
  '/about',
  '/careers',
  '/contact',
  '/partners',
  '/changelog',
  '/pricing',
];

export const PUBLIC_PATH_PREFIXES = ['/sign-in', '/sign-up', '/share'];

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT_PATHS.includes(pathname)) return true;
  return PUBLIC_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

/** Same rule as isPublicPath, serialised for the inline <head> script. */
export const isPublicPathSource = `function(p){var e=${JSON.stringify(PUBLIC_EXACT_PATHS)};var x=${JSON.stringify(
  PUBLIC_PATH_PREFIXES
)};if(e.indexOf(p)!==-1)return true;for(var i=0;i<x.length;i++){if(p===x[i]||p.indexOf(x[i]+'/')===0)return true}return false}`;

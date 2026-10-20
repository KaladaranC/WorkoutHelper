// The URL prefix the site is served under: "" on Vercel or a custom domain,
// "/<repo>" on GitHub Pages. Next adds it to <Link> and router navigation on
// its own, but plain fetches (the pose model, its WASM) need it added by hand.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

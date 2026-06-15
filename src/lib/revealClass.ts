/** Reveal animation classes; pass ready=true when content is loaded and should show immediately. */
export function revealClass(ready = false): string {
  return ready ? "reveal is-visible" : "reveal";
}

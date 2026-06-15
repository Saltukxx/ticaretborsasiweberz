/**
 * Load https://developers.google.com/youtube/iframe_api_reference exactly once,
 * chaining any existing window.onYouTubeIframeAPIReady handlers.
 */

let iframeApiPromise: Promise<void> | null = null;

export function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube iframe API requires a browser"));
  }

  if (window.YT?.Player) return Promise.resolve();

  if (!iframeApiPromise) {
    iframeApiPromise = new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        try {
          prev?.();
        } finally {
          resolve();
        }
      };

      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        tag.async = true;
        const firstScript = document.getElementsByTagName("script")[0];
        firstScript?.parentNode?.insertBefore(tag, firstScript);
      }
    });
  }

  return iframeApiPromise;
}

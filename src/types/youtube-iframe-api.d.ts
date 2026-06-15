/**
 * Minimal typings for apps using the legacy YouTube IFrame API from
 * https://www.youtube.com/iframe_api — extend as needed.
 */
export {};

declare global {
  namespace YT {
    interface OnReadyEvent {
      target: Player;
    }

    interface OnStateChangeEvent {
      data: number;
      target: Player;
    }

    interface PlayerOptions {
      width?: number | string;
      height?: number | string;
      videoId?: string;
      playerVars?: Record<string, string | number | undefined>;
      events?: {
        onReady?: (event: OnReadyEvent) => void;
        onStateChange?: (event: OnStateChangeEvent) => void;
      };
    }

    /** Controls an embedded or existing iframe player loaded via iframe_api.js */
    class Player {
      constructor(element: HTMLElement, options?: PlayerOptions);
      destroy(): void;
      seekTo(seconds: number, allowSeekAhead?: boolean): void;
      cueVideoById(
        videoIdOrOptions: string | { videoId: string; startSeconds?: number; endSeconds?: number },
        startSeconds?: number
      ): void;
      loadVideoById(
        videoIdOrOptions: string | { videoId: string; startSeconds?: number; endSeconds?: number },
        startSeconds?: number
      ): void;
      playVideo(): void;
      pauseVideo(): void;
      setSize(width: number, height: number): void;
    }
  }

  interface Window {
    YT?: {
      Player: typeof YT.Player;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

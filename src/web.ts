import { WebPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';
import '@mux/mux-player';

import type { MuxPlayOptions, MuxPlayerEvents, MuxPlayerPlugin } from './definitions';

type MuxPlayerElement = HTMLElement & {
  playbackId?: string;
  playbackToken?: string;
  drmToken?: string;
  currentTime?: number;
  muted?: boolean;
  loop?: boolean;
  pause?: () => void;
  play?: () => Promise<void>;
};

export class MuxPlayerWeb extends WebPlugin implements MuxPlayerPlugin {
  private container?: HTMLDivElement;
  private player?: MuxPlayerElement;
  private closeButton?: HTMLButtonElement;
  private lastPlayerName?: string;
  private overlayCloseHandler = () => this.dismiss();

  constructor() {
    super();
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  addListener<E extends keyof MuxPlayerEvents>(
    eventName: E,
    listenerFunc: (event: MuxPlayerEvents[E]) => void,
  ): Promise<PluginListenerHandle> & PluginListenerHandle {
    return super.addListener(eventName, listenerFunc) as unknown as Promise<PluginListenerHandle> &
      PluginListenerHandle;
  }

  async play(options: MuxPlayOptions): Promise<void> {
    const resolved = { autoPlay: true, muted: false, ...options };

    this.ensureOverlay();

    const player = this.player!;

    player.setAttribute('playback-id', resolved.playbackId);

    if (resolved.playbackToken) {
      player.setAttribute('playback-token', resolved.playbackToken);
    } else {
      player.removeAttribute('playback-token');
    }

    if (resolved.drmToken) {
      player.setAttribute('drm-token', resolved.drmToken);
    } else {
      player.removeAttribute('drm-token');
    }

    if (resolved.customDomain) {
      player.setAttribute('custom-domain', resolved.customDomain);
    } else {
      player.removeAttribute('custom-domain');
    }

    if (resolved.playerName) {
      player.setAttribute('player-name', resolved.playerName);
    } else {
      player.removeAttribute('player-name');
    }

    this.lastPlayerName = resolved.playerName;

    if (resolved.poster) {
      player.setAttribute('poster', resolved.poster);
    } else {
      player.removeAttribute('poster');
    }

    if (resolved.title) {
      player.setAttribute('metadata-video-title', resolved.title);
    } else {
      player.removeAttribute('metadata-video-title');
    }

    if (resolved.subtitle) {
      player.setAttribute('metadata-viewer-user-id', resolved.subtitle);
    } else {
      player.removeAttribute('metadata-viewer-user-id');
    }

    player.muted = !!resolved.muted;
    player.loop = false;

    if (typeof resolved.startTime === 'number' && resolved.startTime >= 0) {
      player.currentTime = resolved.startTime;
    }

    if (resolved.autoPlay) {
      try {
        await player.play?.();
      } catch (error) {
        this.notifyListeners('error', {
          message: error instanceof Error ? error.message : 'Failed to autoplay',
        });
      }
    }
  }

  async dismiss(): Promise<void> {
    const container = this.container;
    if (!container) {
      return;
    }

    const player = this.player;
    if (player?.pause) {
      player.pause();
    }

    window.removeEventListener('keydown', this.handleKeyDown);
    this.closeButton?.removeEventListener('click', this.overlayCloseHandler);

    container.remove();

    this.container = undefined;
    this.player = undefined;
    this.closeButton = undefined;

    this.notifyListeners('playerDismissed', undefined);
  }

  async isActive(): Promise<{ active: boolean }> {
    return { active: !!this.container };
  }

  async removeAllListeners(): Promise<void> {
    await super.removeAllListeners();
  }

  private ensureOverlay(): void {
    if (this.container && this.player) {
      return;
    }

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.right = '0';
    container.style.bottom = '0';
    container.style.left = '0';
    container.style.background = 'rgba(0, 0, 0, 0.85)';
    container.style.zIndex = '2147483647';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.padding = '24px';
    container.style.boxSizing = 'border-box';

    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.setAttribute('aria-label', 'Close video');
    closeButton.style.position = 'absolute';
    closeButton.style.top = '12px';
    closeButton.style.right = '16px';
    closeButton.style.background = 'transparent';
    closeButton.style.border = 'none';
    closeButton.style.color = '#fff';
    closeButton.style.fontSize = '2rem';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', this.overlayCloseHandler);

    const player = document.createElement('mux-player') as MuxPlayerElement;
    player.style.width = '100%';
    player.style.height = '100%';
    player.style.maxWidth = '1280px';
    player.style.maxHeight = '720px';

    this.attachPlayerEvents(player);

    container.appendChild(player);
    container.appendChild(closeButton);

    document.body.appendChild(container);

    this.container = container;
    this.player = player;
    this.closeButton = closeButton;

    window.addEventListener('keydown', this.handleKeyDown);
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.dismiss();
    }
  }

  private attachPlayerEvents(player: HTMLElement) {
    player.addEventListener('loadedmetadata', () => {
      this.notifyListeners('ready', { playerName: this.lastPlayerName });
    });

    player.addEventListener('play', () => {
      this.notifyListeners('play', undefined);
    });

    player.addEventListener('pause', () => {
      this.notifyListeners('pause', undefined);
    });

    player.addEventListener('ended', () => {
      this.notifyListeners('ended', undefined);
    });

    player.addEventListener('error', (event) => {
      const mediaError = (event as ErrorEvent).error as MediaError | undefined;
      const message = mediaError?.message ?? 'Mux player encountered an error.';
      this.notifyListeners('error', { message });
    });
  }

  async getPluginVersion(): Promise<{ version: string }> {
    return { version: 'web' };
  }
}

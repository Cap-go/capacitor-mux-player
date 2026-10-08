import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';
import { MuxPlayer } from '@capgo/capacitor-mux-player';

const playbackIdInput = document.getElementById('playbackId');
const playbackTokenInput = document.getElementById('playbackToken');
const drmTokenInput = document.getElementById('drmToken');
const customDomainInput = document.getElementById('customDomain');
const startTimeInput = document.getElementById('startTime');
const posterInput = document.getElementById('poster');
const environmentKeyInput = document.getElementById('environmentKey');
const playerNameInput = document.getElementById('playerName');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');

const autoPlayInput = document.getElementById('autoPlay');
const mutedInput = document.getElementById('muted');
const smartCacheInput = document.getElementById('smartCache');
const debugInput = document.getElementById('debug');

const playButton = document.getElementById('playButton');
const pauseButton = document.getElementById('pauseButton');
const seekBackButton = document.getElementById('seekBackButton');
const seekForwardButton = document.getElementById('seekForwardButton');
const dismissButton = document.getElementById('dismissButton');
const isActiveButton = document.getElementById('isActiveButton');
const versionButton = document.getElementById('versionButton');
const resetListenersButton = document.getElementById('resetListenersButton');
const clearLogButton = document.getElementById('clearLogButton');

const statusChip = document.getElementById('statusChip');
const eventLog = document.getElementById('eventLog');
const webControlHint = document.getElementById('webControlHint');

const logLines = [];
const listenerHandles = [];

const isWeb = Capacitor.getPlatform() === 'web';

const setStatus = (message, state = 'ready') => {
  if (statusChip) {
    statusChip.textContent = message;
    statusChip.dataset.state = state;
  }
};

const appendLog = (event, payload) => {
  const timestamp = new Date().toISOString();
  const serialized = payload !== undefined ? `\n${JSON.stringify(payload, null, 2)}` : '';
  const line = `[${timestamp}] ${event}${serialized}`;
  logLines.unshift(line);
  if (eventLog) {
    eventLog.textContent = logLines.slice(0, 30).join('\n\n');
  }
};

const getWebPlayer = () => document.querySelector('mux-player');

const runWebPlayerAction = (label, action) => {
  if (!isWeb) {
    appendLog(`${label}-skipped`, { reason: 'Use native player controls on this platform.' });
    setStatus('Native player active', 'busy');
    return;
  }

  const player = getWebPlayer();
  if (!player) {
    appendLog(`${label}-error`, { message: 'No web player overlay. Tap Play first.' });
    setStatus('Player not open', 'error');
    return;
  }

  try {
    action(player);
    appendLog(label);
    setStatus('Web player updated', 'busy');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    appendLog(`${label}-error`, { message });
    setStatus(`${label} failed`, 'error');
  }
};

const removeLocalListeners = async () => {
  while (listenerHandles.length) {
    const handle = listenerHandles.pop();
    try {
      await handle?.remove?.();
    } catch (error) {
      console.warn('Failed to remove listener handle', error);
    }
  }
};

const attachListeners = async () => {
  await removeLocalListeners();

  const events = {
    ready: (payload) => appendLog('ready', payload),
    play: () => appendLog('play'),
    pause: () => appendLog('pause'),
    ended: () => appendLog('ended'),
    error: (payload) => appendLog('error', payload),
    playerDismissed: () => {
      appendLog('playerDismissed');
      setStatus('Idle', 'ready');
    },
  };

  await Promise.all(
    Object.entries(events).map(async ([eventName, handler]) => {
      try {
        const handle = await MuxPlayer.addListener(eventName, handler);
        listenerHandles.push(handle);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        appendLog('listener-error', { eventName, message });
      }
    }),
  );

  setStatus('Listeners attached', 'ready');
};

const buildOptions = () => {
  const playbackId = playbackIdInput?.value?.trim();
  if (!playbackId) {
    throw new Error('Playback ID is required.');
  }

  const options = { playbackId };

  const assignIfString = (input, key) => {
    const value = input?.value?.trim();
    if (value) {
      options[key] = value;
    }
  };

  assignIfString(playbackTokenInput, 'playbackToken');
  assignIfString(drmTokenInput, 'drmToken');
  assignIfString(customDomainInput, 'customDomain');
  assignIfString(posterInput, 'poster');
  assignIfString(environmentKeyInput, 'environmentKey');
  assignIfString(playerNameInput, 'playerName');
  assignIfString(titleInput, 'title');
  assignIfString(subtitleInput, 'subtitle');

  const startValue = Number(startTimeInput?.value);
  if (!Number.isNaN(startValue) && startTimeInput?.value !== '') {
    options.startTime = startValue;
  }

  options.autoPlay = Boolean(autoPlayInput?.checked);
  options.muted = Boolean(mutedInput?.checked);
  options.enableSmartCache = Boolean(smartCacheInput?.checked);
  options.debug = Boolean(debugInput?.checked);

  return options;
};

playButton?.addEventListener('click', async () => {
  try {
    const options = buildOptions();
    setStatus('Launching player...', 'busy');
    await MuxPlayer.play(options);
    appendLog('play-called', options);
    setStatus('Player open', 'busy');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    appendLog('play-error', { message });
    setStatus('Play failed', 'error');
  }
});

pauseButton?.addEventListener('click', () => {
  runWebPlayerAction('pause-called', (player) => {
    player.pause?.();
  });
});

seekBackButton?.addEventListener('click', () => {
  runWebPlayerAction('seek-back', (player) => {
    const current = Number(player.currentTime) || 0;
    player.currentTime = Math.max(0, current - 10);
  });
});

seekForwardButton?.addEventListener('click', () => {
  runWebPlayerAction('seek-forward', (player) => {
    const current = Number(player.currentTime) || 0;
    player.currentTime = current + 10;
  });
});

dismissButton?.addEventListener('click', async () => {
  try {
    await MuxPlayer.dismiss();
    appendLog('dismiss-called');
    setStatus('Idle', 'ready');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    appendLog('dismiss-error', { message });
    setStatus('Dismiss failed', 'error');
  }
});

isActiveButton?.addEventListener('click', async () => {
  try {
    const result = await MuxPlayer.isActive();
    appendLog('isActive', result);
    setStatus(result?.active ? 'Player active' : 'Player inactive', result?.active ? 'busy' : 'ready');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    appendLog('isActive-error', { message });
    setStatus('Check failed', 'error');
  }
});

versionButton?.addEventListener('click', async () => {
  try {
    const result = await MuxPlayer.getPluginVersion();
    appendLog('getPluginVersion', result);
    setStatus(`Version ${result?.version ?? 'unknown'}`, 'ready');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    appendLog('getPluginVersion-error', { message });
    setStatus('Version lookup failed', 'error');
  }
});

resetListenersButton?.addEventListener('click', async () => {
  try {
    await MuxPlayer.removeAllListeners();
    await attachListeners();
    appendLog('listeners-reset');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    appendLog('reset-listeners-error', { message });
    setStatus('Reset failed', 'error');
  }
});

clearLogButton?.addEventListener('click', () => {
  logLines.length = 0;
  if (eventLog) {
    eventLog.textContent = 'Log cleared.';
  }
});

if (webControlHint && !isWeb) {
  webControlHint.textContent =
    'Pause and seek are web-only helpers. On iOS and Android, use the fullscreen native player controls.';
}

attachListeners().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  appendLog('initial-listener-error', { message });
  setStatus('Listener setup failed', 'error');
});

if (Capacitor.isNativePlatform()) {
  CapacitorUpdater.notifyAppReady().catch((error) => {
    console.error('Capgo notifyAppReady failed', error);
  });
}

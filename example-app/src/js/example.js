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
const dismissButton = document.getElementById('dismissButton');
const isActiveButton = document.getElementById('isActiveButton');
const resetListenersButton = document.getElementById('resetListenersButton');

const statusText = document.getElementById('statusText');
const eventLog = document.getElementById('eventLog');

const logLines = [];
const listenerHandles = [];

const setStatus = (message) => {
  if (statusText) {
    statusText.textContent = `Status: ${message}`;
  }
};

const appendLog = (event, payload) => {
  const timestamp = new Date().toISOString();
  const serialized = payload !== undefined ? `\n${JSON.stringify(payload, null, 2)}` : '';
  const line = `[${timestamp}] ${event}${serialized}`;
  logLines.unshift(line);
  if (eventLog) {
    eventLog.textContent = logLines.slice(0, 25).join('\n\n');
  }
};

const removeLocalListeners = async () => {
  while (listenerHandles.length) {
    const handle = listenerHandles.pop();
    try {
      await handle?.remove?.();
    } catch (error) {
      // No-op: We only log to console to avoid breaking UX.
      // eslint-disable-next-line no-console
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
    playerDismissed: () => appendLog('playerDismissed'),
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

  setStatus('Listeners attached');
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
    setStatus('Launching player...');
    await MuxPlayer.play(options);
    appendLog('play-called', options);
    setStatus('Player requested');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    appendLog('play-error', { message });
    setStatus(`Play failed: ${message}`);
  }
});

dismissButton?.addEventListener('click', async () => {
  try {
    await MuxPlayer.dismiss();
    appendLog('dismiss-called');
    setStatus('Dismiss requested');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    appendLog('dismiss-error', { message });
    setStatus(`Dismiss failed: ${message}`);
  }
});

isActiveButton?.addEventListener('click', async () => {
  try {
    const result = await MuxPlayer.isActive();
    appendLog('isActive', result);
    setStatus(`Active: ${result?.active ? 'Yes' : 'No'}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    appendLog('isActive-error', { message });
    setStatus(`isActive failed: ${message}`);
  }
});

resetListenersButton?.addEventListener('click', async () => {
  try {
    await MuxPlayer.removeAllListeners();
    await attachListeners();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    appendLog('reset-listeners-error', { message });
    setStatus(`Reset listeners failed: ${message}`);
  }
});

attachListeners().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  appendLog('initial-listener-error', { message });
  setStatus(`Listener setup failed: ${message}`);
});

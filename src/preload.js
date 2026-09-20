const { contextBridge, ipcRenderer } = require('electron');
const call = async (name, data) => {
  const result = await ipcRenderer.invoke(name, data);
  if (result.error) throw new Error(result.error);
  return result.value;
};
const subscribe = (name) => (callback) => {
  const listener = (_event, data) => callback(data);
  ipcRenderer.on(name, listener);
  return () => ipcRenderer.removeListener(name, listener);
};
contextBridge.exposeInMainWorld('pond', {
  initial: () => call('initial'),
  scan: () => call('scan'),
  folder: () => call('folder'),
  addEngine: (kind) => call('add-engine', kind),
  inspectEngine: (id) => call('inspect-engine', id),
  engineSettings: (data) => call('engine-settings', data),
  preview: (data) => call('preview', data),
  start: (data) => call('start', data),
  pause: () => call('pause'),
  resume: () => call('resume'),
  move: (data) => call('move', data),
  cancelPiece: () => call('cancel-piece'),
  takeback: () => call('takeback'),
  review: (ply) => call('review', ply),
  resign: () => call('resign'),
  draw: () => call('draw'),
  copyFen: (ply) => call('copy-fen', ply),
  saveGame: () => call('save-game'),
  openGame: () => call('open-game'),
  onState: subscribe('state'),
  onClock: subscribe('clock'),
  onInfo: subscribe('info'),
  onLogs: subscribe('logs')
});

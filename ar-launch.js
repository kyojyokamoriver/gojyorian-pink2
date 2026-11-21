const asset = new URL('./alien-ar.usdz?effects=model-07-auto-1', import.meta.url);
const modelType = 'model/vnd.usdz+zip';

// A failed or unavailable spatial-AR probe must not block the camera fallback.
export async function prepareWalk(link) {
  let quickLook = false;
  try { quickLook = Boolean(link.relList?.supports?.('ar')); } catch {}
  if (quickLook) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(asset, {signal:controller.signal});
      if (!response.ok) throw new Error('USDZ unavailable');
      const file = await response.arrayBuffer();
      if (file.byteLength < 4 || new DataView(file).getUint32(0) !== 0x504b0304) throw new Error('Invalid USDZ');
      link.href = URL.createObjectURL(new Blob([file], {type:modelType}));
      link.download = 'gojorian.usdz';
      return {type:'quick-look'};
    } catch {
      // The native asset could not be opened; try WebXR or simple camera AR.
    } finally { clearTimeout(timeout); }
  }
  let timeout;
  try {
    const supported = await Promise.race([
      navigator.xr?.isSessionSupported('immersive-ar') ?? false,
      new Promise(resolve => { timeout = setTimeout(() => resolve(false), 4000); })
    ]);
    if (supported) {
      const {WalkMode} = await import('./walk-mode.js');
      return {type:'webxr', WalkMode};
    }
  } catch {
    // Missing services, policy restrictions and rejected probes all use simple AR.
  } finally { clearTimeout(timeout); }
  return {type:'simple'};
}

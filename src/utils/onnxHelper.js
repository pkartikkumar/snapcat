import * as ort from 'onnxruntime-web';

ort.env.wasm.numThreads =
  typeof window !== 'undefined' && window.crossOriginIsolated && navigator.hardwareConcurrency
    ? Math.min(4, navigator.hardwareConcurrency)
    : 1;

const DB_NAME = 'snapcat_ai_models';
const STORE_NAME = 'models';
const sessionCache = new Map();

function openModelDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getCachedModelBuffer(url) {
  const db = await openModelDB();
  const cached = await new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(url);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });

  if (cached) return cached;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch model: ${url}`);
  const buffer = await response.arrayBuffer();

  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).put(buffer, url);
  return buffer;
}

export async function createLocalSession(modelPath) {
  if (sessionCache.has(modelPath)) {
    return sessionCache.get(modelPath);
  }

  const sessionPromise = (async () => {
    const modelBuffer = await getCachedModelBuffer(modelPath);
    return ort.InferenceSession.create(modelBuffer, {
      executionProviders: ['webgpu', 'wasm'],
      graphOptimizationLevel: 'all',
    });
  })();

  sessionCache.set(modelPath, sessionPromise);
  try {
    return await sessionPromise;
  } catch (err) {
    sessionCache.delete(modelPath);
    throw err;
  }
}
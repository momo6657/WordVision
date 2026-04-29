const DB_NAME = "wordvision-db";
const DB_VERSION = 1;
const PROGRESS_STORE = "wordProgress";

const openDatabase = () =>
  new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB is not supported in this browser."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PROGRESS_STORE)) {
        db.createObjectStore(PROGRESS_STORE, { keyPath: "wordId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const withStore = async (mode, callback) => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PROGRESS_STORE, mode);
    const store = transaction.objectStore(PROGRESS_STORE);
    const result = callback(store);
    transaction.oncomplete = () => {
      db.close();
      resolve(result);
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
};

export const loadProgress = async () => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PROGRESS_STORE, "readonly");
    const store = transaction.objectStore(PROGRESS_STORE);
    const request = store.getAll();
    request.onsuccess = () => {
      db.close();
      resolve(Object.fromEntries(request.result.map((item) => [item.wordId, item])));
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
};

export const saveProgress = async (progressItems) =>
  withStore("readwrite", (store) => {
    store.clear();
    progressItems.forEach((item) => store.put(item));
  });

export const clearBookProgress = async (wordIds) =>
  withStore("readwrite", (store) => {
    wordIds.forEach((wordId) => store.delete(wordId));
  });

export const clearAllProgress = async () =>
  withStore("readwrite", (store) => {
    store.clear();
  });

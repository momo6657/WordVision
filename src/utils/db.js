const DB_NAME = "wordvision-db";
const DB_VERSION = 2;
const PROGRESS_STORE = "wordProgress";
const CUSTOM_WORDS_STORE = "customWords";
const CUSTOM_SCENES_STORE = "customScenes";
const SPEAKING_RECORDS_STORE = "speakingRecords";
const SENTENCE_RECORDS_STORE = "sentenceRecords";

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
      if (!db.objectStoreNames.contains(CUSTOM_WORDS_STORE)) {
        db.createObjectStore(CUSTOM_WORDS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(CUSTOM_SCENES_STORE)) {
        db.createObjectStore(CUSTOM_SCENES_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(SPEAKING_RECORDS_STORE)) {
        db.createObjectStore(SPEAKING_RECORDS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(SENTENCE_RECORDS_STORE)) {
        db.createObjectStore(SENTENCE_RECORDS_STORE, { keyPath: "id" });
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

export const saveBookProgress = async (bookId, wordIds, progressItems) =>
  withStore("readwrite", (store) => {
    wordIds.forEach((wordId) => store.delete(wordId));
    progressItems
      .filter((item) => item.bookId === bookId)
      .forEach((item) => store.put(item));
  });

export const clearBookProgress = async (wordIds) =>
  withStore("readwrite", (store) => {
    wordIds.forEach((wordId) => store.delete(wordId));
  });

export const deleteProgressItems = async (wordIds) => clearBookProgress(wordIds);

export const clearAllProgress = async () =>
  withStore("readwrite", (store) => {
    store.clear();
  });

const loadAllFromStore = async (storeName) => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => {
      db.close();
      resolve(request.result || []);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
};

const saveAllToStore = async (storeName, items) =>
  withStore("readwrite", (store) => {
    store.clear();
    items.forEach((item) => store.put(item));
  });

export const loadCustomWords = () => loadAllFromStore(CUSTOM_WORDS_STORE);
export const saveCustomWords = (words) => saveAllToStore(CUSTOM_WORDS_STORE, words);

export const loadCustomScenes = () => loadAllFromStore(CUSTOM_SCENES_STORE);
export const saveCustomScenes = (scenes) => saveAllToStore(CUSTOM_SCENES_STORE, scenes);

export const loadSpeakingRecords = () => loadAllFromStore(SPEAKING_RECORDS_STORE);
export const saveSpeakingRecords = (records) => saveAllToStore(SPEAKING_RECORDS_STORE, records);

export const loadSentenceRecords = () => loadAllFromStore(SENTENCE_RECORDS_STORE);
export const saveSentenceRecords = (records) => saveAllToStore(SENTENCE_RECORDS_STORE, records);

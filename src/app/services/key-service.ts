import { Injectable, Signal, signal, WritableSignal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class KeyService {
  private privateKey = signal<string | null>(null);

  // Remove private key and device secret from IndexedDB
  async clearKeyStorage() {
    const db = await this.openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('keys', 'readwrite');
      const store = tx.objectStore('keys');
      const req1 = store.delete('decryptedPrivateKey');
      const req2 = store.delete('deviceSecret');
      let doneCount = 0;
      const checkDone = () => {
        doneCount++;
        if (doneCount === 2) {
          db.close();
          this.privateKey.set(null);
          this.deviceSecretKey.set(null);
          resolve();
        }
      };
      req1.onsuccess = checkDone;
      req2.onsuccess = checkDone;
      req1.onerror = () => { db.close(); reject(req1.error); };
      req2.onerror = () => { db.close(); reject(req2.error); };
    });
  }

  // Set the decrypted private key in memory only
  async setPrivateKey(key: string | null) {
    this.privateKey.set(key);
    if( key === null ) return;
    await this.saveDecryptedPrivateKeyToIndexedDB(key);
  }

  getPrivateKey(): string | null {
    return this.privateKey();
  }

  private deviceSecretKey: WritableSignal<CryptoKey | null> = signal(null);

  async getDeviceSecret(): Promise<CryptoKey> {
    const secretKeyName = 'deviceSecret';
    const db = await this.openDB();
    return new Promise<CryptoKey>(async (resolve, reject) => {
      const tx = db.transaction('keys', 'readwrite');
      const store = tx.objectStore('keys');
      const request = store.get(secretKeyName);
      request.onsuccess = async () => {
        let secret = request.result as string | null;
        if (!secret) {
          const raw = window.crypto.getRandomValues(new Uint8Array(32));
          secret = btoa(String.fromCharCode(...raw));
          const putReq = store.put(secret, secretKeyName);
          putReq.onsuccess = () => {};
        }
        db.close();
        const secretBytes = Uint8Array.from(atob(secret), c => c.charCodeAt(0));
        const key = await window.crypto.subtle.importKey(
          'raw', secretBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']
        );
        this.deviceSecretKey.update(() => key);
        resolve(key);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  }

  async saveDecryptedPrivateKeyToIndexedDB(privateKey: string) {
    const key = this.deviceSecretKey() || await this.getDeviceSecret();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(privateKey)
    );
    const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    const ivBase64 = btoa(String.fromCharCode(...iv));
    const db = await this.openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('keys', 'readwrite');
      const store = tx.objectStore('keys');
      const request = store.put(JSON.stringify({ encrypted: encryptedBase64, iv: ivBase64 }), 'decryptedPrivateKey');
      request.onsuccess = () => {
        db.close();
        resolve();
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  }

  async loadDecryptedPrivateKeyFromIndexedDB(): Promise<null> {
    const key = this.deviceSecretKey() || await this.getDeviceSecret();
    const db = await this.openDB();
    return new Promise<null>((resolve, reject) => {
      const tx = db.transaction('keys', 'readonly');
      const store = tx.objectStore('keys');
      const request = store.get('decryptedPrivateKey');
      request.onsuccess = async () => {
        db.close();
        const result = request.result as string | null;
        if (!result) return resolve(null);
        try {
          const { encrypted, iv } = JSON.parse(result);
          const encryptedBytes = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
          const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
          const decrypted = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: ivBytes },
            key,
            encryptedBytes
          );
          const privateKey = new TextDecoder().decode(decrypted);
          this.privateKey.set(privateKey);
          resolve(null);
        } catch (e) {
          resolve(null);
        }
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  }

  private async openDB() {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = window.indexedDB.open('secure-keys', 1);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('keys')) {
          db.createObjectStore('keys');
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

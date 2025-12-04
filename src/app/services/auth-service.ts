import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { GlobalResponse, LoginModel, PrivateKeyResponse } from '../models/auth.model';
import { map } from 'rxjs';
import { UserService } from './user-service';
import { KeyService } from './key-service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private userService = inject(UserService);
  private encryptKey = environment.encryptKey;
  private keyService = inject(KeyService);

  loginUser(data: LoginModel) {
    return this.http.post<GlobalResponse<PrivateKeyResponse>>(`${this.apiUrl}/auth/login`, data).pipe(
      map(async (res) => {
        if (res.success) {
          // Use encrypted private key, salt, and iv from login response
          const keyRes = res.data;
          if (keyRes?.privateKey) {
            const encoder = new TextEncoder();
            const salt = Uint8Array.from(atob(this.encryptKey.salt), c => c.charCodeAt(0));
            const iv = Uint8Array.from(atob(this.encryptKey.iv), c => c.charCodeAt(0));
            const encrypted = Uint8Array.from(atob(keyRes.privateKey), c => c.charCodeAt(0));
            const baseKey = await window.crypto.subtle.importKey(
              'raw', encoder.encode(data.password), { name: 'PBKDF2' }, false, ['deriveKey']
            );
            const derivedKey = await window.crypto.subtle.deriveKey(
              {
                name: 'PBKDF2',
                salt,
                iterations: this.encryptKey.iterations,
                hash: 'SHA-256'
              },
              baseKey,
              { name: 'AES-GCM', length: 256 },
              false,
              ['decrypt']
            );
            try {
              const decrypted = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                derivedKey,
                encrypted
              );
              const privateKey = new TextDecoder().decode(decrypted);
              await this.keyService.setPrivateKey(privateKey);
            } catch (e) {
              alert('Failed to decrypt private key. Wrong password?');
            }
          }
        }
        return res;
      })
    );
  }

  registerUser(data: LoginModel) {
    return this.http.post<GlobalResponse<PrivateKeyResponse>>(`${this.apiUrl}/auth/register`, data);
  }

  logoutUser() {
    return this.http.post<GlobalResponse<null>>(`${this.apiUrl}/auth/logout`, {}).pipe(
      map(async (res) => {
        if (res.success) {
          this.userService.setUser(null);
          this.keyService.setPrivateKey(null);
          await this.keyService.clearKeyStorage();
        }
        return res;
      })
    );
  }

  refreshToken() {
    return this.http.get<GlobalResponse<null>>(`${this.apiUrl}/auth/refresh`);
  }
}

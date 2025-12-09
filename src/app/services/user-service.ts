import { HttpClient } from '@angular/common/http';
import { DestroyRef, inject, Injectable, signal, WritableSignal } from '@angular/core';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';
import { GlobalResponse } from '../models/auth.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { KeyService } from './key-service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  user: WritableSignal<User | null> = signal(null);
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private destroyRef = inject(DestroyRef);
  private keyService = inject(KeyService);

  setUser(userData: any) {
    this.user.update(() => userData);
  }

  getUserData() {
    return this.http.get<GlobalResponse<User>>(`${this.apiUrl}/users/profile`).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: async (res) => {
        if (res.success) {
          await this.keyService.loadDecryptedPrivateKeyFromIndexedDB();
          this.setUser(res.data);
        }
      },
    });
  }
}

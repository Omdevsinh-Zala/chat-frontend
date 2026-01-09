import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { GlobalResponse, LoginModel, PrivateKeyResponse, RegisterModel } from '../models/auth';
import { map } from 'rxjs';
import { UserService } from './user-service';
import { Router } from '@angular/router';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private userService = inject(UserService);
  private router = inject(Router);

  loginUser(data: LoginModel) {
    return this.http
      .post<GlobalResponse<User>>(`${this.apiUrl}/auth/login`, data)
      .pipe(
        map(async (res) => {
          if (res.success) {
            localStorage.setItem('loggedIn', 'true');
          }
          return res;
        })
      );
  }

  registerUser(data: RegisterModel) {
    return this.http.post<GlobalResponse<PrivateKeyResponse | RegisterModel>>(
      `${this.apiUrl}/auth/register`,
      data
    );
  }

  logoutUser() {
    return this.http.post<GlobalResponse<null>>(`${this.apiUrl}/auth/logout`, {}).pipe(
      map(async (res) => {
        if (res.success) {
          localStorage.removeItem('loggedIn');
          this.userService.setUser(null);
          this.router.navigate(['/login']);
        }
        return res;
      })
    );
  }

  refreshToken() {
    return this.http.get<GlobalResponse<null>>(`${this.apiUrl}/auth/refresh`);
  }
}

import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { GlobalResponse, LoginModel } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient)

  loginUser(data: LoginModel) {
    return this.http.post<GlobalResponse<null>>(`${this.apiUrl}/auth/login`, data);
  }

  registerUser(data: LoginModel) {
    return this.http.post<GlobalResponse<null>>(`${this.apiUrl}/auth/register`, data);
  }
}

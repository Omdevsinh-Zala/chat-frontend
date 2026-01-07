import { Component, DestroyRef, inject, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { form, Field, required, email, minLength, maxLength } from '@angular/forms/signals';
import { LoginModel } from '../../models/auth';
import { AuthService } from '../../services/auth-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { SocketConnection } from '../../services/socket-connection';

@Component({
  selector: 'app-login',
  imports: [MatProgressSpinnerModule, Field, MatIcon, MatTooltipModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginProcess = signal(false);
  showPass = signal(false);
  authService = inject(AuthService);
  destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private socketService = inject(SocketConnection);

  loginModel = signal<LoginModel>({
    email: '',
    password: '',
  });

  loginForm = form(this.loginModel, (schemaPath) => {
    required(schemaPath.email, { message: 'Email is required.' });
    required(schemaPath.password, { message: 'Password is required.' });

    email(schemaPath.email, { message: 'Please enter valid email.' });

    minLength(schemaPath.password, 8, { message: 'Password must be at least 8 characters long.' });
    maxLength(schemaPath.password, 16, { message: 'Password must not exceed 16 characters.' });
  });

  login(event: Event) {
    event.preventDefault();
    this.loginProcess.update(() => true);
    this.authService
      .loginUser(this.loginModel())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async (resPromise) => {
          const res = await resPromise;
          if (res.success) {
            this.loginProcess.update(() => false);
            this.socketService.connectSocket();
            return this.router.navigate(['/home', res?.data?.active_chat_id]);
          }
          return this.loginProcess.update(() => false);
        },
        error: () => {
          this.loginProcess.update(() => false);
        },
      });
  }
}

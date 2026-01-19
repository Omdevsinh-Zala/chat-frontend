import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  debounce,
  email,
  FormField,
  form,
  maxLength,
  minLength,
  pattern,
  required,
  validateHttp,
} from '@angular/forms/signals';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GlobalResponse, RegisterModel } from '../../models/auth';
import { AuthService } from '../../services/auth-service';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-register',
  imports: [MatProgressSpinnerModule, FormField, MatIcon, MatTooltipModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  registerProcess = signal(false);
  showPass = signal(false);
  authService = inject(AuthService);
  destroyRef = inject(DestroyRef);
  router = inject(Router);
  apiUrl = environment.apiUrl;

  backendValidationErrors = signal<RegisterModel | null>(null);

  registerModel = signal<RegisterModel>({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
  });

  registerForm = form(this.registerModel, (schemaPath) => {
    debounce(schemaPath, 300);
    required(schemaPath.firstName, { message: 'First name is required.' });
    required(schemaPath.lastName, { message: 'Last name is required.' });
    required(schemaPath.username, { message: 'Username is required.' });
    required(schemaPath.email, { message: 'Email is required.' });
    required(schemaPath.password, { message: 'Password is required.' });

    email(schemaPath.email, { message: 'Please enter valid email.' });

    minLength(schemaPath.firstName, 2, {
      message: 'First name must be at least 2 characters long.',
    });
    maxLength(schemaPath.firstName, 20, { message: 'First name must not exceed 20 characters.' });
    minLength(schemaPath.lastName, 2, { message: 'Last name must be at least 2 characters long.' });
    maxLength(schemaPath.lastName, 20, { message: 'Last name must not exceed 20 characters.' });
    minLength(schemaPath.username, 3, { message: 'Username must be at least 3 characters long.' });
    maxLength(schemaPath.username, 32, { message: 'Username must not exceed 32 characters.' });
    minLength(schemaPath.password, 8, { message: 'Password must be at least 8 characters long.' });
    maxLength(schemaPath.password, 16, { message: 'Password must not exceed 16 characters.' });

    pattern(schemaPath.firstName, /^[A-Za-z'-]+$/, {
      message: 'First name can only contain letters, apostrophes, and hyphens.',
    });
    pattern(schemaPath.lastName, /^[A-Za-z'-]+$/, {
      message: 'Last name can only contain letters, apostrophes, and hyphens.',
    });

    pattern(schemaPath.username, /^\S*$/, { message: 'Username must not contain spaces.' });
    pattern(schemaPath.username, /^[a-zA-Z0-9_]+$/, {
      message: 'Username can only contain letters, numbers, and underscores.',
    });

    pattern(schemaPath.password, /^\S*$/, { message: 'Password must not contain spaces.' });
    pattern(schemaPath.password, /[A-Z]/, {
      message: 'Password must contain at least one uppercase letter.',
    });
    pattern(schemaPath.password, /[a-z]/, {
      message: 'Password must contain at least one lowercase letter.',
    });
    pattern(schemaPath.password, /[0-9]/, {
      message: 'Password must contain at least one number.',
    });
    pattern(schemaPath.password, /[\W_]/, {
      message: 'Password must contain at least one special character.',
    });

    validateHttp(schemaPath.username, {
      request: ({ value }) => `${this.apiUrl}/auth/verify/username?username=${value()}`,
      onSuccess: (res: GlobalResponse<{ isAvailable: boolean }>) => {
        if (res.success && !res.data?.isAvailable) {
          return {
            kind: 'validationError',
            message: 'Username is already taken.',
          };
        }
        return null;
      },
      onError: () => ({
        kind: 'networkError',
        message: 'Could not verify username availability',
      }),
    });
  });

  register(event: Event) {
    event.preventDefault();
    this.registerProcess.update(() => true);
    this.authService
      .registerUser(this.registerModel())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.registerProcess.update(() => false);
            return this.router.navigate(['/login']);
          }
          return this.registerProcess.update(() => false);
        },
        error: (err) => {
          if (err.error && err.error.data) {
            this.backendValidationErrors.update(() => err.error.data);
            setTimeout(() => {
              this.backendValidationErrors.update(() => null);
            }, 5000);
          }
          this.registerProcess.update(() => false);
        },
      });
  }
}

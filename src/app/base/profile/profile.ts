import { Component, computed, inject, signal, WritableSignal } from '@angular/core';
import { UserService } from '../../services/user-service';
import {
  debounce,
  email,
  form,
  maxLength,
  minLength,
  pattern,
  required,
  validateHttp,
} from '@angular/forms/signals';
import { User } from '../../models/user';
import { GlobalResponse } from '../../models/auth';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  private userService = inject(UserService);
  userData = this.userService.user as WritableSignal<User>;
  private apiUrl = environment.apiUrl;
  imageUrl = environment.imageUrl;

  userDataForm = form(this.userData, (schemaPath) => {
    debounce(schemaPath, 300);
    required(schemaPath.first_name, { message: 'First name is required.' });
    required(schemaPath.last_name, { message: 'Last name is required.' });
    required(schemaPath.username, { message: 'Username is required.' });
    required(schemaPath.email, { message: 'Email is required.' });

    email(schemaPath.email, { message: 'Please enter valid email.' });

    minLength(schemaPath.first_name, 2, {
      message: 'First name must be at least 2 characters long.',
    });
    maxLength(schemaPath.first_name, 20, { message: 'First name must not exceed 20 characters.' });
    minLength(schemaPath.last_name, 2, {
      message: 'Last name must be at least 2 characters long.',
    });
    maxLength(schemaPath.last_name, 20, { message: 'Last name must not exceed 20 characters.' });
    minLength(schemaPath.username, 3, { message: 'Username must be at least 3 characters long.' });
    maxLength(schemaPath.username, 32, { message: 'Username must not exceed 32 characters.' });

    pattern(schemaPath.first_name, /^[A-Za-z'-]+$/, {
      message: 'First name can only contain letters, apostrophes, and hyphens.',
    });
    pattern(schemaPath.last_name, /^[A-Za-z'-]+$/, {
      message: 'Last name can only contain letters, apostrophes, and hyphens.',
    });

    pattern(schemaPath.username, /^\S*$/, { message: 'Username must not contain spaces.' });
    pattern(schemaPath.username, /^[a-zA-Z0-9_]+$/, {
      message: 'Username can only contain letters, numbers, and underscores.',
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
}

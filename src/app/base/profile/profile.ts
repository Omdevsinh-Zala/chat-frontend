import {
  Component,
  inject,
  signal,
  viewChild,
  WritableSignal,
} from '@angular/core';
import { UserService } from '../../services/user-service';
import {
  debounce,
  disabled,
  form,
  FormField,
  maxLength,
  minLength,
  pattern,
  required,
  validate,
  validateHttp,
} from '@angular/forms/signals';
import { User } from '../../models/user';
import { GlobalResponse } from '../../models/auth';
import { environment } from '../../../environments/environment';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatDivider } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { SocketConnection } from '../../services/socket-connection';

interface ChangePasswordInterface {
  currentPass: string;
  newPass: string;
  confirmPass: string;
}

@Component({
  selector: 'app-profile',
  imports: [
    MatFormFieldModule,
    FormField,
    MatInput,
    MatProgressSpinner,
    MatDivider,
    MatButtonModule,
    Menu,
    MenuContent,
    MenuItem,
    MenuTrigger,
    OverlayModule,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  private userService = inject(UserService);
  userData = this.userService.user as WritableSignal<User>;
  private apiUrl = environment.apiUrl;
  private socketService = inject(SocketConnection);
  imageUrl = environment.imageUrl;

  formatMenu = viewChild<Menu<string>>('formatMenu');

  backendValidationErrors = signal<User | null>(null);

  userDataForm = form(this.userData, (schemaPath) => {
    debounce(schemaPath, 300);
    required(schemaPath.first_name, { message: 'First name is required.' });
    required(schemaPath.last_name, { message: 'Last name is required.' });
    required(schemaPath.username, { message: 'Username is required.' });

    disabled(schemaPath.email, 'true');

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
      request: ({ value }) => {
        return `${this.apiUrl}/auth/verify/username?username=${value()}`;
      },
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

  backEndPassValidationErrors = signal<ChangePasswordInterface | null>(null);

  passwordModel = signal<ChangePasswordInterface>({
    currentPass: '',
    newPass: '',
    confirmPass: '',
  });

  passwordForm = form(this.passwordModel, (schemaPath) => {
    debounce(schemaPath, 300);
    required(schemaPath.currentPass, { message: 'Current password is required.' });
    required(schemaPath.newPass, { message: 'New password is required.' });
    required(schemaPath.confirmPass, { message: 'Confirm password is required.' });

    minLength(schemaPath.newPass, 8, {
      message: 'New password must be at least 8 characters long.',
    });
    maxLength(schemaPath.newPass, 16, { message: 'New password must not exceed 16 characters.' });

    pattern(
      schemaPath.newPass,
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      {
        message:
          'New password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character.',
      },
    );

    pattern(
      schemaPath.confirmPass,
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      {
        message:
          'Confirm password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character.',
      },
    );

    validate(schemaPath.confirmPass, (confirmPass) => {
      if (confirmPass.value() !== this.passwordModel().newPass) {
        return {
          kind: 'validationError',
          message: 'New password and confirm password do not match.',
        };
      }
      return null;
    });
  });

  profileImages = signal<{ url: string; value: string }[]>([
    {
      url: 'boy.png',
      value: 'boy',
    },
    {
      url: 'gamer.png',
      value: 'gamer',
    },
    {
      url: 'cat.png',
      value: 'cat',
    },
    {
      url: 'man.png',
      value: 'man',
    },
    {
      url: 'man-1.png',
      value: 'man-1',
    },
    {
      url: 'man-2.png',
      value: 'man-2',
    },
    {
      url: 'man-3.png',
      value: 'man-3',
    },
    {
      url: 'man-4.png',
      value: 'man-4',
    },
    {
      url: 'woman.png',
      value: 'woman',
    },
    {
      url: 'woman-1.png',
      value: 'woman-1',
    },
  ]);

  changeProfileImage(image: string) {
    this.socketService.socket.emit('profileImageChange', { image });
  }
}

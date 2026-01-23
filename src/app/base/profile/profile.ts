import { Component, inject, signal, viewChild, WritableSignal } from '@angular/core';
import { UserService } from '../../services/user-service';
import {
  debounce,
  disabled,
  form,
  FormField,
  maxLength,
  minLength,
  pattern,
  readonly,
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
import { MatSnackBar } from '@angular/material/snack-bar';
import { MessageSnackBar } from '../../helpers/message-snack-bar/message-snack-bar';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { Cropper } from '../../dialogs/cropper/cropper';
import { ImageUrlPipe } from "../../image-url-pipe";

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
    MatIcon,
    ImageUrlPipe
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
  private _snackbar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  showCurrentPass = signal<boolean>(false);
  showNewPass = signal<boolean>(false);
  showConfirmPass = signal<boolean>(false);

  formatMenu = viewChild<Menu<string>>('formatMenu');

  backendValidationErrors = signal<User | null>(null);

  userDataForm = form(this.userData, (schemaPath) => {
    debounce(schemaPath, 300);
    required(schemaPath.first_name, { message: 'First name is required.' });
    required(schemaPath.last_name, { message: 'Last name is required.' });
    required(schemaPath.username, { message: 'Username is required.' });

    readonly(schemaPath.email);

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
    this.userService.updateUserData({ avatar_url: image }).subscribe({
      next: (res) => {
        if (res.success) {
          this.userService.user.update((user) => {
            return { ...user!, avatar_url: image };
          });
          this.socketService.socket.emit('profileImageChange', { image });
        }
      },
      error: (err) => {
        this.backendValidationErrors.set(err.error.data);
        setTimeout(() => {
          this.backendValidationErrors.set(null);
        }, 3000);
      },
    });
  }

  updateProfileInfo() {
    this.userService
      .updateUserData({
        first_name: this.userDataForm.first_name().value(),
        last_name: this.userDataForm.last_name().value(),
        username: this.userDataForm.username().value(),
      })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.userService.user.set(res.data!);
            this.socketService.socket.emit('profileInfoChange', {
              first_name: this.userDataForm.first_name().value(),
              last_name: this.userDataForm.last_name().value(),
              username: this.userDataForm.username().value(),
            });
            this._snackbar.openFromComponent(MessageSnackBar, {
              duration: 3000,
              panelClass: 'success-panel',
              data: 'Profile info updated successfully',
            });
          }
        },
        error: (err) => {
          this.backendValidationErrors.set(err.error.data);
          setTimeout(() => {
            this.backendValidationErrors.set(null);
          }, 3000);
        },
      });
  }

  updatePassword() {
    this.userService
      .updateUserData({
        old_password: this.passwordForm.currentPass().value(),
        new_password: this.passwordForm.newPass().value(),
      })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.passwordForm().reset({
              confirmPass: '',
              currentPass: '',
              newPass: '',
            });
            this._snackbar.openFromComponent(MessageSnackBar, {
              duration: 3000,
              panelClass: 'success-panel',
              data: 'Password changed successfully',
            });
          }
        },
        error: (err) => {
          this.backEndPassValidationErrors.set(err.error.data);
          setTimeout(() => {
            this.backEndPassValidationErrors.set(null);
          }, 3000);
        },
      });
  }

  uploadProfileImage(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files![0];

    const dialogRef = this.dialog.open(Cropper, {
      data: file,
      maxHeight: '100%',
      maxWidth: '100%',
      height: '60%',
      width: '60%',
      panelClass: 'small-corners-dialog',
    });

    dialogRef.afterClosed().subscribe({
      next: (croppedFile) => {
        if (croppedFile) {
          const formData = new FormData();
          formData.append('file', croppedFile);
          this.userService.uploadProfileImage(formData).subscribe({
            next: (res) => {
              if (res.success) {
                this.userService.user.set(res.data!);
                this.socketService.socket.emit('profileImageChange', {
                  image: res.data?.avatar_url,
                });
              }
            },
            error: (err) => {
              this.backendValidationErrors.set(err.error.data);
              setTimeout(() => {
                this.backendValidationErrors.set(null);
              }, 3000);
            },
            complete: () => {
              target.value = '';
            },
          });
        }
      },
    });
  }
}

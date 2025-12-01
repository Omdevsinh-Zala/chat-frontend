import { Component, DestroyRef, inject, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { form, Field, required, email, minLength, maxLength } from '@angular/forms/signals';
import { LoginModel } from '../../models/auth.model';
import { AuthService } from '../../services/auth-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MessageSnackBar } from '../../helpers/message-snack-bar/message-snack-bar';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-login',
  imports: [MatProgressSpinnerModule, Field, MatIcon, MatTooltipModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginProcess = signal(false);
  showPass = signal(false);
  authService = inject(AuthService);
  destroyRef = inject(DestroyRef);
  private _snackBar = inject(MatSnackBar)

  loginModel = signal<LoginModel>({
    email: '',
    password: '',
  })

  loginForm = form(this.loginModel, (schemaPath) => {
    required(schemaPath.email);
    required(schemaPath.password);

    email(schemaPath.email);

    minLength(schemaPath.password, 8);
    maxLength(schemaPath.password, 16);
  })

  login() {
    this.loginProcess.update(() => true);
    this.authService.loginUser(this.loginModel()).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        if(res.success) {
          this.openSnackBar(res.message);
          return this.loginProcess.update(() => false);
        }
        this.openSnackBar(res.message, 'error');
        return this.loginProcess.update(() => false);
      },
      error: (err) => {
        this.openSnackBar(err.message, 'error');
        this.loginProcess.update(() => false);
      }
    })
  }

  private openSnackBar(message: string, type: 'error' | 'success' = 'success') {
    this._snackBar.openFromComponent(MessageSnackBar, {
      panelClass: `${type}-panel`,
      data: message,
      duration: 3000,
    });
  }
}

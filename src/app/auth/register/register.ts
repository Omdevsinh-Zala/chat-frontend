import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { email, Field, form, maxLength, minLength, required } from '@angular/forms/signals';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MessageSnackBar } from '../../helpers/message-snack-bar/message-snack-bar';
import { RegisterModel } from '../../models/auth.model';
import { AuthService } from '../../services/auth-service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [MatProgressSpinnerModule, Field, MatIcon, MatTooltipModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  registerProcess = signal(false);
  showPass = signal(false);
  authService = inject(AuthService);
  destroyRef = inject(DestroyRef);
  router = inject(Router);

  registerModel = signal<RegisterModel>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  })

  registerForm = form(this.registerModel, (schemaPath) => {
    required(schemaPath.firstName, { message: 'First name is required.' });
    required(schemaPath.lastName, { message: 'Last name is required.' });
    required(schemaPath.email, { message: 'Email is required.' });
    required(schemaPath.password, { message: 'Password is required.' });

    email(schemaPath.email, { message: 'Please enter valid email.' });

    minLength(schemaPath.firstName, 2, { message: 'First name must be at least 2 characters long.' });
    maxLength(schemaPath.firstName, 12, { message: 'First name must not exceed 12 characters.' });
    minLength(schemaPath.lastName, 2, { message: 'Last name must be at least 2 characters long.' });
    maxLength(schemaPath.lastName, 12, { message: 'Last name must not exceed 12 characters.' });
    minLength(schemaPath.password, 8, { message: 'Password must be at least 8 characters long.' });
    maxLength(schemaPath.password, 16, { message: 'Password must not exceed 16 characters.' });
  })

  register(event: Event) {
    event.preventDefault();
    this.registerProcess.update(() => true);
    this.authService.registerUser(this.registerModel()).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        if(res.success) {
          this.registerProcess.update(() => false);
          return this.router.navigate(['/login']);
        }
        return this.registerProcess.update(() => false);
      },
      error: () => {
        this.registerProcess.update(() => false);
      }
    })
  }
}

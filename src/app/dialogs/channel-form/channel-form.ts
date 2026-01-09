import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../../services/user-service';
import { Field, form, maxLength, minLength, pattern, required } from '@angular/forms/signals';
import { CreateChannel } from '../../models/channel';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-channel-form',
  imports: [
    MatDialogModule,
    Field,
    MatFormFieldModule,
    MatProgressSpinner,
    MatRadioModule,
    MatCheckbox,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './channel-form.html',
  styleUrl: './channel-form.css',
})
export class ChannelForm implements OnInit {
  private dialogRef = inject(MatDialogRef<ChannelForm>);
  data = inject<CreateChannel>(MAT_DIALOG_DATA);
  private userService = inject(UserService);
  private destroyRef = inject(DestroyRef);

  isCreating = signal<boolean>(false);

  ngOnInit(): void {
    if (this.data) {
      this.channelFormModel.set(this.data);
    }
  }

  backendFormValidationErrors = signal<CreateChannel | null>(null);

  channelFormModel = signal<CreateChannel>({
    title: 'The ghost hunters',
    topic: 'Hunting ghost is priority',
    description: 'We hunt ghost from all around the world. Have ghost problem contact us.',
    isPrivate: false,
  });

  channelForm = form(this.channelFormModel, (schemaPath) => {
    required(schemaPath.title, { message: 'Title is required.' });
    pattern(schemaPath.title, /^[A-Za-z\s'-]+$/, {
      message: 'Title can only contain letters, apostrophes, and hyphens.',
    });
    minLength(schemaPath.title, 2, { message: 'Title must be at least 2 characters long.' });
    maxLength(schemaPath.title, 20, { message: 'Title must not exceed 20 characters.' });

    required(schemaPath.topic, { message: 'Topic is required.' });
    pattern(schemaPath.topic, /^[A-Za-z\s'-]+$/, {
      message: 'Topic can only contain letters, spaces, apostrophes, and hyphens.',
    });
    minLength(schemaPath.topic, 3, { message: 'Topic must be at least 2 characters long.' });
    maxLength(schemaPath.topic, 50, { message: 'Topic must not exceed 20 characters.' });

    required(schemaPath.description, { message: 'Description is required.' });
    pattern(schemaPath.description, /^[A-Za-z0-9\s'-.]+$/, {
      message:
        'Description can only contain letters, numbers, spaces, apostrophes, hyphens and periods.',
    });
    minLength(schemaPath.description, 3, {
      message: 'Description must be at least 3 characters long.',
    });
    maxLength(schemaPath.description, 1000, {
      message: 'Description must not exceed 100 characters.',
    });
  });

  createChannel() {
    this.isCreating.update(() => true);
    this.userService
      .createChannel(this.channelFormModel())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.isCreating.update(() => false);
            this.dialogRef.close(res.data);
          }
        },
        error: (err) => {
          this.isCreating.update(() => false);
          if (err.error && err.error.data) {
            this.backendFormValidationErrors.update(() => err.error.data);
            setTimeout(() => {
              this.backendFormValidationErrors.update(() => null);
            }, 5000);
          }
        },
      });
  }
}

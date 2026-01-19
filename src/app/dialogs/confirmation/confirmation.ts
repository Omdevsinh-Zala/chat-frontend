import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmationData {
  title: string;
  message: string;
  confirmJson?: string;
  isCritical?: boolean;
}

@Component({
  selector: 'app-confirmation',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.css',
})
export class Confirmation {
  readonly dialogRef = inject(MatDialogRef<Confirmation>);
  readonly data = inject<ConfirmationData>(MAT_DIALOG_DATA);

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onYesClick(): void {
    this.dialogRef.close(true);
  }
}

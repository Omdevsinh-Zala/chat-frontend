import { Component, inject, signal } from '@angular/core';
import {
  MAT_SNACK_BAR_DATA,
  MatSnackBar,
  MatSnackBarAction,
  MatSnackBarActions,
  MatSnackBarLabel,
  MatSnackBarRef,
} from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-message-snack-bar',
  imports: [MatButtonModule, MatSnackBarLabel, MatSnackBarActions, MatSnackBarAction],
  templateUrl: './message-snack-bar.html',
  styleUrl: './message-snack-bar.css',
})
export class MessageSnackBar {
  snackBarRef = inject(MatSnackBarRef<MessageSnackBar>);
  data = signal(inject<string>(MAT_SNACK_BAR_DATA));
}

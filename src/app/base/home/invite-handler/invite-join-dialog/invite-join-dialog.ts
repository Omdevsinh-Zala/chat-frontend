import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SocketConnection } from '../../../../services/socket-connection';
import { ImageUrlPipe } from '../../../../image-url-pipe';

@Component({
  selector: 'app-invite-join-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, ImageUrlPipe],
  templateUrl: './invite-join-dialog.html',
  styleUrl: './invite-join-dialog.css',
})
export class InviteJoinDialog {
  data = inject<{ channel: any; token: string }>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<InviteJoinDialog>);
  private socketService = inject(SocketConnection);

  join() {
    this.socketService.socket.emit('joinByInviteToken', { token: this.data.token });
    this.dialogRef.close();
  }

  cancel() {
    this.dialogRef.close();
  }
}

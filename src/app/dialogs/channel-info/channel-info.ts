import { Component, inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatIcon } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { UserService } from '../../services/user-service';
import { environment } from '../../../environments/environment';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { SocketConnection } from '../../services/socket-connection';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MessageSnackBar } from '../../helpers/message-snack-bar/message-snack-bar';

@Component({
  selector: 'app-channel-info',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatProgressSpinner,
    MatIcon,
    MatCardModule,
    Menu,
    MenuContent,
    MenuItem,
    MenuTrigger,
    OverlayModule,
    MatSnackBarModule,
  ],
  templateUrl: './channel-info.html',
  styleUrl: './channel-info.css',
})
export class ChannelInfo implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<ChannelInfo>);
  userService = inject(UserService);
  private socketService = inject(SocketConnection);
  readonly imagePath = environment.imageUrl;
  private router = inject(Router);
  data = inject<{ id: string; inviteBy: string; fromGroup: boolean }>(MAT_DIALOG_DATA);
  private _snackbar = inject(MatSnackBar);

  formatMenu = viewChild<Menu<string>>('formatMenu');
  categorizeMenu = viewChild<Menu<string>>('categorizeMenu');

  loading = signal(true);
  expendText = signal(false);

  channelData = signal<any>({});

  ngOnInit(): void {
    if (this.data.id) {
      this.getChannelData();
    } else {
      this.loading.set(false);
    }

    this.socketService.socket.on('redirectToChannel', (data) => {
      this.redirect(data.redirectId);
    });

    this.socketService.socket.on('leaveChannelErrorMessage', (data) => {
      this._snackbar.openFromComponent(MessageSnackBar, {
        panelClass: 'error-panel',
        duration: 4000,
        data: data.error,
      });
    });

    this.socketService.socket.on('joinChannelErrorMessage', (data) => {
      this._snackbar.openFromComponent(MessageSnackBar, {
        panelClass: 'error-panel',
        duration: 4000,
        data: data.error,
      });
    });

    this.socketService.socket.on('removeUserErrorMessage', (data) => {
      this._snackbar.openFromComponent(MessageSnackBar, {
        panelClass: 'error-panel',
        duration: 4000,
        data: data.error,
      });
    });
  }

  getChannelData() {
    this.userService.getChannelData(this.data.id).subscribe((res) => {
      this.channelData.set(res.data);
      this.loading.set(false);
    });
  }

  joinChannel() {
    this.socketService.socket.emit('joinChannel', {
      channelId: this.data.id,
      inviteBy: this.data.inviteBy,
    });
  }

  leaveChannel() {
    this.socketService.socket.emit('leaveChannel', {
      channelId: this.data.id,
    });
  }

  onMenuAction(action: string, member: any) {
    if (action === 'Remove') {
      this.socketService.socket.emit('removeUser', {
        channelId: this.data.id,
        userId: member.id,
      });
    }
  }

  redirect(id?: string) {
    if (id) {
      this.router.navigate(['/home/channel', id]);
      this.dialogRef.close();
    } else {
      this.router.navigateByUrl('/home');
      this.dialogRef.close();
    }
  }

  close() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.socketService.socket.off('redirectToChannel');
    this.socketService.socket.off('joinChannelErrorMessage');
    this.socketService.socket.off('leaveChannelErrorMessage');
    this.socketService.socket.off('removeUserErrorMessage');
  }
}

import { Component, inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
  MatDialog,
} from '@angular/material/dialog';
import { Confirmation } from '../confirmation/confirmation';
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
  private dialog = inject(MatDialog);
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

    this.socketService.socket.on('memberRoleUpdated', () => {
      this.getChannelData();
    });

    this.socketService.socket.on('channelDeleted', (data) => {
      this._snackbar.openFromComponent(MessageSnackBar, {
        panelClass: 'error-panel',
        duration: 4000,
        data: 'This channel has been deleted',
      });
      this.redirect();
    });

    this.socketService.socket.on('updateRoleError', (data) => {
      this._snackbar.openFromComponent(MessageSnackBar, {
        panelClass: 'error-panel',
        duration: 4000,
        data: data.error,
      });
    });

    this.socketService.socket.on('userRemoved', () => {
      this.getChannelData();
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
    } else if (action === 'Promote as Admin') {
      this.socketService.socket.emit('updateMemberRole', {
        channelId: this.data.id,
        userId: member.id,
        role: 'admin',
      });
    } else if (action === 'Promote as Owner') {
      // Confirm ownership transfer
      const dialogRef = this.dialog.open(Confirmation, {
        data: {
          title: 'Transfer Ownership',
          message: `Are you sure you want to transfer ownership to ${member.full_name}? You will become an admin.`,
          confirmJson: 'Transfer',
          isCritical: true, // It's a significant action
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.socketService.socket.emit('updateMemberRole', {
            channelId: this.data.id,
            userId: member.id,
            role: 'owner',
          });
        }
      });
    } else if (action === 'Demote as Member') {
      this.socketService.socket.emit('updateMemberRole', {
        channelId: this.data.id,
        userId: member.id,
        role: 'member',
      });
    }
  }

  redirect(id?: string) {
    if (id) {
      this.router.navigate(['/chat/channel', id]);
      this.dialogRef.close();
    } else {
      this.router.navigateByUrl('/chat');
      this.dialogRef.close();
    }
  }

  close() {
    this.dialogRef.close();
  }

  deleteChannel() {
    const dialogRef = this.dialog.open(Confirmation, {
      data: {
        title: 'Delete Channel',
        message: 'Are you sure you want to delete this channel? This action cannot be undone.',
        confirmJson: 'Delete',
        isCritical: true,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.socketService.socket.emit('deleteChannel', {
          channelId: this.data.id,
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.socketService.socket.off('redirectToChannel');
    this.socketService.socket.off('joinChannelErrorMessage');
    this.socketService.socket.off('leaveChannelErrorMessage');
    this.socketService.socket.off('removeUserErrorMessage');
    this.socketService.socket.off('memberRoleUpdated');
    this.socketService.socket.off('channelDeleted');
    this.socketService.socket.off('updateRoleError');
    this.socketService.socket.off('userRemoved');
  }
}

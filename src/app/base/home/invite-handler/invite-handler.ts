import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketConnection } from '../../../services/socket-connection';
import { MatDialog } from '@angular/material/dialog';
import { InviteJoinDialog } from './invite-join-dialog/invite-join-dialog';

@Component({
  selector: 'app-invite-handler',
  imports: [],
  templateUrl: './invite-handler.html',
  styleUrl: './invite-handler.css',
})
export class InviteHandler implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
    private router = inject(Router);
    private socketService = inject(SocketConnection);
    private dialog = inject(MatDialog);
  
    ngOnInit() {
      const token = this.route.snapshot.paramMap.get('token');
      if (!token) {
        this.router.navigate(['/chat']);
        return;
      }
  
      // Wait for connection if needed
      if (!this.socketService.isConnected()) {
        this.socketService.socket.once('connect', () => this.validate(token));
        this.socketService.connectSocket();
      } else {
        this.validate(token);
      }
  
      this.socketService.socket.on('inviteTokenValid', ({ channel }) => {
        const dialogRef = this.dialog.open(InviteJoinDialog, {
          data: { channel, token },
          disableClose: true,
          width: '350px',
          panelClass: 'small-corners-dialog',
        });
  
        dialogRef.afterClosed().subscribe(() => {
          this.router.navigate(['/chat']);
        });
      });
  
      this.socketService.socket.on('validateInviteTokenError', ({ error }) => {
        this.router.navigate(['/chat']);
      });
  
      this.socketService.socket.on('joinByInviteTokenError', ({ error }) => {
        this.router.navigate(['/chat']);
      });
    }
  
    private validate(token: string) {
      this.socketService.socket.emit('validateInviteToken', { token });
    }
  
    ngOnDestroy() {
      this.socketService.socket.off('inviteTokenValid');
      this.socketService.socket.off('validateInviteTokenError');
      this.socketService.socket.off('joinByInviteTokenError');
    }
}

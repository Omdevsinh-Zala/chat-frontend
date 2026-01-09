import { Component, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { UserService } from '../../services/user-service';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { environment } from '../../../environments/environment';
import { MatIcon } from "@angular/material/icon";
import { Router } from '@angular/router';

@Component({
  selector: 'app-channel-info',
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinner, MatIcon],
  templateUrl: './channel-info.html',
  styleUrl: './channel-info.css',
})
export class ChannelInfo implements OnInit {
  private dialogRef = inject(MatDialogRef<ChannelInfo>);
  private userService = inject(UserService);
  readonly imagePath = environment.imageUrl;
  private router = inject(Router);
  private data = inject<{ id: string, inviteBy: string }>(MAT_DIALOG_DATA);

  loading = signal(true);
  expendText = signal(false);

  channelData = signal<any>({});

  ngOnInit(): void {
    if(this.data.id) {
      this.userService.getChannelData(this.data.id).subscribe((res) => {
        this.channelData.set(res.data);
        this.loading.set(false);
      });
    } else {
      this.loading.set(false);
    }
  }

  joinChannel() {
    this.userService.joinChannel(this.channelData().id, this.data?.inviteBy ? this.data.inviteBy : null).subscribe((res) => {
      if(res.success && res.data) {
        this.redirect(this.channelData().id);
      }
    });
  }

  redirect(id: string) {
    this.router.navigate(['/home/channel', id]);
    this.dialogRef.close();
  }

  close() {
    this.dialogRef.close();
  }
}

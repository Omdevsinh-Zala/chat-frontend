import { Component, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../../services/user-service';
import { User } from '../../models/user';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { environment } from '../../../environments/environment';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-profile-info',
  imports: [MatDialogModule, MatProgressSpinner, MatButton, MatCardModule],
  templateUrl: './profile-info.html',
  styleUrl: './profile-info.css',
})
export class ProfileInfo implements OnInit {
  private dialogRef = inject(MatDialogRef<ProfileInfo>);
  private userService = inject(UserService);
  data = inject<{ id: string }>(MAT_DIALOG_DATA);
  readonly imagePath = environment.imageUrl;

  loading = signal(true);

  profileData = signal<User | undefined | null>(null);

  ngOnInit(): void {
    this.getProfileData(this.data.id);
  }

  getProfileData(id: string) {
    this.userService.getProfileData(id).subscribe((res) => {
      this.profileData.set(res.data);
      this.loading.set(false);
    });
  }

  close() {
    this.dialogRef.close();
  }
}

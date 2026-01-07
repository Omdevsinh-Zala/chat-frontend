import { Component, computed, DestroyRef, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterOutlet, RouterLinkWithHref, Router, RouterLinkActive } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth-service';
import { UserService } from '../services/user-service';
import { map } from 'rxjs';
import { SocketConnection } from '../services/socket-connection';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { Settings } from '../dialogs/settings/settings';

@Component({
  selector: 'app-base',
  imports: [RouterOutlet, MatSidenavModule, MatIcon, MatButtonModule, MatTooltip, MatMenuModule, RouterLinkWithHref, RouterLinkActive],
  templateUrl: './base.html',
  styleUrl: './base.css',
})
export class Base {
  private userService = inject(UserService);
  user = computed(() => {
    return this.userService.user()
  });
  imagePath = environment.imageUrl;
  private authService = inject(AuthService);
  private router = inject(Router);
  private socketConnection = inject(SocketConnection)
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);

  logout() {
    this.authService.logoutUser().pipe(
      map(async (promiseRes) => {
        const res = await promiseRes;
        if(res.success) {
          this.socketConnection.disconnectSocket();
        }
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  openSettings() {
    this.dialog.open(Settings, {
      maxWidth: '100%',
      maxHeight: '100%',
      width: '70%',
      height: '70%',
    });
  }
}

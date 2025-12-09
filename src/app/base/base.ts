import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterOutlet, RouterLinkWithHref, Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth-service';
import { UserService } from '../services/user-service';

@Component({
  selector: 'app-base',
  imports: [RouterOutlet, MatSidenavModule, MatIcon, MatButtonModule, MatTooltip, MatMenuModule, RouterLinkWithHref],
  templateUrl: './base.html',
  styleUrl: './base.css',
})
export class Base {
  private userService = inject(UserService);
  user = computed(() => this.userService.user());
  imagePath = environment.imageUrl;
  private authService = inject(AuthService);
  private router = inject(Router);

  logout() {
    this.authService.logoutUser().subscribe();
  }
}

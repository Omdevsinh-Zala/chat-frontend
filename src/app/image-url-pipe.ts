import { inject, Pipe, PipeTransform } from '@angular/core';
import { UserService } from './services/user-service';
import { environment } from '../environments/environment';

@Pipe({
  name: 'imageUrl',
})
export class ImageUrlPipe implements PipeTransform {
  userService = inject(UserService);
  imageUrl = environment.imageBaseUrl;

  transform(value: string, isProfileImage: boolean = false): string {
    const token = this.userService.b2AuthToken();
    const profileToken = this.userService.profileToken();
    if (isProfileImage) {
      return profileToken ? `${this.imageUrl}profileImages/${value}?Authorization=${profileToken}` : `${this.imageUrl}profileImages/${value}`;
    }
    return token ? `${this.imageUrl}${value}?Authorization=${token}` : `${this.imageUrl}${value}`;
  }

}

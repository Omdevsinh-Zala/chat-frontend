import { Component, inject, input } from '@angular/core';
import { AttachmentsType } from '../../../../../models/chat';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { AssetView } from '../../../../../dialogs/asset-view/asset-view';
import { UserService } from '../../../../../services/user-service';
import { ImageUrlPipe } from '../../../../../image-url-pipe';

@Component({
  selector: 'app-single-asset',
  imports: [MatIcon, ImageUrlPipe],
  templateUrl: './single-asset.html',
  styleUrl: './single-asset.css',
})
export class SingleAsset {
  attachments = input<AttachmentsType[]>([]);
  isTablet = input<boolean>(false);
  private dialog = inject(MatDialog);
  private userData = inject(UserService);

  viewAssets(attachment: AttachmentsType[], index: number) {
    this.dialog.open(AssetView, {
      maxWidth: '100%',
      maxHeight: '100%',
      width: this.isTablet() ? '100dvh' : '70%',
      height: this.isTablet() ? '100dvh' : '70%',
      panelClass: 'small-corners-dialog',
      data: {
        user: this.userData.user(),
        attachments: attachment,
        index: index,
      },
    });
  }

  isPdf(attachment: any): boolean {
    return attachment.file_type === 'pdf';
  }

  isImage(attachment: any): boolean {
    return attachment.file_type === 'image';
  }

  isVideo(attachment: any): boolean {
    return attachment.file_type === 'video';
  }
}

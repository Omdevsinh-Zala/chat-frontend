import { Component, computed, inject, input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../../../../environments/environment';
import { AssetView } from '../../../../../dialogs/asset-view/asset-view';
import { AttachmentsType } from '../../../../../models/chat';
import { UserService } from '../../../../../services/user-service';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-multi-assets',
  imports: [MatIcon],
  templateUrl: './multi-assets.html',
  styleUrl: './multi-assets.css',
})
export class MultiAssets {
  attachments = input<AttachmentsType[]>([]);
  isTablet = input<boolean>(false);
  imagePath = environment.imageUrl;
  private dialog = inject(MatDialog);
  private userData = inject(UserService);

  mediaAttachments = computed(() =>
    this.attachments().filter((att) => att.file_type === 'image' || att.file_type === 'video')
  );

  pdfAttachments = computed(() => this.attachments().filter((att) => att.file_type === 'pdf'));

  viewAssets(attachment: AttachmentsType[], index: number) {
    this.dialog.open(AssetView, {
      maxWidth: '100%',
      maxHeight: '100%',
      width: this.isTablet() ? '100%' : '70%',
      height: this.isTablet() ? '100%' : '70%',
      panelClass: 'small-corners-dialog',
      data: {
        user: this.userData.user(),
        attachments: attachment,
        index: index,
        isObjectUrl: false,
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

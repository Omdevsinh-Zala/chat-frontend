import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { SwiperOptions } from 'swiper/types';
import { environment } from '../../../environments/environment';
import { AttachmentsType } from '../../models/chat';
import { User } from '../../models/user';
import { MatRippleModule } from '@angular/material/core';
import { ImageUrlPipe } from '../../image-url-pipe';
import { UserService } from '../../services/user-service';

@Component({
  selector: 'app-asset-view',
  imports: [MatDialogModule, MatIcon, MatTooltip, MatRippleModule, ImageUrlPipe],
  templateUrl: './asset-view.html',
  styleUrl: './asset-view.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AssetView implements AfterViewInit {
  private dialogRef = inject(MatDialogRef<AssetView>);
  readonly data = inject<{
    user: User;
    attachments: AttachmentsType[];
    index: number;
    isObjectUrl: boolean;
  }>(MAT_DIALOG_DATA);

  imagePath = environment.imageBaseUrl;
  private userService = inject(UserService);
  private b2AuthToken = this.userService.b2AuthToken();

  sliderConfig: SwiperOptions = {
    slidesPerView: 1,
    initialSlide: this.data.index,
    loop: true,
    spaceBetween: 10,
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
  };

  assetSwiper = viewChild<ElementRef>('assetSwiper');

  ngAfterViewInit(): void {
    if (
      this.assetSwiper() &&
      this.assetSwiper()?.nativeElement &&
      this.data.attachments.length > 1
    ) {
      Object.assign(this.assetSwiper()?.nativeElement, this.sliderConfig);
      this.assetSwiper()?.nativeElement.initialize();
    }
  }

  close() {
    this.dialogRef.close();
  }

  download() {
    let attachment: AttachmentsType;

    if (this.data.attachments.length > 1 && this.assetSwiper()?.nativeElement) {
      const activeIndex = this.assetSwiper()?.nativeElement.swiper.realIndex;
      attachment = this.data.attachments[activeIndex];
    } else {
      attachment = this.data.attachments[0];
    }

    if (attachment) {
      const url = this.imagePath + attachment.file_url + `?Authorization=${this.b2AuthToken}`;
      const fileName = attachment.file_name;

      fetch(url)
        .then((response) => response.blob())
        .then((blob) => {
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        })
        .catch((error) => {
          console.error('Download failed:', error);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
    }
  }
}

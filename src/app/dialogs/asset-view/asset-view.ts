import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, inject, viewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { SwiperOptions } from 'swiper/types';
import { environment } from '../../../environments/environment';
import { AttachmentsType } from '../../models/chat';
import { User } from '../../models/user';

@Component({
  selector: 'app-asset-view',
  imports: [MatDialogModule, MatIcon, MatTooltip],
  templateUrl: './asset-view.html',
  styleUrl: './asset-view.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AssetView implements AfterViewInit {
  private dialogRef = inject(MatDialogRef<AssetView>);
  readonly data = inject<{ user: User, attachments: AttachmentsType[], index: number }>(MAT_DIALOG_DATA);

  imagePath = environment.imageUrl;

  sliderConfig: SwiperOptions = {
    slidesPerView: 1,
    initialSlide: this.data.index,
    loop: true,
    spaceBetween: 10,
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
  }

  assetSwiper = viewChild<ElementRef>('assetSwiper')

  ngAfterViewInit(): void {
    if(this.assetSwiper() && this.assetSwiper()?.nativeElement && this.data.attachments.length > 1) {
        Object.assign(this.assetSwiper()?.nativeElement, this.sliderConfig);
        this.assetSwiper()?.nativeElement.initialize();
      }
  }

  close() {
    this.dialogRef.close();
  }
}

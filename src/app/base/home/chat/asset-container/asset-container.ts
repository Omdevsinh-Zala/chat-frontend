import { Component, input } from '@angular/core';
import { AttachmentsType } from '../../../../models/chat';
import { SingleAsset } from './single-asset/single-asset';
import { MultiAssets } from './multi-assets/multi-assets';

@Component({
  selector: 'app-asset-container',
  imports: [SingleAsset, MultiAssets],
  templateUrl: './asset-container.html',
  styleUrl: './asset-container.css',
})
export class AssetContainer {
  attachments = input<AttachmentsType[]>([]);
  isTablet = input<boolean>(false);
}

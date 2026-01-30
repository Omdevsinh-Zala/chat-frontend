import {
  Component,
  EventEmitter,
  Output,
  ChangeDetectionStrategy,
  OnInit,
  AfterViewInit,
  viewChild,
  ElementRef,
  OnDestroy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Picker } from 'emoji-mart';
import { EmojiService } from '../../services/emoji-service';

@Component({
  selector: 'app-emoji-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './emoji-picker.html',
  styleUrl: './emoji-picker.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmojiPicker implements AfterViewInit, OnDestroy {
  @Output() emojiSelect = new EventEmitter<string>();
  private emojiService = inject(EmojiService);

  pickerContainer = viewChild<ElementRef<HTMLElement>>('pickerContainer');

  private pickerInstance: any;

  ngAfterViewInit() {
    this.initPicker();
  }

  ngOnDestroy() {
    // Cleanup if necessary
    if (this.pickerContainer()?.nativeElement) {
      this.pickerContainer()!.nativeElement.innerHTML = '';
    }
  }

  private initPicker() {
    const container = this.pickerContainer()?.nativeElement;
    if (!container) return;

    this.pickerInstance = new Picker({
      data: this.emojiService.emojiData,
      onEmojiSelect: (emoji: any) => {
        this.emojiSelect.emit(emoji.native);
      },
      set: 'native',
      theme: 'auto',
      previewPosition: 'bottom',
      skinTonePosition: 'search',
      searchPosition: 'sticky',
      navPosition: 'bottom',
      perLine: 8,
      noCountryFlags: false,
    });

    container.appendChild(this.pickerInstance as any);
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';
import { MessageSnackBar } from '../../helpers/message-snack-bar/message-snack-bar';

@Component({
  selector: 'app-cropper',
  imports: [ImageCropperComponent, MatDialogModule, MatButtonModule, MatProgressSpinner],
  templateUrl: './cropper.html',
  styleUrl: './cropper.css',
})
export class Cropper implements OnInit {
  private dialogRef = inject(MatDialogRef<Cropper>);
  private _snackbar = inject(MatSnackBar);
  private sanitizer = inject(DomSanitizer);
  private data = inject<File>(MAT_DIALOG_DATA);
  
  private imageBlog: Blob | null = null;
  imageFile: File | undefined = undefined;
  croppedImage: SafeUrl = '';
  loading = signal(true);
  isImageCropping = signal(true);

  ngOnInit(): void {
    this.imageFile = this.data;
  }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = this.sanitizer.bypassSecurityTrustUrl(event.objectUrl!);
    this.imageBlog = event.blob!;
    this.isImageCropping.set(false);
  }

  cropperReady() {
    this.loading.set(false);
  }

  startCropping() {
    this.isImageCropping.set(true);
  }

  loadImageFailed() {
    this._snackbar.openFromComponent(MessageSnackBar, {
      panelClass: 'error-panel',
      duration: 3000,
      data: 'Failed to load image.',
    });
  }

  close() {
    this.dialogRef.close(this.imageBlog);
    this.imageFile = undefined;
  }
}

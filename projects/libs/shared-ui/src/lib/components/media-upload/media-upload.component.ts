import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

interface UploadedFile {
  file: File;
  previewUrl: string | null;
  isImage: boolean;
}

@Component({
  selector: 'lib-media-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './media-upload.component.html',
  styleUrls: ['./media-upload.component.css']
})
export class MediaUploadComponent {
  @Input() title: string = 'Media Upload';
  @Input() subtitle: string = 'Add your documents here, and you can upload up to 5 files max';
  @Input() hint: string = 'Only support .jpg, .png and .svg and zip files';
  @Input() maxFiles: number = 5;
  @Input() maxSizeMB?: number;
  @Input() maxFileSize?: number;
  @Input() accept: string = '.jpg,.jpeg,.png,.svg,.zip';

  @Output() filesChanged = new EventEmitter<File[]>();
  @Output() close = new EventEmitter<void>();
  @Output() fileSizeExceeded = new EventEmitter<{ file: File, maxFileSize: number }>();

  uploadedFiles: UploadedFile[] = [];
  isDragging: boolean = false;
  errorMessage: string = '';

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    
    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFiles(files);
    }
  }

  replaceIndex: number | null = null;

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files) {
      this.handleFiles(files);
    }
  }

  handleFiles(files: FileList): void {
    this.errorMessage = '';
    const fileArray = Array.from(files);
    
    if (this.replaceIndex !== null && fileArray.length > 0) {
      const file = fileArray[0];
      if (this.isFileSizeValid(file)) {
        const isImage = file.type.startsWith('image/');
        const oldFile = this.uploadedFiles[this.replaceIndex];
        if (oldFile.previewUrl) {
          URL.revokeObjectURL(oldFile.previewUrl);
        }

        this.uploadedFiles[this.replaceIndex] = {
          file: file,
          previewUrl: isImage ? URL.createObjectURL(file) : null,
          isImage: isImage
        };
      } else {
        this.errorMessage = `File size of ${file.name} exceeds the limit of ${this.getFileLimitText()}`;
        this.fileSizeExceeded.emit({ file, maxFileSize: this.getFileLimitBytes() });
      }
      this.replaceIndex = null;
    } else {
      for (const file of fileArray) {
        if (this.uploadedFiles.length >= this.maxFiles) {
          break;
        }

        if (!this.isFileSizeValid(file)) {
          this.errorMessage = `File size of ${file.name} exceeds the limit of ${this.getFileLimitText()}`;
          this.fileSizeExceeded.emit({ file, maxFileSize: this.getFileLimitBytes() });
          continue;
        }

        const isImage = file.type.startsWith('image/');
        const uploadedFile: UploadedFile = {
          file: file,
          previewUrl: isImage ? URL.createObjectURL(file) : null,
          isImage: isImage
        };

        this.uploadedFiles.push(uploadedFile);
      }
    }

    this.emitFiles();
  }

  removeFile(index: number): void {
    this.errorMessage = '';
    const file = this.uploadedFiles[index];
    if (file.previewUrl) {
      URL.revokeObjectURL(file.previewUrl);
    }
    this.uploadedFiles.splice(index, 1);
    this.emitFiles();
  }

  emitFiles(): void {
    this.filesChanged.emit(this.uploadedFiles.map(f => f.file));
  }

  triggerFileInput(fileInput: HTMLInputElement, index: number | null = null): void {
    this.replaceIndex = index;
    fileInput.click();
  }

  onClose(): void {
    this.close.emit();
  }

  isFileSizeValid(file: File): boolean {
    if (this.maxFileSize !== undefined && this.maxFileSize !== null) {
      return file.size <= this.maxFileSize;
    }
    if (this.maxSizeMB !== undefined && this.maxSizeMB !== null) {
      return file.size <= this.maxSizeMB * 1024 * 1024;
    }
    return true;
  }

  getFileLimitText(): string {
    if (this.maxFileSize !== undefined && this.maxFileSize !== null) {
      return this.formatBytes(this.maxFileSize);
    }
    if (this.maxSizeMB !== undefined && this.maxSizeMB !== null) {
      return `${this.maxSizeMB}MB`;
    }
    return '';
  }

  getFileLimitBytes(): number {
    if (this.maxFileSize !== undefined && this.maxFileSize !== null) {
      return this.maxFileSize;
    }
    if (this.maxSizeMB !== undefined && this.maxSizeMB !== null) {
      return this.maxSizeMB * 1024 * 1024;
    }
    return 0;
  }

  formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}

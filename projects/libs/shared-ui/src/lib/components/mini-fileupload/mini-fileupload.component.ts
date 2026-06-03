import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-mini-fileupload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mini-fileupload.component.html',
  styleUrls: ['./mini-fileupload.component.css']
})
export class MiniFileuploadComponent {
  @Input() height: string = '35px';
  @Input() width: string = '100%';
  @Input() accept: string = '*';
  @Input() placeholder: string = 'No file chosen';
  @Input() typeHint: string = '';
  @Input() showTypeHint: boolean = false;
  @Input() maxFileSize?: number;
  
  @Output() fileChange = new EventEmitter<File | null>();
  @Output() fileSizeExceeded = new EventEmitter<{ file: File, maxFileSize: number }>();

  selectedFileName: string = '';
  errorMessage: string = '';

  onFileSelected(event: any): void {
    this.errorMessage = '';
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (this.maxFileSize !== undefined && this.maxFileSize !== null && file.size > this.maxFileSize) {
        this.errorMessage = `File size of ${file.name} exceeds the limit of ${this.formatBytes(this.maxFileSize)}`;
        this.fileSizeExceeded.emit({ file, maxFileSize: this.maxFileSize });
        this.selectedFileName = '';
        this.fileChange.emit(null);
        return;
      }
      this.selectedFileName = file.name;
      this.fileChange.emit(file);
    }
  }

  triggerFileInput(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  onInputClick(event: any): void {
    this.errorMessage = '';
    event.target.value = null;
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

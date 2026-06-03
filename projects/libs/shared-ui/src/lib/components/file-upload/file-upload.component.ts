import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-file-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent {
  @Input() accept: string = '*';
  @Input() width: string = '440px';
  @Input() title: string = 'Select a file or drag and drop here';
  @Input() hint: string = 'PDF file size no more than 10MB';
  @Input() maxFileSize?: number;
  
  @Output() fileChange = new EventEmitter<File | null>();
  @Output() fileSizeExceeded = new EventEmitter<{ file: File, maxFileSize: number }>();

  errorMessage: string = '';

  isDragging: boolean = false;
  selectedFile: File | null = null;

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
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  handleFile(file: File): void {
    this.errorMessage = '';
    if (this.maxFileSize !== undefined && this.maxFileSize !== null && file.size > this.maxFileSize) {
      this.errorMessage = `File size of ${file.name} exceeds the maximum limit of ${this.formatBytes(this.maxFileSize)}`;
      this.fileSizeExceeded.emit({ file, maxFileSize: this.maxFileSize });
      this.selectedFile = null;
      this.fileChange.emit(null);
      return;
    }
    this.selectedFile = file;
    this.fileChange.emit(file);
  }

  triggerFileInput(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  onInputClick(event: any): void {
    this.errorMessage = '';
    event.target.value = null;
  }

  clearSelection(event: MouseEvent): void {
    event.stopPropagation();
    this.errorMessage = '';
    this.selectedFile = null;
    this.fileChange.emit(null);
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

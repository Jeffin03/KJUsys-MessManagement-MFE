import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  HostListener,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ButtonComponent, FileUploadComponent } from '@libs/shared-ui';
import { environment } from '../../../../../environments/environment';
import { API_ENDPOINTS } from '../../../../shared/constants/api-endpoints';
import { SharedToastService } from '@libs/shared-toast';

@Component({
  selector: 'app-bulk-upload-modal',
  standalone: true,
  imports: [CommonModule, ButtonComponent, FileUploadComponent],
  templateUrl: './bulk-upload-modal.component.html',
  styleUrls: ['./bulk-upload-modal.component.css']
})
export class BulkUploadModalComponent implements OnChanges {
  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.isOpen) this.onClose();
  }

  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() uploaded = new EventEmitter<void>();

  selectedFile: File | null = null;
  uploading = false;
  uploadResult: string | null = null;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private toastService: SharedToastService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (this.isOpen) {
        this.selectedFile = null;
        this.uploadResult = null;
      }
    }
  }

  onFileChange(file: File | null): void {
    this.selectedFile = file;
    this.uploadResult = null;
  }

  onUpload(): void {
    if (!this.selectedFile) return;
    this.uploading = true;
    this.uploadResult = null;
    this.cdr.detectChanges();

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.http.post(`${environment.baseUrl}${API_ENDPOINTS.STUDENTS_BULK_UPLOAD}`, formData).subscribe({
      next: (res: any) => {
        this.uploading = false;
        const data = res?.responseData?.data || res?.data || res;
        const created = data.created || 0;
        const errors = data.errors || 0;
        const total = data.total || 0;
        this.uploadResult = `Upload complete: ${created} created, ${errors} errors out of ${total} total.`;
        this.toastService.success(`Bulk upload complete: ${created} subscribers created.`);
        this.uploaded.emit();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.uploading = false;
        const msg = err?.error?.responseData?.data?.error
          || err?.error?.responseData?.data?.message
          || err?.error?.error
          || 'Please check the file format and try again.';
        this.uploadResult = `Upload failed: ${msg}`;
        this.toastService.error(msg);
        this.cdr.detectChanges();
      }
    });
  }

  onClose(): void {
    this.selectedFile = null;
    this.uploadResult = null;
    this.close.emit();
  }
}

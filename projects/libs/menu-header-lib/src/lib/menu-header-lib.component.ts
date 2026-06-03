import { ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Inject, Input, NgZone, OnDestroy, OnInit, Output } from '@angular/core';
import { MenuHeaderLibService } from './menu-header-lib.service';

import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, fromEvent, map, Observable, of, Subscription, take, takeUntil, timeout, timer } from 'rxjs';
import { AuthService, HamburgerService, SidebarService } from '@libs/shared-auth';

import { Modal } from 'flowbite';
import { ChangePasswordService } from './change-password.service';
import { HttpCommonService } from '@libs/http-common';
import { HttpClient } from '@angular/common/http';

interface StudentProfileResponse {
  statusCode: number;
  
  type: string;
  responseData: {
    data: {
      documentCollectionStatus_DocumentCollection_Text: string;
      studentSemesterType_ErpStudentProfile_Text: any;
      _id: string;
      studentName_ErpStudentProfile_Text: string;
      studentDateOfBirth_ErpStudentProfile_Date: string;
      studentGender_ErpStudentProfile_Text: string;
      applicationNumber_ErpStudentProfile_Text: string;
      studentAllottedProgramName_ErpStudentProfile_Text: string;
      studentFeeCategory_ErpStudentProfile_Text: string;
      studentSemester_ErpStudentProfile_Int: string;
      academicYear_KJUSYSCommon_Text: string;
      isActive_KJUSYSCommon_Bool: boolean;
      studentRollNumber_ErpStudentProfile_Text: string;
      studentIdCardPhoto_ErpStudentProfile_File: string;
    };
    message: string[];
  };
}

@Component({
  selector: 'lib-menu-header-lib',
  templateUrl: './menu-header-lib.component.html',
  styleUrls: ['./menu-header-lib.component.css'],
})
export class MenuHeaderLibComponent implements OnInit, OnDestroy {
showDownloads = false;
  isOpen = false; // Controls modal visibility
  isPasswordModalOpen = false;

  @Output() menuToggle = new EventEmitter<boolean>();
  @Input() currentUser: any;
  @Input() leftMenuObject: any;
  @Input() baseurl: any;

  studentProfile = {
    name: '',
    registerNumber: '',
    rollNumber: '',
    dateOfBirth: '',
    gender: '',
    course: '',
    academicSession: '',
    feeCategory: '',
    campus: 'Main Campus',
    status: 'Active',
    year: '',
    profileImage: '',
    submissionStatus: '',
  };


  location_crl = new FormControl('');
  pinButton: boolean = false;
  response_data: any;
  toggle: boolean = false;
  pinIndex!: number;
  stateOfButton!: boolean[];
  breadcrumb: any = [];
  submenu: any = [];
  menuName: any = '';
  leftMenu: any;
  id!: string | null;
  previewImage: string | ArrayBuffer | null = null;
  birthdays: any;
  data$!: Observable<any>;
  userDetails: any;
  employeeShotText: any;
  colorCode = '#2196F3';
  locations$!: Observable<any>;
  stateData!: any;
  passwordForm!: FormGroup;
  isStudent:boolean = false;


  currentPasswordVisible: boolean = false;
  newPasswordVisible: boolean = false;
  confirmPasswordVisible: boolean = false;

  private passwordChangeSubscription: Subscription | null = null;

  public submitted = false;  // Form submission flag



  // password criteria
  hasCapitalAndSmall: boolean = false;
  hasMinLength: boolean = false;
  hasSpecialChars: boolean = false;
  hasNumeric: boolean = false;

  // Dropdown 1 controls
  isnotificationDropdownOpen1 = false;
  // Dropdown 2 controls

  isuserDropdownOpen2 = false;

  birthdayEmployees: any;
  employeeProfile: any;

  isMobileView = false;
  private subscription!: Subscription;

  private clickOutsideSub!: Subscription;

  constructor(
    private router: Router,
    public menuHeaderLibService: MenuHeaderLibService,
    public httpCommon: HttpCommonService ,
    private authService: AuthService,
    private fb: FormBuilder,
    private changePasswordService: ChangePasswordService,
    private cdr: ChangeDetectorRef,
    private hamburger: HamburgerService,
    private sidebarClose: SidebarService,
    private eRef: ElementRef,
    private ngZone: NgZone,
       private http:HttpClient,

  ) {
    this.passwordForm = this.fb.group(
      {
        oldPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(8), this.passwordValidator()]],
        confirmPassword: ['', [Validators.required, this.matchValues('newPassword')]],
      },
    );
    this.passwordForm.get('newPassword')?.valueChanges.subscribe(value => {
      this.checkPasswordCriteria(value);
    });

  }



  ngOnInit(): void {

      const rolesData = localStorage.getItem('rolesdata');
      // this.isStudent = rolesData ? rolesData.split(',').includes('STUDENT') : false;

      this.isStudent = rolesData 
  ? ['STUDENT', 'PHD SCHOLAR'].some(role => rolesData.split(',').includes(role)) 
  : false;

    this.clickOutsideSub = fromEvent(document, 'click').subscribe((event: Event) => {
      if (!this.eRef.nativeElement.contains(event.target)) {
        this.isuserDropdownOpen2 = false;
        this.isnotificationDropdownOpen1 = false
        this.cdr.detectChanges();
      }
  
    });
    

    this.subscription = this.hamburger.isMobileView$.subscribe(
      isMobile => {
        this.isMobileView = isMobile;
        this.cdr.detectChanges();
      }
    );
    this.stateData = history;
    this.leftMenu = Object.values(this.leftMenuObject);
   
    if(!this.isStudent){
   
 this.fetchProfileInfo();
    this.fetchBirthdayInfo();
    }
    if(this.isStudent){
          this.fetchStudentProfile();
    }
   
    const filteredData: any = this.leftMenu.filter((obj: any) => {
      return (
        obj.displayName.toUpperCase() ===
        this.menuHeaderLibService.breadcrumbs?.data?.breadcrumb?.module.toUpperCase()
      );
    });
    this.menuName = this.menuHeaderLibService.breadcrumbs?.data?.breadcrumb?.subModule;



  }

  

  passwordValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const value = control.value;
      if (!value) {
        return null; // Don't validate empty values to allow required validator to handle them
      }
      const hasUpperCase = /[A-Z]+/.test(value);
      const hasLowerCase = /[a-z]+/.test(value);
      const hasSpecialChar = /[\W_]+/.test(value);
      const hasNumeric = /[0-9]+/.test(value);
      const isValid = hasUpperCase && hasLowerCase && hasSpecialChar && hasNumeric;
      return !isValid ? { passwordComplexity: true } : null;
    };
  }
  navigateToHome() {
    this.router.navigate(['/kjusys']).then(() => {
      window.location.reload(); // 🔄 Full page reload
    });
  }
  

  matchValues(matchTo: string): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const formControl = control.root.get(matchTo);
      if (formControl) {
        const subscription = formControl.valueChanges.subscribe(() => {
          control.updateValueAndValidity();
          subscription.unsubscribe();
        });
      }
      return formControl?.value !== control?.value ? { notMatching: true } : null;
    };
  }

  checkPasswordCriteria(value: string): void {
    this.hasCapitalAndSmall = /[a-z]/.test(value) && /[A-Z]/.test(value);
    this.hasMinLength = value?.length >= 8;
    this.hasNumeric = /[0-9]/.test(value);
    this.hasSpecialChars = /[@$^!%*?&#]/.test(value) && /[0-9]/.test(value);
  }

  togglecurrentPasswordVisibility() {
    this.currentPasswordVisible = !this.currentPasswordVisible;
  }

  togglenewPasswordVisibility() {
    this.newPasswordVisible = !this.newPasswordVisible;
  }

  toggleConfirmPasswordVisibility() {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }

  onPasswordSubmit() {
    this.submitted = true;  // Mark form as submitted

    if (this.passwordForm.valid) {
      const jsonData = {
        "employeeOldPassword_HRCommon_Text": this.passwordForm.get('oldPassword')?.value,
        "userPassword_AuthCommon_Text": this.passwordForm.get('newPassword')?.value,
      };
      this.passwordChangeSubscription = this.changePasswordService.changePassword(jsonData).subscribe(
        (response: any) => {
          this.response_data = response.responseData;
          if (response.statusCode == 200) {
            alert(this.response_data.message);
            this.passwordForm.reset();
            this.submitted = false;  // Reset submitted flag after successful submission
            this.closePasswordModal();  // Assuming you have a method to close the modal
            //this.router.navigate(['/login']);
          } else {
            // Notify user that the current password is incorrect
            if (response.statusCode == 400 && response.responseData.message === 'Old Password is incorrect') {
              alert('The current password you entered is incorrect.');
            } else {

              alert(this.response_data.message);
            }
          }
        },
        (error: any) => {
          console.error('Error:', error);
          if (error.error instanceof ErrorEvent) {
            alert(this.response_data.message);
            //alert('Network error: Failed to submit the form.');
          } else {
            alert(this.response_data.message);
            //alert(`Failed to submit the form. Error: ${error.error.message}`);
          }
        }
      );
    }
  }

  onClick(): void {
    this.menuToggle.emit(true);
  }

  isSubmenu(): boolean {
    if (this.menuHeaderLibService.breadcrumbs.data.submenu) {
      this.location_crl.disable();
    } else {
      this.location_crl.enable();
    }
    return this.menuHeaderLibService.breadcrumbs.data.submenu;
  }

  mainMenuClick() {
    this.toggle = !this.toggle;
  }

  changeState(event: Event, index: any) {
    event.preventDefault();
    event.stopPropagation();
  }

  logout() {
    this.authService.logout();
  }

  isLogoutModalOpen: boolean = false;
  openLogoutModal() {
    this.isLogoutModalOpen = true;
  }

  closeLogoutModal() {
    this.isLogoutModalOpen = false;

  }

  // Toggle functions for each dropdown
  notificationtoggleDropdown1(event: MouseEvent): void{
    event.stopPropagation(); 
    this.isnotificationDropdownOpen1 = !this.isnotificationDropdownOpen1;
 // Process photos for each birthday entry
 this.birthdays.forEach((birthday: { employeeIdPhotoPath_ERPUserProfile_Text: string; photo: string; }) => {
  if (birthday.employeeIdPhotoPath_ERPUserProfile_Text) {
    // Check if photo exists in cache before downloading
    const cachedPhoto = this.getPhotoFromCache(birthday.employeeIdPhotoPath_ERPUserProfile_Text);
    if (cachedPhoto) {
      birthday.photo = cachedPhoto;
    } else {
      this.downloadPhoto(birthday.employeeIdPhotoPath_ERPUserProfile_Text, birthday);
    }
  } else {
    birthday.photo = '/assets/FF.png';
  }
});
    this.isuserDropdownOpen2 = false; // Close the second dropdown when opening the first
  }

  usertoggleDropdown2(event: MouseEvent): void {
    event.stopPropagation(); 
    this.isuserDropdownOpen2 = !this.isuserDropdownOpen2;
    this.isnotificationDropdownOpen1 = false; // Close the first dropdown when opening the second
  }

  get userIdInitial(): string {
    return this.currentUser?.userId ? this.currentUser.userId.charAt(0).toUpperCase() : '';
  }


  // openModal() {
  //   this.isOpen = true;
  //   this.isnotificationDropdownOpen1 = false; // Close dropdowns when opening modal
  //   this.isuserDropdownOpen2 = false;
  // }
openMyProfile(){
  this.router.navigate(['/kjusys/hr/user-profile']); 

}
  closeModal() {
    this.isOpen = false;
  }

  openPasswordModal() {
    this.resetForm();
    this.isPasswordModalOpen = true;
    const modalElement = document.getElementById('authentication-modal');
    const modal = new Modal(modalElement);
    modal.show();
    this.isnotificationDropdownOpen1 = false; // Close dropdowns when opening modal
    this.isuserDropdownOpen2 = false;
  }

  closePasswordModal() {
    const modalElement = document.getElementById('authentication-modal');
    // modalElement!.classList.add('hidden');
    const modal = new Modal(modalElement);
    modal.hide();

    this.passwordForm.reset();
    // Mark all form controls as untouched and pristine
    Object.keys(this.passwordForm.controls).forEach(key => {
      const control = this.passwordForm.get(key);
      if (control) {
        control.markAsPristine();
        control.markAsUntouched();
      }
    });
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const button1 = document.getElementById('dropdown1-button');
    const dropdown1 = document.getElementById('dropdown1-menu');
    const button2 = document.getElementById('dropdown2-button');
    const dropdown2 = document.getElementById('dropdown2-menu');

    // Close Dropdown 1 if clicked outside
    if (button1 && dropdown1 && !button1.contains(target) && !dropdown1.contains(target)) {
      this.isnotificationDropdownOpen1 = false;
    }
  }
    fetchStudentProfile() {
      this.studentProfile = {
        name: 'Student',
        registerNumber: '12345',
        rollNumber: '12345',
        dateOfBirth: '',
        gender: '',
        course: '',
        academicSession: '',
        feeCategory: '',
        campus: 'Main Campus',
        status: 'Active',
        year: '',
        profileImage: '',
        submissionStatus: '',
      };
      this.previewImage = '/assets/dummyprofile.png';
      this.cdr.detectChanges();
    }


  private formatDate(dateString: string): string {
    if (!dateString) return '';

    if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
      return dateString;
    }

    const parts = dateString.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    return dateString;
  }

    private downloadAndUploadPhoto(filePath: string) {
    const jsonData = {
      studentPhoto_ErpStudentProfile_File: filePath,
    };

    this.httpCommon
      .postData('/academics/student-photo', jsonData)
      .subscribe({
        next: (response: any) => {
          if (response.statusCode == 200 && response.type == 'SUCCESS') {
          
              this.previewImage = response.responseData.data.presignedUrl
              this.cdr.detectChanges();
          
          }else{
            this.previewImage = '/assets/dummyprofile.png'
            this.cdr.detectChanges();
          }
        },
        error: (error: any) => {
          
        },
      });
  }

  fetchProfileInfo() {
    this.employeeProfile = {
      employeeName_ERPUserProfile_Text: 'Administrator',
      employeeIdPhotoPath_ERPUserProfile_Text: ''
    };
    this.previewImage = '/assets/dummyprofile.png';
    this.cdr.detectChanges();
  }

  downloadFilePhoto(filePath: string) {
    const jsonData = {
      uploadedFilePath_KJUSYSCommon_Text: filePath,
    };

    this.httpCommon
      .postData('/hr/employee-id-photo-view', jsonData)
      .subscribe({
        next: (response: any) => {
          if (response.statusCode === 200 && response.type === 'SUCCESS') {
          
              const photoDataUrl = response.responseData.data.presignedUrl;
              this.previewImage = photoDataUrl;
              this.savePhotoToCache(filePath, photoDataUrl);
              this.cdr.detectChanges();
              // Set the preview image to the base64 string
           
          } else {
            // Handle empty response
            this.previewImage = '/assets/FF.png';
            this.cdr.detectChanges();
          }
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('Error downloading file:', error);
        },
      });
  }


  
  fetchBirthdayInfo() {
    this.birthdays = [];
    this.cdr.detectChanges();
  }
  
  downloadPhoto(filePath: string, birthday: any) {    
    const jsonData = {
      uploadedFilePath_KJUSYSCommon_Text: filePath,
    };
  
    this.httpCommon
      .postDataWithTimeout('/hr/employee-id-photo-view', jsonData, {}, 'json', 2000)
      .subscribe({
        next: (response: any) => {
          
          if (response.statusCode === 200 && response.type === 'SUCCESS') {
         
              const photoDataUrl = response.responseData.data.presignedUrl;
              birthday.photo = photoDataUrl;
              // Save photo to sessionStorage cache
              this.savePhotoToCache(filePath, photoDataUrl);
              this.cdr.detectChanges();
        
          } else {
            birthday.photo = '/assets/FF.png';
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          
          birthday.photo = '/assets/FF.png';
          this.cdr.detectChanges();
        }
      });
  }
  
  // Cache management methods using sessionStorage
  private getPhotoFromCache(filePath: string): string | null {
    try {
      // Use a cache key prefix to avoid potential conflicts
      const cacheKey = `photo_cache_${filePath}`;
      return sessionStorage.getItem(cacheKey);
    } catch (e) {
      console.error('Error reading from cache:', e);
      return null;
    }
  }
  
  private savePhotoToCache(filePath: string, photoDataUrl: string): void {
    try {
      // Use a cache key prefix to avoid potential conflicts
      const cacheKey = `photo_cache_${filePath}`;
      sessionStorage.setItem(cacheKey, photoDataUrl);
      
    } catch (e) {
      console.error('Error saving to cache:', e);
    }
  }
  
  // Method to clear cache on logout (still useful even with sessionStorage)
  clearPhotoCache(): void {
    // Get all keys in sessionStorage
    const keys = Object.keys(sessionStorage);
    
    // Remove only the photo cache entries
    keys.forEach(key => {
      if (key.startsWith('photo_cache_')) {
        sessionStorage.removeItem(key);
      }
    });
    
  }


  resetForm() {
    this.passwordForm.reset(); // Reset form controls
    Object.keys(this.passwordForm.controls).forEach(key => {
      const control = this.passwordForm.get(key);
      if (control) {
        control.markAsPristine();
        control.markAsUntouched();
      }
    });
    this.passwordForm.updateValueAndValidity(); // Force update of validation
  }

  ngOnDestroy() {
    // No need to manually remove the event listener since HostListener handles it.
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.clickOutsideSub) {
      this.clickOutsideSub.unsubscribe();
    }
  }
  toggleHamburger(event: Event) {
    event.stopPropagation();
    // this.hamburger.toggleSidebar();
    this.sidebarClose.toggleSidebar();
  }
  navigateToDownloads(){
this.ngZone.run(() => {
      this.router.navigate(['/kjusys/apps/downloads'])
        });
  }
   allDownloads: any[] = [];
   filteredDownloads: any[] = [];
   searchText: string = '';

fetchAllDownloads() {
  this.httpCommon.getData('/report-orchestrator/reports/jobs').subscribe({
    next: (response: any) => {
      this.allDownloads = response.responseData.data.sort((a: any, b: any) => {
        const dateStrA = a.jobCreatedOn_ReportOrchestrator_DateTime.replace(
          /^(\d{2})-(\d{2})-(\d{4})/, 
          '$3-$2-$1' 
        );
        const dateStrB = b.jobCreatedOn_ReportOrchestrator_DateTime.replace(
          /^(\d{2})-(\d{2})-(\d{4})/, 
          '$3-$2-$1'
        );
        
        const dateA = new Date(dateStrA);
        const dateB = new Date(dateStrB);
        
        return dateB.getTime() - dateA.getTime(); // Descending order (latest first)
      }).slice(0, 3);
      
      this.filteredDownloads = this.allDownloads;
      console.log("response (sorted)", this.allDownloads);
      this.cdr.detectChanges();
    }
  });
}
filterDownloads() {
  if (!this.searchText.trim()) {
    this.filteredDownloads = this.allDownloads;
  } else {
    this.filteredDownloads = this.allDownloads.filter(download =>
      download.reportType_ReportOrchestrator_Text
        .toLowerCase()
        .includes(this.searchText.toLowerCase())
    );
  }
}

formatDateDownload(dateString: string): string {
  const parts = dateString.split('T');
  const datePart = parts[0]; 
  const timePart = parts[1].split('.')[0];
  const [day, month, year] = datePart.split('-');
  const [hours, minutes] = timePart.split(':');
  return `• ${day}/${month}/${year} • ${hours}:${minutes}`;
}

downloadReport(download: any) {
if(download.reportStatus_ReportOrchestrator_Text == 'SUCCESS'){
  // Prepare the request body
  const requestBody = {
    reportFile_ReportOrchestrator_File: download.reportFile_ReportOrchestrator_File
  };

  // Make POST request to get download URL
  // this.http.post('http://172.21.46.83:8090/kjusys-api/report-orchestrator/reports/download-url', requestBody)
  this.httpCommon.postData('/report-orchestrator/reports/download-url', requestBody)
    
  .subscribe({
      next: (response: any) => {
        if (response.statusCode === 200 && response.responseData.data.length > 0) {
          const downloadUrl = response.responseData.data[0];
          // Alternative: Download directly without opening new tab
          this.downloadFileDirectly(downloadUrl);
        }
      },
      error: (error) => {
        console.error('Error getting download URL:', error);
      }
    });
}

  
}

downloadFileDirectly(url: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = ''; 
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
  
}

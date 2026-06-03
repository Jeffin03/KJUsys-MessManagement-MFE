import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpCommonService } from '@libs/http-common';
import { HttpClient } from '@angular/common/http';

interface NewJoinee {
  id: number;
  name: string;
  department: string;
}

@Injectable({
  providedIn: 'root'
})
export class CommonService {

  constructor(private httpService: HttpCommonService, private httpClient: HttpClient) { }

  getUserDetails(): Observable<any> {
    return this.httpService.getData('/hr/employee-profile-view');
  }

  getBirthdays(): Observable<any> {
    return this.httpService.postData('/hr/employee-birthdays-view');
  }

  getImage(payload: { uploadedFilePath_KJUSYSCommon_Text: string }): Observable<any> {
    return this.httpService.postData('/hr/employee-id-photo-view', payload);
  }

  getNewJoinees(): Observable<Blob> {
    return this.httpService.getData('/hr/fetch-new-joiners');
  }

  getWorkAniversaries(): Observable<Blob> {
    return this.httpService.getData<NewJoinee[]>('/hr/fetch-employees-with-today-anniversary');
  }



  createCircular(title: string,recipientCategory:string, date: string, department: string[], employees: string[] ,file: File): Observable<any> {
    const formData = new FormData();
    formData.append('staffCircularFileUploadPath_HRCommon_Text', file);
    formData.append('staffCircularTitle_HRCommon_Text', title);
    formData.append('staffCircularCreatedDate_HRCommon_Date', date);
    formData.append('staffCircularSelectedDepartments_HRCommon_TextArray', JSON.stringify(department));
    formData.append('staffCircularSelectedEmployeeCodes_HRCommon_TextArray', JSON.stringify(employees));
    formData.append('staffCircularRecipientCategory_HRCommon_Text', recipientCategory);
    // return this.httpClient.post<any>('http://172.21.46.218:8081/kjusys-api/hr/staff-circulars', formData);  

    return this.httpService.postData<any>('/hr/staff-circulars', formData);
  }

  fetchCirculars(payload: any,recipientCategory:string): Observable<any> {
    // return this.httpClient.post(`http://172.21.46.218:8081/kjusys-api/hr/fetch-staff-circulars/${recipientCategory}`, payload);

    return this.httpService.postData(`/hr/fetch-staff-circulars/${recipientCategory}`, payload);
  }
  fetchCircularsH(payload: any): Observable<any> {
    return this.httpService.postData(`/academics/fetch-all-student-circular`, payload);
  }

  createEvent(payload:any): Observable<any> {
    return this.httpService.postData<any>('/hr/create-staff-events', payload);
  }

  createReminder(title: string, dates: string[], startTime: string, endTime: string): Observable<any> {
    const payload = {staffReminderTitle_HRCommon_Text: title, staffReminderDatesArray_HRCommon_TextArray: dates, staffReminderStartTime_HRCommon_Text: startTime, staffReminderEndTime_HRCommon_Text: endTime,};
    return this.httpService.postData<any>('/hr/create-staff-reminder', payload);
  }

  fetchCount(payload: any) {
    return this.httpService.postData<any>('/hr/fetch-calendar-event-reminders', payload);
  }
  fetchCountH(payload: any) {
    return this.httpService.postData<any>('/academics/fetch-event-count-for-admin', payload);
  }

  fetchEvent(payload: any) {
    return this.httpService.postData<any>('/hr/fetch-staff-events', payload);
  }
  fetchEventH(payload: any) {
    return this.httpService.postData<any>('/academics/fetch-all-events-admin', payload);
  }

  fetchReminder(payload: any) {
    return this.httpService.postData<any>('/hr/fetch-staff-reminders', payload);
  }

  getPdf(payload: any): Observable<Blob> {
    return this.httpService.postData('/hr/download-circular', payload, { responseType: 'blob' });
  }

  deleteReminder(objId: any) {
    return this.httpService.deleteData(`/hr/delete-staff-reminder/${objId}`);
  }

  fetchCircularsForAdmin(payload: any): Observable<any> {
    return this.httpService.postData('/hr/admin-fetch-circulars', payload);
  }
  fetchCircularsForAdminH(payload: any): Observable<any> {
    return this.httpService.postData('/academics/admin-fetch-student-circular', payload);
  }

   deleteCircular(objId: any) {
    return this.httpService.deleteData(`/hr/delete-staff-circulars/${objId}`);
  }
  deleteCircularH(payload: any) {
    return this.httpService.postData(`/academics/delete-student-circular`, payload);
  }


   deleteEvent(objId: any) {
    return this.httpService.deleteData(`/hr/delete-staff-event/${objId}`);
  }
  deleteEventH(payload: any) {
    return this.httpService.postData(`/academics/delete-student-events`,payload);
  }



}



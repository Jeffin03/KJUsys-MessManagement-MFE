import { Injectable } from '@angular/core';
import { HttpCommonService } from '@libs/http-common';
import { map, Observable, take } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChangePasswordService {

  constructor(private httpcommon : HttpCommonService) {}

  getResponseData(response: any) {
    return response;
}



  changePassword(jsonData: any): Observable<any> {
    //return this.http.post<any>(`${environment.baseUrl}/eform/applicant-profile/change-password`, jsonData);
    return this.httpcommon.postData('/hr/employee-change-password',jsonData)
    .pipe(take(1))
    .pipe(map(this.getResponseData));
  }
}


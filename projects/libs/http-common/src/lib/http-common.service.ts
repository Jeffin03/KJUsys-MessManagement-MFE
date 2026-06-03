import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { SpinnerStateService } from '@libs/shared-auth';
import { finalize, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HttpCommonService {
  redirect = false;
  constructor(
    private http: HttpClient,
    @Inject('env') public env: any,
    private spinnerStateService: SpinnerStateService // Inject SpinnerStateService

  ) { }
  postData<T>(url: string, body?: any, options?: any, responseType?: any): Observable<any> {
    this.spinnerStateService.show();
    const httpOptions = {
      ...options,
      responseType: responseType || 'json'
    };
    return this.http.post<T>(this.env.baseUrl + url, body, httpOptions).pipe(
      finalize(() => {
        this.spinnerStateService.hide();
      })
    );
  }


  postDataWithTimeout<T>(url: string, body?: any, options?: any, responseType?: any, timeoutMs: number = 2000): Observable<any> {
    const httpOptions = {
      ...options,
      responseType: responseType || 'json'
    };
  
    // Create subject to control the flow
    const result = new Subject<any>();
    
    // Track response status
    let responseHandled = false;
    
    
    // Set timeout to complete the Subject if no response comes in time
    const timeoutId = setTimeout(() => {
      if (!responseHandled) {
        
        // Important: Mark as handled before emitting error
        responseHandled = true;
        
        // Create an error that will be recognized as a timeout
        const timeoutError = new Error('Request timeout');
        timeoutError.name = 'TimeoutError';
        
        // Emit error and complete the subject
        result.error(timeoutError);
      }
    }, timeoutMs);
    
    // Direct reference to spinner service to ensure it's hidden
    const spinnerService = this.spinnerStateService;
  
    // Make the actual HTTP request - don't use our own finalize here
    // to avoid race conditions with manually completing the subject
    this.http.post<T>(this.env.baseUrl + url, body, httpOptions)
      .subscribe({
        next: (response) => {
          if (!responseHandled) {
            
            // Mark as handled
            responseHandled = true;
            clearTimeout(timeoutId);
            
            // Forward response and complete the subject
            result.next(response);
            result.complete();
          }
        },
        error: (error) => {
          if (!responseHandled) {
            
            // Mark as handled
            responseHandled = true;
            clearTimeout(timeoutId);
            
            // Forward error and complete the subject
            result.error(error);
          }
        }
      });
  
    // Return an observable that ensures spinner is hidden when completed/errored
    return result.asObservable().pipe(
      finalize(() => {
        clearTimeout(timeoutId);
        spinnerService.hide();
      })
    );
  }

  getData<T>(url: string, params?: any, options?: any, responseType?: any): Observable<any> {
    this.spinnerStateService.show();
    const httpOptions = {
      ...options,
      params,
      responseType: responseType || 'json'
    };
    return this.http.get<T>(this.env.baseUrl + url, httpOptions).pipe(
      finalize(() => {
        this.spinnerStateService.hide();
      })
    );
  }

  deleteData<T>(url: string, params?: any, options?: any, responseType?: any): Observable<any> {
    this.spinnerStateService.show();
    const httpOptions = {
      ...options,
      params,
      responseType: responseType || 'json'
    };
    return this.http.delete<T>(this.env.baseUrl + url, httpOptions).pipe(
      finalize(() => {
        this.spinnerStateService.hide();
      })
    );
  }

  putData(url: string, body: any = {}, params: any = {}, options?: any, responseType?: any): Observable<any> {
    this.spinnerStateService.show();
    const httpOptions = {
      ...options,
      params,
      responseType: responseType || 'json'
    };
    return this.http.put(this.env.baseUrl + url, body, httpOptions).pipe(
      finalize(() => {
        this.spinnerStateService.hide();
      })
    );
  }
  showResponse(response: any, type: any, duration = 2000) {
    console.error(`[HttpCommonService] ${type}:`, response);
  }
}
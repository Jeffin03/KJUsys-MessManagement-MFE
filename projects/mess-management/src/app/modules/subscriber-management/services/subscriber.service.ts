import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Subscriber } from '../../../shared/models/subscriber';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints';

interface BackendCustomer {
  _id: { $oid: string };
  name: string;
  phone: string;
  email: string;
  hmsId: string;
  subscription: {
    meals: string[];
    start_Date: number;
    end_Date: number;
    duration_days: number;
    active: boolean;
    days_remaining: number;
  };
}

interface ApiResponse<T> {
  statusCode: number;
  type: string;
  responseData: {
    data: T;
    message: any[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class SubscriberService {
  private baseUrl = '/api';

  constructor(private http: HttpClient) { }

  private mapToSubscriber(customer: BackendCustomer): Subscriber {
    // Convert timestamp to date string (e.g., '10 Jan 26')
    const date = new Date(customer.subscription?.start_Date || Date.now());
    const dateString = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });

    // Map meals array to 'B+L+D' format
    const mealPlanMap: { [key: string]: string } = {
      'BREAKFAST': 'B',
      'LUNCH': 'L',
      'DINNER': 'D'
    };
    const mealsArray = customer.subscription?.meals || [];
    const mealPlanStr = mealsArray.map((m: string) => mealPlanMap[m] || m).join('+');

    let status: 'Active' | 'Paused' | 'Lapsed' = 'Lapsed';
    if (customer.subscription) {
      if (customer.subscription.active) {
        status = 'Active';
      }
      // If there's a concept of paused in your DB, handle it here.
    }

    return {
      id: customer._id.$oid,
      name: customer.name,
      email: customer.email,
      hmsId: customer.hmsId || 'N/A',
      mealPlan: mealPlanStr || 'None',
      status: status,
      joinedDate: dateString
    };
  }

  getSubscribers(): Observable<Subscriber[]> {
    return this.http.get<ApiResponse<{ customers: BackendCustomer[] }>>(`${this.baseUrl}${API_ENDPOINTS.CUSTOMERS}`)
      .pipe(
        map(res => {
          const customers = res.responseData?.data?.customers || [];
          return customers.map(c => this.mapToSubscriber(c));
        })
      );
  }

  getSubscriberById(id: number | string): Observable<Subscriber> {
    return this.http.get<ApiResponse<{ customer: BackendCustomer }>>(`${this.baseUrl}${API_ENDPOINTS.CUSTOMER_BY_ID(id)}`)
      .pipe(
        map(res => this.mapToSubscriber(res.responseData.data.customer))
      );
  }

  renewSubscriber(id: number | string): Observable<any> {
    return this.http.post(`${this.baseUrl}${API_ENDPOINTS.CUSTOMER_RENEW(id)}`, {});
  }

  getExpiringSubscribers(): Observable<Subscriber[]> {
    return this.http.get<ApiResponse<{ customers: BackendCustomer[] }>>(`${this.baseUrl}${API_ENDPOINTS.CUSTOMERS_EXPIRING}`)
      .pipe(
        map(res => {
          const customers = res.responseData?.data?.customers || [];
          return customers.map(c => this.mapToSubscriber(c));
        })
      );
  }

  createSubscriber(formData: any): Observable<any> {
    const meals = [];
    if (formData.mealSlot.breakfast) meals.push('BREAKFAST');
    if (formData.mealSlot.lunch) meals.push('LUNCH');
    if (formData.mealSlot.dinner) meals.push('DINNER');

    // Convert 'DD/MM/YY' to timestamp
    const parseDate = (dateStr: string) => {
      if (!dateStr) return 0;
      const [d, m, y] = dateStr.split('/');
      return new Date(2000 + parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10)).getTime();
    };

    const payload = {
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      phone: formData.phone,
      subscription: {
        meals: meals,
        start_Date: parseDate(formData.mealSlot.startDate),
        end_Date: parseDate(formData.mealSlot.endDate),
        active: formData.mealSlot.status === 'Active'
      }
    };

    return this.http.post<ApiResponse<any>>(`${this.baseUrl}${API_ENDPOINTS.CUSTOMERS}`, payload);
  }

  assignHmsId(uid: string, customerId: string): Observable<any> {
    const payload = { customerId: customerId };
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}${API_ENDPOINTS.RFID_REASSIGN(uid)}`, payload);
  }

  updateSubscriber(id: string | number, formData: any): Observable<any> {
    const meals = [];
    if (formData.mealSlot.breakfast) meals.push('BREAKFAST');
    if (formData.mealSlot.lunch) meals.push('LUNCH');
    if (formData.mealSlot.dinner) meals.push('DINNER');

    // Convert 'DD/MM/YY' to timestamp
    const parseDate = (dateStr: string) => {
      if (!dateStr) return 0;
      const [d, m, y] = dateStr.split('/');
      return new Date(2000 + parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10)).getTime();
    };

    const payload = {
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      phone: formData.phone,
      subscription: {
        meals: meals,
        start_Date: parseDate(formData.mealSlot.startDate),
        end_Date: parseDate(formData.mealSlot.endDate),
        active: formData.mealSlot.status === 'Active'
      }
    };

    return this.http.put<ApiResponse<any>>(`${this.baseUrl}${API_ENDPOINTS.CUSTOMER_BY_ID(id)}`, payload);
  }
}

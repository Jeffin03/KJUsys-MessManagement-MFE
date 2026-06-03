import { Injectable } from '@angular/core';
import { Observable, map, take } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MenuHeaderLibService {
  breadcrumbs: any;
	ref: any;
	constructor() {}
	getResponseData(response: any) {
		return response;
	}
}




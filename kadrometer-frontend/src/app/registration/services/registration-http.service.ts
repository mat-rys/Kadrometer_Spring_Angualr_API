import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RegistrationHttpService {
  constructor(private http: HttpClient) { }

  register(userDetails: any): Observable<any> {
    return this.http.post(environment.api.register, userDetails);
  }
}

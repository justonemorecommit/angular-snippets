import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";

@Injectable()
export class BaseService {
  headers = new HttpHeaders();

  constructor(public http: HttpClient) {}

  protected get(url: string, params: any = {}): Observable<any> {
    return this.http.get(environment.apiUrl + url, {
      headers: this.headers,
      params,
    });
  }

  protected post(url: string, data: any): Observable<any> {
    return this.http.post(environment.apiUrl + url, data, {
      headers: this.headers,
    });
  }

  protected rawPost(url: string, data: any): Observable<any> {
    return this.http.post(url, data, { headers: this.headers });
  }

  protected put(url: string, data: any): Observable<any> {
    return this.http.put(environment.apiUrl + url, data, {
      headers: this.headers,
    });
  }

  protected delete(url: string, params: any = {}): Observable<any> {
    return this.http.delete(environment.apiUrl + url, {
      headers: this.headers,
      params,
    });
  }
}

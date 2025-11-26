import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Product {
  _id: string;
  name: string;
  price: number;
  category: string[];
  shopId: string;
  description: string;
  createdAt: string;
}

export interface ProductsResponse {
  products?: Product[];
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = environment.apiUrl;
  private s3BaseUrl = environment.s3BaseUrl;

  constructor(private http: HttpClient) { }

  getProducts(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/products`);
  }

  getModelUrl(shopId: string, productId: string): string {
    return `${this.s3BaseUrl}/${shopId}/${productId}/model.glb`;
  }

  getImageUrl(shopId: string, productId: string): string {
    return `${this.s3BaseUrl}/${shopId}/${productId}/main.png`;
  }
}

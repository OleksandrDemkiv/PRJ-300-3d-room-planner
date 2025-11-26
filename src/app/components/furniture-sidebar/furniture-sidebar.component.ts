import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService, Product } from '../../services/product.service';
import { provideHttpClient } from '@angular/common/http';

export interface FurnitureItem {
  name: string;
  displayName: string;
  path: string;
  imageUrl: string;
  productId: string;
  price: number;
}

@Component({
  selector: 'app-furniture-sidebar',
  imports: [CommonModule],
  templateUrl: './furniture-sidebar.component.html',
  styleUrl: './furniture-sidebar.component.css',
})
export class FurnitureSidebarComponent implements OnInit {
  @Output() itemSelected = new EventEmitter<FurnitureItem>();

  furnitureItems: FurnitureItem[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.productService.getProducts().subscribe({
      next: (response) => {
        console.log('API Response:', response);
        
        // Handle different response structures
        const products = Array.isArray(response) ? response : (response.products || []);
        
        this.furnitureItems = products.map((product: Product) => ({
          name: product._id,
          displayName: product.name,
          path: this.productService.getModelUrl(product.shopId, product._id),
          imageUrl: this.productService.getImageUrl(product.shopId, product._id),
          productId: product._id,
          price: product.price
        }));
        this.isLoading = false;
        console.log('Loaded products:', this.furnitureItems);
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.errorMessage = 'Failed to load products';
        this.isLoading = false;
      }
    });
  }

  onItemClick(item: FurnitureItem): void {
    this.itemSelected.emit(item);
  }
}

import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../services/product.service';

export interface FurnitureItem {
  name: string;
  displayName: string;
  path: string;
  imageUrl: string;
  productId: string;
  price: number;
  categories: string[];
}

@Component({
  selector: 'app-furniture-sidebar',
  imports: [CommonModule, FormsModule],
  templateUrl: './furniture-sidebar.component.html',
  styleUrl: './furniture-sidebar.component.css',
})
export class FurnitureSidebarComponent implements OnInit {
  @Output() itemSelected = new EventEmitter<FurnitureItem>();

  furnitureItems: FurnitureItem[] = [];
  filteredItems: FurnitureItem[] = [];
  categories: string[] = [];
  selectedCategories: Set<string> = new Set();
  isLoading = false;
  errorMessage = '';
  isCategoryDropdownOpen = false;
  sortBy: 'name' | 'price-low' | 'price-high' = 'name';

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.productService.getProducts().subscribe({
      next: (response) => {
        // Handle different response structures
        const products = Array.isArray(response) ? response : (response.products || []);
        
        this.furnitureItems = products.map((product: Product) => ({
          name: product._id,
          displayName: product.name,
          path: this.productService.getModelUrl(product.shopId, product._id),
          imageUrl: this.productService.getImageUrl(product.shopId, product._id),
          productId: product._id,
          price: product.price,
          categories: product.category || []
        }));
        
        // Extract unique categories
        const categorySet = new Set<string>();
        this.furnitureItems.forEach(item => {
          item.categories.forEach(cat => categorySet.add(cat));
        });
        this.categories = Array.from(categorySet).sort();
        
        this.filteredItems = [...this.furnitureItems];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.errorMessage = 'Failed to load products';
        this.isLoading = false;
      }
    });
  }

  toggleCategory(category: string): void {
    if (this.selectedCategories.has(category)) {
      this.selectedCategories.delete(category);
    } else {
      this.selectedCategories.add(category);
    }
    this.filterProducts();
  }

  filterProducts(): void {
    if (this.selectedCategories.size === 0) {
      this.filteredItems = [...this.furnitureItems];
    } else {
      this.filteredItems = this.furnitureItems.filter(item =>
        item.categories.some(cat => this.selectedCategories.has(cat))
      );
    }
    this.sortProducts();
  }

  sortProducts(): void {
    if (this.sortBy === 'name') {
      this.filteredItems.sort((a, b) => a.displayName.localeCompare(b.displayName));
    } else if (this.sortBy === 'price-low') {
      this.filteredItems.sort((a, b) => a.price - b.price);
    } else if (this.sortBy === 'price-high') {
      this.filteredItems.sort((a, b) => b.price - a.price);
    }
  }

  onSortChange(): void {
    this.sortProducts();
  }

  toggleCategoryDropdown(): void {
    this.isCategoryDropdownOpen = !this.isCategoryDropdownOpen;
  }

  onItemClick(item: FurnitureItem): void {
    this.itemSelected.emit(item);
  }

  onDragStart(event: DragEvent, item: FurnitureItem): void {
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('application/json', JSON.stringify(item));
      
      // Create a custom drag image
      const dragImage = document.createElement('div');
      dragImage.textContent = item.displayName;
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-1000px';
      dragImage.style.padding = '8px 12px';
      dragImage.style.background = '#4F46E5';
      dragImage.style.color = 'white';
      dragImage.style.borderRadius = '8px';
      dragImage.style.fontSize = '14px';
      document.body.appendChild(dragImage);
      event.dataTransfer.setDragImage(dragImage, 0, 0);
      
      setTimeout(() => document.body.removeChild(dragImage), 0);
    }
  }
}

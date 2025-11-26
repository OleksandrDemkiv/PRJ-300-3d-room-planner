import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FurnitureItem {
  name: string;
  displayName: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-furniture-sidebar',
  imports: [CommonModule],
  templateUrl: './furniture-sidebar.component.html',
  styleUrl: './furniture-sidebar.component.css',
})
export class FurnitureSidebarComponent {
  @Output() itemSelected = new EventEmitter<FurnitureItem>();

  furnitureItems: FurnitureItem[] = [
    { name: 'bed_double', displayName: 'Double Bed', path: 'assets/models/desk.glb', icon: '🛏️' },
  ];

  onItemClick(item: FurnitureItem): void {
    this.itemSelected.emit(item);
  }
}

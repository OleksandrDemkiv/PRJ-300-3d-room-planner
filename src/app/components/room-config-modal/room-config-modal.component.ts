import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface RoomConfig {
  shape: 'rectangle' | 'square';
  width: number;
  height: number;
  depth: number;
  wallColor: string;
  floorTexture: 'color' | 'wood' | 'tile' | 'concrete' | 'carpet';
  floorColor: string;
}

@Component({
  selector: 'app-room-config-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './room-config-modal.component.html',
  styleUrl: './room-config-modal.component.css'
})
export class RoomConfigModalComponent {
  @Output() roomConfigured = new EventEmitter<RoomConfig>();

  selectedShape: 'rectangle' | 'square' = 'rectangle';
  roomWidth = 6;
  roomHeight = 3;
  roomDepth = 5;
  wallColor = '#E8D5B5';
  floorTexture: 'color' | 'wood' | 'tile' | 'concrete' | 'carpet' = 'wood';
  floorColor = '#D2B48C';

  selectShape(shape: 'rectangle' | 'square') {
    this.selectedShape = shape;
    if (shape === 'square') {
      this.roomDepth = this.roomWidth; // Make depth equal to width for square
    }
  }

  onWidthChange() {
    if (this.selectedShape === 'square') {
      this.roomDepth = this.roomWidth; // Keep square proportions
    }
  }

  createRoom() {
    const config: RoomConfig = {
      shape: this.selectedShape,
      width: this.roomWidth,
      height: this.roomHeight,
      depth: this.roomDepth,
      wallColor: this.wallColor,
      floorTexture: this.floorTexture,
      floorColor: this.floorColor
    };
    this.roomConfigured.emit(config);
  }
}

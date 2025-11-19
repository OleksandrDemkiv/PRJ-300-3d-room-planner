import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThreeSceneComponent } from './three-scene/three-scene.component';

@Component({
  selector: 'app-root',
  imports: [ThreeSceneComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'room-planner';
}

import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomConfigModalComponent, RoomConfig } from '../components/room-config-modal/room-config-modal.component';
import { FurnitureSidebarComponent, FurnitureItem } from '../components/furniture-sidebar/furniture-sidebar.component';

@Component({
  selector: 'app-three-scene',
  standalone: true,
  imports: [FormsModule, CommonModule, RoomConfigModalComponent, FurnitureSidebarComponent],
  templateUrl: './three-scene.component.html',
  styleUrls: ['./three-scene.component.css'],
})
export class ThreeSceneComponent implements AfterViewInit, OnDestroy {
  @ViewChild('rendererContainer', { static: true })
  containerRef!: ElementRef<HTMLDivElement>;

  // Modal state
  showConfigModal = true;
  roomConfigured = false;

  // Inputs bound to UI
  roomWidth = 6;
  roomHeight = 3;
  roomDepth = 5;
  wallThickness = 0.2;
  wallColor = '#c0e0ff';
  floorColor = '#f2f2f2';
  isInsideView = false;
  currentRotationDegrees = 0;

  // Internal references
  private renderer!: THREE.WebGLRenderer;
  private camera!: THREE.PerspectiveCamera;
  private scene!: THREE.Scene;
  private controls!: OrbitControls;
  private animationId: number | null = null;

  private wallMaterial!: THREE.MeshStandardMaterial;
  private floorMaterial!: THREE.MeshStandardMaterial;
  private roomGroup = new THREE.Group();

  // Object interaction
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  selectedObject: THREE.Object3D | null = null;
  private selectionBox: THREE.BoxHelper | null = null;
  private isDragging = false;
  private dragPlane = new THREE.Plane();
  private dragOffset = new THREE.Vector3();
  private movableObjects: THREE.Object3D[] = [];

  ngAfterViewInit(): void {
    // Don't initialize until room is configured
    if (this.roomConfigured) {
      this.initializeScene();
    }
  }

  onRoomConfigured(config: RoomConfig): void {
    // Apply configuration
    this.roomWidth = config.width;
    this.roomHeight = config.height;
    this.roomDepth = config.depth;
    
    // Close modal and mark as configured
    this.showConfigModal = false;
    this.roomConfigured = true;
    
    // Initialize the 3D scene
    this.initializeScene();
  }

  private initializeScene(): void {
    this.initThree();
    this.buildRoom();
    // this.loadModels();
    this.startRenderingLoop();
    window.addEventListener('resize', this.onWindowResize, { passive: true });
    this.setupMouseEvents();
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onWindowResize);
    this.removeMouseEvents();
    this.stopRenderingLoop();
    this.controls.dispose();
    this.renderer.dispose();
  }

  private initThree() {
    const container = this.containerRef.nativeElement;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(7, 4, 8);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 1, 0);
    this.controls.maxPolarAngle = Math.PI / 2;
    
    // Set initial zoom limits for outside view
    this.setOutsideViewLimits();

    // Lights
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7.5);
    this.scene.add(dirLight);

    // Add container for the room
    this.scene.add(this.roomGroup);
    this.roomGroup.position.y = 1;
  }

  private buildRoom() {
    this.roomGroup.clear();

    const { roomWidth, roomHeight, roomDepth, wallThickness } = this;

    // Wall material
    this.wallMaterial = new THREE.MeshStandardMaterial({
      color: this.wallColor,
      side: THREE.BackSide, // render interior
    });

    // Floor material
    this.floorMaterial = new THREE.MeshStandardMaterial({
      color: this.floorColor,
      side: THREE.DoubleSide,
    });

    // Room walls (BoxGeometry)
    const roomGeometry = new THREE.BoxGeometry(roomWidth, roomHeight, roomDepth);
    const roomMesh = new THREE.Mesh(roomGeometry, this.wallMaterial);
    roomMesh.position.set(0, 0, 0); // center at roomGroup origin
    this.roomGroup.add(roomMesh);

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(
      roomWidth - wallThickness,
      roomDepth - wallThickness
    );
    const floor = new THREE.Mesh(floorGeometry, this.floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -roomHeight / 2 + 0.01; // bottom of room
    this.roomGroup.add(floor);
  }

  updateRoom() {
    this.buildRoom();
  }

  updateWallColor() {
    this.wallMaterial.color.set(this.wallColor);
  }

  updateFloorColor() {
    this.floorMaterial.color.set(this.floorColor);
  }

  toggleCameraView() {
    this.isInsideView = !this.isInsideView;
    
    if (this.isInsideView) {
      // Inside view: position camera inside the room
      this.camera.position.set(0, 1, 0);
      this.controls.target.set(0, 1, 0);
      this.setInsideViewLimits();
    } else {
      // Outside view: position camera outside the room
      this.camera.position.set(7, 4, 8);
      this.controls.target.set(0, 1, 0);
      this.setOutsideViewLimits();
    }
    
    this.controls.update();
  }

  private setInsideViewLimits() {
    // Inside view
    this.controls.minDistance = 0.5;
    this.controls.maxDistance = 4;
    this.controls.maxPolarAngle = Math.PI;
  }

  private setOutsideViewLimits() {
    // Outside view
    this.controls.minDistance = 5;
    this.controls.maxDistance = 20;
    this.controls.maxPolarAngle = Math.PI / 2;
  }

  private startRenderingLoop() {
    const render = () => {
      this.controls.update();
      if (this.camera.position.y < 0.1) this.camera.position.y = 0.1;
      this.renderer.render(this.scene, this.camera);
      this.animationId = requestAnimationFrame(render);
    };
    render();
  }

  private stopRenderingLoop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private onWindowResize = () => {
    const container = this.containerRef.nativeElement;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private setupMouseEvents() {
    const canvas = this.renderer.domElement;
    canvas.addEventListener('mousedown', this.onMouseDown);
    canvas.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('mouseup', this.onMouseUp);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
    canvas.addEventListener('auxclick', this.onMiddleClick);
    canvas.style.cursor = 'default';
  }

  private removeMouseEvents() {
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('mousedown', this.onMouseDown);
    canvas.removeEventListener('mousemove', this.onMouseMove);
    canvas.removeEventListener('mouseup', this.onMouseUp);
    canvas.removeEventListener('wheel', this.onWheel);
    canvas.removeEventListener('auxclick', this.onMiddleClick);
  }

  private onMouseDown = (event: MouseEvent) => {
    event.preventDefault();
    this.updateMousePosition(event);

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.movableObjects, true);

    if (intersects.length > 0) {
      // Find the top-level movable object
      let object = intersects[0].object;
      while (object.parent && !this.movableObjects.includes(object)) {
        object = object.parent;
      }

      if (this.movableObjects.includes(object)) {
        this.controls.enabled = false; // Disable orbit controls while dragging
        this.controls.enableZoom = false; // Disable zoom when object is selected
        this.isDragging = true;
        this.selectedObject = object;

        // Create selection box
        this.createSelectionBox(object);

        // Set up drag plane at floor level (y = object's y position)
        const planeY = object.position.y;
        this.dragPlane.setFromNormalAndCoplanarPoint(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(0, planeY, 0)
        );

        // Calculate offset from click point to object center
        const intersectPoint = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(this.dragPlane, intersectPoint);
        if (intersectPoint) {
          this.dragOffset.subVectors(object.position, intersectPoint);
          this.updateRotationDisplay();
        }

        this.renderer.domElement.style.cursor = 'grabbing';
      }
    } else {
      // Clicked on empty space - deselect
      this.deselectObject();
    }
  };

  private onMouseMove = (event: MouseEvent) => {
    this.updateMousePosition(event);

    if (this.isDragging && this.selectedObject) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersectPoint = new THREE.Vector3();

      if (this.raycaster.ray.intersectPlane(this.dragPlane, intersectPoint)) {
        // Calculate new position with offset
        const newPosition = intersectPoint.add(this.dragOffset);
        
        // Apply the new position
        this.selectedObject.position.x = newPosition.x;
        this.selectedObject.position.z = newPosition.z;

        // Constrain object to stay within room bounds
        this.constrainObjectToRoom();

        // Update selection box
        if (this.selectionBox) {
          this.selectionBox.update();
        }
      }
    } else {
      // Change cursor on hover
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.movableObjects, true);

      if (intersects.length > 0) {
        this.renderer.domElement.style.cursor = 'grab';
      } else {
        this.renderer.domElement.style.cursor = 'default';
      }
    }
  };

  private onMouseUp = () => {
    if (this.isDragging) {
      this.isDragging = false;
      this.controls.enabled = true;

      if (this.selectedObject) {
        this.renderer.domElement.style.cursor = 'grab';
      } else {
        this.renderer.domElement.style.cursor = 'default';
      }
    }
  };

  private updateMousePosition(event: MouseEvent) {
    const canvas = this.renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private createSelectionBox(object: THREE.Object3D) {
    // Remove previous selection box
    if (this.selectionBox) {
      this.scene.remove(this.selectionBox);
      this.selectionBox.dispose();
    }

    // Create new selection box
    this.selectionBox = new THREE.BoxHelper(object, 0x00ff00); // Green
    this.scene.add(this.selectionBox);
  }

  private deselectObject() {
    if (this.selectionBox) {
      this.scene.remove(this.selectionBox);
      this.selectionBox.dispose();
      this.selectionBox = null;
    }
    this.selectedObject = null;
    this.currentRotationDegrees = 0;
    this.controls.enableZoom = true;
  }

  private onWheel = (event: WheelEvent) => {
    // Only rotate if an object is selected
    if (this.selectedObject) {
      event.preventDefault();
      
      // Determine rotation direction based on scroll
      const rotationStep = (15 * Math.PI) / 180; // 15 degrees in radians
      const direction = event.deltaY > 0 ? 1 : -1;
      
      // Apply rotation
      this.selectedObject.rotation.y += direction * rotationStep;
      
      // Update the display
      this.updateRotationDisplay();
      
      // Update selection box
      if (this.selectionBox) {
        this.selectionBox.update();
      }
      
      // Re-check bounds after rotation to keep object within room
      this.constrainObjectToRoom();
    }
  };

  private onMiddleClick = (event: MouseEvent) => {
    // Middle mouse button (button 1)
    if (event.button === 1) {
      event.preventDefault();
      this.updateMousePosition(event);

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.movableObjects, true);

      if (intersects.length > 0) {
        // Find the top-level movable object
        let object = intersects[0].object;
        while (object.parent && !this.movableObjects.includes(object)) {
          object = object.parent;
        }

        if (this.movableObjects.includes(object)) {
          // Remove from movable objects array
          const index = this.movableObjects.indexOf(object);
          if (index > -1) {
            this.movableObjects.splice(index, 1);
          }

          // If this is the selected object, deselect it first
          if (this.selectedObject === object) {
            this.deselectObject();
          }

          // Remove from scene
          this.roomGroup.remove(object);
          
          console.log(`Removed object: ${object.name}`);
        }
      }
    }
  };

  private updateRotationDisplay() {
    if (this.selectedObject) {
      // Convert radians to degrees and normalize to 0-360
      let degrees = (this.selectedObject.rotation.y * 180) / Math.PI;
      degrees = ((degrees % 360) + 360) % 360; // Normalize to 0-360
      this.currentRotationDegrees = Math.round(degrees);
    }
  }

  private constrainObjectToRoom() {
    if (!this.selectedObject) return;

    // Get object's bounding box in world space
    const boundingBox = new THREE.Box3().setFromObject(this.selectedObject);
    
    // Room bounds
    const roomHalfWidth = this.roomWidth / 2;
    const roomHalfDepth = this.roomDepth / 2;
    const padding = 0.1;
    
    const minX = -roomHalfWidth + padding;
    const maxX = roomHalfWidth - padding;
    const minZ = -roomHalfDepth + padding;
    const maxZ = roomHalfDepth - padding;
    
    // Adjust position if object extends beyond room bounds
    if (boundingBox.min.x < minX) {
      this.selectedObject.position.x += (minX - boundingBox.min.x);
    }
    if (boundingBox.max.x > maxX) {
      this.selectedObject.position.x -= (boundingBox.max.x - maxX);
    }
    if (boundingBox.min.z < minZ) {
      this.selectedObject.position.z += (minZ - boundingBox.min.z);
    }
    if (boundingBox.max.z > maxZ) {
      this.selectedObject.position.z -= (boundingBox.max.z - maxZ);
    }
  }

  onFurnitureItemSelected(item: FurnitureItem): void {
    const loader = new GLTFLoader();
    loader.load(
      item.path,
      (gltf: GLTF) => {
        const obj = gltf.scene;
        obj.name = item.name;

        // Enable shadows
        obj.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
        });

        // Get bounding box
        const box = new THREE.Box3().setFromObject(obj);
        const size = new THREE.Vector3();
        box.getSize(size);

        // Align bottom with floor
        obj.position.y = -this.roomHeight / 2;

        // Place at room center
        obj.position.x = 0;
        obj.position.z = 0;

        // Add to roomGroup
        this.roomGroup.add(obj);

        // Add to movable objects array for interaction
        this.movableObjects.push(obj);

        console.log(`${item.displayName} loaded inside room:`, obj.position);
      },
      undefined,
      (err) => console.error(`Error loading ${item.displayName}:`, err)
    );
  }

  viewCart(): void {
    const cartItems = this.movableObjects.map((obj, index) => {
      // Convert rotation from radians to degrees
      const rotationDegrees = Math.round((obj.rotation.y * 180) / Math.PI);
      
      return {
        id: index + 1,
        name: obj.name,
        position: {
          x: Math.round(obj.position.x * 100) / 100,
          y: Math.round(obj.position.y * 100) / 100,
          z: Math.round(obj.position.z * 100) / 100
        },
        rotation: rotationDegrees
      };
    });

    const cartData = {
      roomDimensions: {
        width: this.roomWidth,
        height: this.roomHeight,
        depth: this.roomDepth
      },
      items: cartItems,
      totalItems: cartItems.length
    };

    console.log('=== ROOM PLANNER CART ===');
    console.log(JSON.stringify(cartData, null, 2));
    console.log('========================');
    
    // Also log a summary
    console.log(`\nCart Summary: ${cartItems.length} item(s) in the scene`);
    cartItems.forEach(item => {
      console.log(`  - ${item.name} at position (${item.position.x}, ${item.position.z}), rotation: ${item.rotation}°`);
    });
  }
}

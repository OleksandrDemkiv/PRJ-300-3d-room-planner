import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FurnitureSidebarComponent } from './furniture-sidebar.component';

describe('FurnitureSidebarComponent', () => {
  let component: FurnitureSidebarComponent;
  let fixture: ComponentFixture<FurnitureSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FurnitureSidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FurnitureSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

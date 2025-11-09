import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomConfigModalComponent } from './room-config-modal.component';

describe('RoomConfigModalComponent', () => {
  let component: RoomConfigModalComponent;
  let fixture: ComponentFixture<RoomConfigModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomConfigModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomConfigModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

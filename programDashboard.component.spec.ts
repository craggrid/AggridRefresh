import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramDashboardComponent } from './programDashboard.component';

describe('ProgramDashboardComponent', () => {
  let component: ProgramDashboardComponent;
  let fixture: ComponentFixture<ProgramDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProgramDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgramDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

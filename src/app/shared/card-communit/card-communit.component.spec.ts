import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardCommunitComponent } from './card-communit.component';

describe('CardCommunitComponent', () => {
  let component: CardCommunitComponent;
  let fixture: ComponentFixture<CardCommunitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardCommunitComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardCommunitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

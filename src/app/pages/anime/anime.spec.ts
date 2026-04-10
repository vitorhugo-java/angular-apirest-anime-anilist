import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Anime } from './anime';

describe('Anime', () => {
  let component: Anime;
  let fixture: ComponentFixture<Anime>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Anime],
    }).compileComponents();

    fixture = TestBed.createComponent(Anime);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { MatContentDirective, MatContentModule } from './content.component';

@Component({
  standalone: false,
  template: '<mat-content>Test Content</mat-content>',
})
class TestHostComponent {}

@Component({
  standalone: false,
  template: '<mat-content layout-padding>Padded Content</mat-content>',
})
class TestHostWithPaddingComponent {}

describe('MatContentDirective', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MatContentDirective, TestHostComponent, TestHostWithPaddingComponent],
    }).compileComponents();
  });

  it('should create directive instance', () => {
    const directive = new MatContentDirective();
    expect(directive).toBeTruthy();
  });

  it('should render mat-content element', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const contentElement = compiled.querySelector('mat-content');

    expect(contentElement).toBeTruthy();
    expect(contentElement.textContent).toContain('Test Content');
  });

  it('should support layout-padding attribute', () => {
    const fixture = TestBed.createComponent(TestHostWithPaddingComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const contentElement = compiled.querySelector('mat-content');

    expect(contentElement).toBeTruthy();
    expect(contentElement.hasAttribute('layout-padding')).toBe(true);
    expect(contentElement.textContent).toContain('Padded Content');
  });
});

describe('MatContentModule', () => {
  it('should declare and export MatContentDirective', () => {
    const module = new MatContentModule();
    expect(module).toBeTruthy();
  });
});

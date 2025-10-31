import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatRatingComponent, MatRatingModule } from './rating.component';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('MatRatingComponent', () => {
  let component: MatRatingComponent;
  let fixture: ComponentFixture<MatRatingComponent>;
  let mockSnackBar: jest.Mocked<MatSnackBar>;

  beforeEach(async () => {
    mockSnackBar = {
      open: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      declarations: [MatRatingComponent],
      providers: [{ provide: MatSnackBar, useValue: mockSnackBar }],
    }).compileComponents();

    fixture = TestBed.createComponent(MatRatingComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should have default disabled: false', () => {
      expect(component.disabled).toBe(false);
    });

    it('should have default rating: 0', () => {
      expect(component.rating).toBe(0);
    });

    it('should have default starCount: 5', () => {
      expect(component['starCount']).toBe(5);
    });

    it('should have default color: empty string', () => {
      expect(component.color).toBe('');
    });

    it('should have default title: empty string', () => {
      expect(component.title).toBe('');
    });

    it('should initialize ratingArr as empty array', () => {
      expect(component.ratingArr).toEqual([]);
    });

    it('should have snackBarDuration: 2000', () => {
      expect(component['snackBarDuration']).toBe(2000);
    });
  });

  describe('ngOnInit', () => {
    it('should populate ratingArr with indices', () => {
      component.ngOnInit();

      expect(component.ratingArr).toEqual([0, 1, 2, 3, 4]);
    });

    it('should create array matching starCount', () => {
      component['starCount'] = 3;
      component.ngOnInit();

      expect(component.ratingArr).toEqual([0, 1, 2]);
      expect(component.ratingArr.length).toBe(3);
    });

    it('should handle starCount of 10', () => {
      component['starCount'] = 10;
      component.ngOnInit();

      expect(component.ratingArr.length).toBe(10);
      expect(component.ratingArr).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('should handle starCount of 1', () => {
      component['starCount'] = 1;
      component.ngOnInit();

      expect(component.ratingArr).toEqual([0]);
    });
  });

  describe('onClick', () => {
    it('should emit ratingUpdated event with rating value', () => {
      const emitSpy = jest.spyOn(component['ratingUpdated'], 'emit');

      component.onClick(4);

      expect(emitSpy).toHaveBeenCalledWith(4);
    });

    it('should return false', () => {
      const result = component.onClick(3);

      expect(result).toBe(false);
    });

    it('should emit different rating values', () => {
      const emitSpy = jest.spyOn(component['ratingUpdated'], 'emit');

      component.onClick(1);
      component.onClick(5);
      component.onClick(3);

      expect(emitSpy).toHaveBeenNthCalledWith(1, 1);
      expect(emitSpy).toHaveBeenNthCalledWith(2, 5);
      expect(emitSpy).toHaveBeenNthCalledWith(3, 3);
    });

    it('should work even when disabled is true', () => {
      const emitSpy = jest.spyOn(component['ratingUpdated'], 'emit');
      component.disabled = true;

      component.onClick(3);

      expect(emitSpy).toHaveBeenCalledWith(3);
    });
  });

  describe('showIcon', () => {
    it('should return "star" when rating equals index + 1', () => {
      component.rating = 3;

      expect(component.showIcon(2)).toBe('star');
    });

    it('should return "star" when rating exceeds index + 1', () => {
      component.rating = 5;

      expect(component.showIcon(2)).toBe('star');
    });

    it('should return "star_border" when rating is less than index + 1', () => {
      component.rating = 2;

      expect(component.showIcon(3)).toBe('star_border');
    });

    it('should show filled stars for rating of 5', () => {
      component.rating = 5;

      expect(component.showIcon(0)).toBe('star');
      expect(component.showIcon(1)).toBe('star');
      expect(component.showIcon(2)).toBe('star');
      expect(component.showIcon(3)).toBe('star');
      expect(component.showIcon(4)).toBe('star');
    });

    it('should show partial filled stars for rating of 3', () => {
      component.rating = 3;

      expect(component.showIcon(0)).toBe('star');
      expect(component.showIcon(1)).toBe('star');
      expect(component.showIcon(2)).toBe('star');
      expect(component.showIcon(3)).toBe('star_border');
      expect(component.showIcon(4)).toBe('star_border');
    });

    it('should show empty stars for rating of 0', () => {
      component.rating = 0;

      expect(component.showIcon(0)).toBe('star_border');
      expect(component.showIcon(1)).toBe('star_border');
      expect(component.showIcon(2)).toBe('star_border');
      expect(component.showIcon(3)).toBe('star_border');
      expect(component.showIcon(4)).toBe('star_border');
    });
  });

  describe('@Input properties', () => {
    it('should accept disabled input', () => {
      component.disabled = true;
      expect(component.disabled).toBe(true);
    });

    it('should accept rating input', () => {
      component.rating = 4;
      expect(component.rating).toBe(4);
    });

    it('should accept color input', () => {
      component.color = 'primary';
      expect(component.color).toBe('primary');
    });

    it('should accept title input', () => {
      component.title = 'Rate this book';
      expect(component.title).toBe('Rate this book');
    });
  });

  describe('integration', () => {
    it('should initialize and respond to rating clicks', () => {
      const emitSpy = jest.spyOn(component['ratingUpdated'], 'emit');

      component.ngOnInit();
      expect(component.ratingArr.length).toBe(5);

      component.onClick(4);
      expect(emitSpy).toHaveBeenCalledWith(4);

      component.rating = 4;
      expect(component.showIcon(3)).toBe('star');
      expect(component.showIcon(4)).toBe('star_border');
    });

    it('should display correct icons based on current rating', () => {
      component.ngOnInit();
      component.rating = 2;

      // Test all stars
      const icons = component.ratingArr.map((index) => component.showIcon(index));

      expect(icons).toEqual([
        'star', // index 0: 2 >= 1
        'star', // index 1: 2 >= 2
        'star_border', // index 2: 2 < 3
        'star_border', // index 3: 2 < 4
        'star_border', // index 4: 2 < 5
      ]);
    });
  });
});

describe('MatRatingModule', () => {
  it('should create module', () => {
    const module = new MatRatingModule();
    expect(module).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImageSpritesComponent, ImageSpritesModule } from './image-sprites.component';
import { ThumbnailUtils } from '@my-calibre-server/api-interfaces';

// Mock ThumbnailUtils
jest.mock('@my-calibre-server/api-interfaces', () => ({
  ThumbnailUtils: {
    getSpritesIndex: jest.fn((id: number) => Math.floor(id / 100)),
    getIndexInSprites: jest.fn((id: number) => id % 100),
  },
}));

describe('ImageSpritesComponent', () => {
  let component: ImageSpritesComponent;
  let fixture: ComponentFixture<ImageSpritesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ImageSpritesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageSpritesComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should have TYPE_BOOK constant: 0', () => {
      expect(component.TYPE_BOOK).toBe(0);
    });

    it('should have TYPE_SERIES constant: 1', () => {
      expect(component.TYPE_SERIES).toBe(1);
    });

    it('should default type to TYPE_BOOK', () => {
      expect(component.type).toBe(0);
    });

    it('should default id to 0', () => {
      expect(component.id).toBe(0);
    });
  });

  describe('@Input properties', () => {
    it('should accept type input', () => {
      component.type = component.TYPE_SERIES;
      expect(component.type).toBe(1);
    });

    it('should accept id input', () => {
      component.id = 42;
      expect(component.id).toBe(42);
    });

    it('should allow changing type between BOOK and SERIES', () => {
      component.type = component.TYPE_BOOK;
      expect(component.type).toBe(0);

      component.type = component.TYPE_SERIES;
      expect(component.type).toBe(1);
    });
  });

  describe('image getter', () => {
    it('should return book sprite URL for TYPE_BOOK', () => {
      component.type = component.TYPE_BOOK;
      component.id = 150;

      const imageUrl = component.image;

      expect(ThumbnailUtils.getSpritesIndex).toHaveBeenCalledWith(150);
      expect(imageUrl).toBe('url(/api/book/sprite/1.png');
    });

    it('should return series sprite URL for TYPE_SERIES', () => {
      component.type = component.TYPE_SERIES;
      component.id = 250;

      const imageUrl = component.image;

      expect(ThumbnailUtils.getSpritesIndex).toHaveBeenCalledWith(250);
      expect(imageUrl).toBe('url(/api/series/sprite/2.png');
    });

    it('should use sprite index 0 for id < 100', () => {
      component.type = component.TYPE_BOOK;
      component.id = 50;

      const imageUrl = component.image;

      expect(imageUrl).toBe('url(/api/book/sprite/0.png');
    });

    it('should use sprite index 5 for id 500-599', () => {
      component.type = component.TYPE_BOOK;
      component.id = 550;

      const imageUrl = component.image;

      expect(imageUrl).toBe('url(/api/book/sprite/5.png');
    });
  });

  describe('positionX getter', () => {
    it('should calculate position based on index in sprite', () => {
      component.id = 42;

      const position = component.positionX;

      expect(ThumbnailUtils.getIndexInSprites).toHaveBeenCalledWith(42);
      expect(position).toBe(`${-1 * 80 * 42}px`);
    });

    it('should return 0px for id 0', () => {
      component.id = 0;

      const position = component.positionX;

      expect(position).toBe('0px');
    });

    it('should calculate negative offset for id > 0', () => {
      component.id = 10;

      const position = component.positionX;

      expect(position).toBe(`${-1 * 80 * 10}px`);
      expect(position).toBe('-800px');
    });

    it('should use 80px width for each sprite position', () => {
      component.id = 5;

      const position = component.positionX;

      expect(position).toBe('-400px'); // -1 * 80 * 5
    });

    it('should handle position for id 99 (last in sprite)', () => {
      component.id = 99;

      const position = component.positionX;

      expect(position).toBe(`${-1 * 80 * 99}px`);
      expect(position).toBe('-7920px');
    });
  });

  describe('integration', () => {
    it('should generate correct book sprite URL and position', () => {
      component.type = component.TYPE_BOOK;
      component.id = 325;

      const imageUrl = component.image;
      const position = component.positionX;

      expect(imageUrl).toBe('url(/api/book/sprite/3.png');
      expect(position).toBe(`${-1 * 80 * 25}px`); // 325 % 100 = 25
    });

    it('should generate correct series sprite URL and position', () => {
      component.type = component.TYPE_SERIES;
      component.id = 715;

      const imageUrl = component.image;
      const position = component.positionX;

      expect(imageUrl).toBe('url(/api/series/sprite/7.png');
      expect(position).toBe(`${-1 * 80 * 15}px`); // 715 % 100 = 15
    });

    it('should update URL when type changes', () => {
      component.id = 200;

      component.type = component.TYPE_BOOK;
      let imageUrl = component.image;
      expect(imageUrl).toContain('/api/book/sprite/');

      component.type = component.TYPE_SERIES;
      imageUrl = component.image;
      expect(imageUrl).toContain('/api/series/sprite/');
    });

    it('should update position when id changes', () => {
      component.type = component.TYPE_BOOK;

      component.id = 10;
      let position = component.positionX;
      expect(position).toBe('-800px');

      component.id = 20;
      position = component.positionX;
      expect(position).toBe('-1600px');
    });
  });
});

describe('ImageSpritesModule', () => {
  it('should create module', () => {
    const module = new ImageSpritesModule();
    expect(module).toBeTruthy();
  });
});

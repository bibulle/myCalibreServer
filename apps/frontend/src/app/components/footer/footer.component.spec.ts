import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';
import { TitleService } from '../../app/title.service';
import { Version } from '@my-calibre-server/api-interfaces';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;
  let mockTitleService: jest.Mocked<TitleService>;

  beforeEach(async () => {
    const mockVersion = new Version();
    mockVersion.version = '1.2.3';
    mockVersion.name = 'myCalibreServer';

    mockTitleService = {
      getVersion: jest.fn().mockResolvedValue(mockVersion),
    } as any;

    await TestBed.configureTestingModule({
      declarations: [FooterComponent],
      providers: [{ provide: TitleService, useValue: mockTitleService }],
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty version', () => {
      expect(component.version).toBeInstanceOf(Version);
    });

    it('should have TitleService injected', () => {
      expect(component['_titleService']).toBe(mockTitleService);
    });
  });

  describe('ngOnInit', () => {
    it('should call getVersion on init', async () => {
      await component.ngOnInit();

      expect(mockTitleService.getVersion).toHaveBeenCalled();
    });

    it('should update version after getVersion resolves', async () => {
      await component.ngOnInit();
      await fixture.whenStable();

      expect(component.version.version).toBe('1.2.3');
      expect(component.version.name).toBe('myCalibreServer');
    });

    it('should handle version fetch success', (done) => {
      component.ngOnInit();

      setTimeout(() => {
        expect(component.version.version).toBe('1.2.3');
        expect(mockTitleService.getVersion).toHaveBeenCalledTimes(1);
        done();
      }, 50);
    });

    it('should handle multiple ngOnInit calls', async () => {
      await component.ngOnInit();
      await component.ngOnInit();

      expect(mockTitleService.getVersion).toHaveBeenCalledTimes(2);
      expect(component.version.version).toBe('1.2.3');
    });
  });

  describe('version property', () => {
    it('should be mutable after init', async () => {
      await component.ngOnInit();
      await fixture.whenStable();

      const newVersion = new Version();
      newVersion.version = '2.0.0';
      component.version = newVersion;

      expect(component.version.version).toBe('2.0.0');
    });

    it('should maintain version object reference until service call completes', () => {
      const initialVersion = component.version;
      component.ngOnInit();

      // Version should still be the initial empty object until promise resolves
      expect(component.version).toBe(initialVersion);
    });
  });

  describe('error handling', () => {
    it('should not crash when getVersion rejects', () => {
      mockTitleService.getVersion.mockRejectedValue(new Error('API Error'));

      // ngOnInit doesn't return a promise, so no await
      expect(() => component.ngOnInit()).not.toThrow();
    });

    it('should leave version unchanged when service fails', (done) => {
      const initialVersion = component.version;
      mockTitleService.getVersion.mockRejectedValue(new Error('Network Error'));

      component.ngOnInit();

      setTimeout(() => {
        // Version should still be the initial object since promise rejected
        expect(component.version).toBe(initialVersion);
        done();
      }, 50);
    });
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotFoundComponent } from './not-found.component';
import { FilterService, Filter } from '../filter-bar/filter.service';

describe('NotFoundComponent', () => {
  let component: NotFoundComponent;
  let fixture: ComponentFixture<NotFoundComponent>;
  let mockFilterService: jest.Mocked<FilterService>;

  beforeEach(async () => {
    mockFilterService = {
      update: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      declarations: [NotFoundComponent],
      providers: [{ provide: FilterService, useValue: mockFilterService }],
    }).compileComponents();

    fixture = TestBed.createComponent(NotFoundComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should have FilterService injected', () => {
      expect(component['_filterService']).toBe(mockFilterService);
    });
  });

  describe('ngOnInit', () => {
    it('should update filter with not_displayed: true', () => {
      component.ngOnInit();

      expect(mockFilterService.update).toHaveBeenCalledTimes(1);
      expect(mockFilterService.update).toHaveBeenCalledWith(expect.objectContaining({ not_displayed: true }));
    });

    it('should create new Filter instance', () => {
      component.ngOnInit();

      const callArg = mockFilterService.update.mock.calls[0][0];
      expect(callArg).toBeInstanceOf(Filter);
    });

    it('should call update on every ngOnInit', () => {
      component.ngOnInit();
      component.ngOnInit();
      component.ngOnInit();

      expect(mockFilterService.update).toHaveBeenCalledTimes(3);
    });

    it('should set not_displayed property correctly', () => {
      component.ngOnInit();

      const filter = mockFilterService.update.mock.calls[0][0];
      expect(filter.not_displayed).toBe(true);
    });
  });

  describe('integration', () => {
    it('should configure filter for not-found page on init', () => {
      component.ngOnInit();

      const calledFilter = mockFilterService.update.mock.calls[0][0];
      expect(calledFilter).toBeInstanceOf(Filter);
      expect(calledFilter.not_displayed).toBe(true);
      expect(mockFilterService.update).toHaveBeenCalledTimes(1);
    });
  });
});

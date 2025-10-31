import { TestBed } from '@angular/core/testing';
import { INavigationLink, NavigationService } from './navigation.service';

describe('NavigationService', () => {
  let service: NavigationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NavigationService],
    });
    service = TestBed.inject(NavigationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize currentTitle as null', () => {
      expect(service.currentTitle).toBeNull();
    });

    it('should initialize nextLink as null', () => {
      expect(service.nextLink).toBeNull();
    });

    it('should initialize prevLink as null', () => {
      expect(service.prevLink).toBeNull();
    });
  });

  describe('property setters', () => {
    it('should allow setting currentTitle', () => {
      service.currentTitle = 'Test Title';
      expect(service.currentTitle).toBe('Test Title');
    });

    it('should allow setting currentTitle to null', () => {
      service.currentTitle = 'Test';
      service.currentTitle = null;
      expect(service.currentTitle).toBeNull();
    });

    it('should allow setting nextLink', () => {
      const nextLink: INavigationLink = {
        brief: 'Next Page',
        routeLink: '/next',
      };
      service.nextLink = nextLink;
      expect(service.nextLink).toEqual(nextLink);
    });

    it('should allow setting prevLink', () => {
      const prevLink: INavigationLink = {
        brief: 'Previous Page',
        routeLink: '/previous',
      };
      service.prevLink = prevLink;
      expect(service.prevLink).toEqual(prevLink);
    });

    it('should allow setting both links simultaneously', () => {
      const nextLink: INavigationLink = {
        brief: 'Next',
        routeLink: '/next',
      };
      const prevLink: INavigationLink = {
        brief: 'Previous',
        routeLink: '/prev',
      };

      service.nextLink = nextLink;
      service.prevLink = prevLink;

      expect(service.nextLink).toEqual(nextLink);
      expect(service.prevLink).toEqual(prevLink);
    });

    it('should allow resetting links to null', () => {
      service.nextLink = { brief: 'Next', routeLink: '/next' };
      service.prevLink = { brief: 'Prev', routeLink: '/prev' };

      service.nextLink = null;
      service.prevLink = null;

      expect(service.nextLink).toBeNull();
      expect(service.prevLink).toBeNull();
    });
  });

  describe('navigation state management', () => {
    it('should maintain independent state for currentTitle and links', () => {
      service.currentTitle = 'Current Page';
      service.nextLink = { brief: 'Next', routeLink: '/next' };
      service.prevLink = { brief: 'Prev', routeLink: '/prev' };

      expect(service.currentTitle).toBe('Current Page');
      expect(service.nextLink?.brief).toBe('Next');
      expect(service.prevLink?.brief).toBe('Prev');
    });

    it('should allow partial updates without affecting other properties', () => {
      service.currentTitle = 'Title';
      service.nextLink = { brief: 'Next', routeLink: '/next' };
      service.prevLink = { brief: 'Prev', routeLink: '/prev' };

      service.nextLink = null;

      expect(service.currentTitle).toBe('Title');
      expect(service.nextLink).toBeNull();
      expect(service.prevLink).toEqual({ brief: 'Prev', routeLink: '/prev' });
    });
  });
});

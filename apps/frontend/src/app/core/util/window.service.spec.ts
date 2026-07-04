import { WindowService } from './window.service';

describe('WindowService', () => {
  it('should be created', () => {
    expect(new WindowService()).toBeTruthy();
  });

  describe('createWindow', () => {
    it('should return null when the url is null', () => {
      expect(WindowService.createWindow(null as unknown as string)).toBeNull();
    });

    it('should open a centered popup window with the given url and name', () => {
      const openSpy = jest.spyOn(window, 'open').mockReturnValue({} as Window);

      const result = WindowService.createWindow('http://example.com', 'MyWindow', 400, 300);

      expect(openSpy).toHaveBeenCalledWith('http://example.com', 'MyWindow', expect.stringContaining('width=400,height=300'));
      expect(result).toBeDefined();

      openSpy.mockRestore();
    });

    it('should apply default name, width and height when not provided', () => {
      const openSpy = jest.spyOn(window, 'open').mockReturnValue({} as Window);

      WindowService.createWindow('http://example.com');

      expect(openSpy).toHaveBeenCalledWith('http://example.com', 'Window', expect.stringContaining('width=500,height=600'));

      openSpy.mockRestore();
    });
  });
});

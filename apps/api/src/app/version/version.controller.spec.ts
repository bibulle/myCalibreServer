import { Test, TestingModule } from '@nestjs/testing';
import { VersionController } from './version.controller';
import { VersionService } from './version.service';

describe('VersionController', () => {
  let controller: VersionController;
  let versionService: VersionService;

  const mockVersionService = {
    getVersion: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VersionController],
      providers: [
        {
          provide: VersionService,
          useValue: mockVersionService,
        },
      ],
    }).compile();

    controller = module.get<VersionController>(VersionController);
    versionService = module.get<VersionService>(VersionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('version', () => {
    it('should return version information', async () => {
      const mockVersion = {
        version: '1.0.0',
        name: 'myCalibreServer',
        copyright: '2023 Test',
        github_url: 'https://github.com/test/repo',
      };

      mockVersionService.getVersion.mockReturnValue(mockVersion);

      const result = await controller.version();

      expect(versionService.getVersion).toHaveBeenCalled();
      expect(result).toEqual({ version: mockVersion });
    });

    it('should call VersionService.getVersion', async () => {
      const mockVersion = {
        version: '2.0.0',
        name: 'Test App',
      };

      mockVersionService.getVersion.mockReturnValue(mockVersion);

      await controller.version();

      expect(versionService.getVersion).toHaveBeenCalledTimes(1);
    });

    it('should handle different version formats', async () => {
      const mockVersion = {
        version: '0.5.3-beta',
        name: 'Dev Version',
      };

      mockVersionService.getVersion.mockReturnValue(mockVersion);

      const result = await controller.version();

      expect(result.version).toBeDefined();
      expect(result.version.version).toBe('0.5.3-beta');
    });
  });
});

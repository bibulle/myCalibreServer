import { Test, TestingModule } from '@nestjs/testing';
import { VersionService } from './version.service';
import { Version } from '@my-calibre-server/api-interfaces';

describe('VersionService', () => {
  let service: VersionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VersionService],
    }).compile();

    service = module.get<VersionService>(VersionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getVersion', () => {
    it('should return a Version object', () => {
      const result = service.getVersion();

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Version);
    });

    it('should return version with properties', () => {
      const result = service.getVersion();

      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('copyright');
      expect(result).toHaveProperty('github_url');
    });
  });
});

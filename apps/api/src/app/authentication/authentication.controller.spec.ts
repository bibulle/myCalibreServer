import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../app.module';
import { ConfigService } from '@nestjs/config';

describe('Session Secret Configuration (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('SESSION_SECRET Environment Variable', () => {
    it('should have SESSION_SECRET configured from environment', () => {
      const configService = app.get(ConfigService);
      const sessionSecret = configService.get('SESSION_SECRET');

      expect(sessionSecret).toBeDefined();
      expect(sessionSecret).not.toBe('SECRET_SESSION'); // Ne doit plus être le secret hardcodé
      expect(typeof sessionSecret).toBe('string');
      expect(sessionSecret.length).toBeGreaterThan(0);
    });

    it('should not use hardcoded SECRET_SESSION anymore', () => {
      const configService = app.get(ConfigService);
      const sessionSecret = configService.get('SESSION_SECRET');

      // Vérifier que le secret n'est pas la valeur hardcodée précédente
      expect(sessionSecret).not.toBe('SECRET_SESSION');
    });

    it('should have a reasonably long secret for security', () => {
      const configService = app.get(ConfigService);
      const sessionSecret = configService.get('SESSION_SECRET');

      // Un secret de session devrait avoir au moins 16 caractères
      expect(sessionSecret.length).toBeGreaterThanOrEqual(16);
    });
  });
});

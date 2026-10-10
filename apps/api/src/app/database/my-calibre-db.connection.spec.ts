import { ConfigService } from '@nestjs/config';
import { MyCalibreDbService } from './my-calibre-db.service';

/**
 * Connection handling of MyCalibreDbService, against a mocked MongoDB driver (no database
 * needed, unlike my-calibre-db.service.spec.ts).
 */
const mockConnect = jest.fn();
const mockClose = jest.fn();
const mockFind = jest.fn();
const mockFindOne = jest.fn();
const mockClientCount = { value: 0 };

jest.mock('mongodb', () => ({
  MongoClient: jest.fn().mockImplementation(() => {
    mockClientCount.value++;
    return {
      connect: mockConnect,
      close: mockClose,
      db: (name: string) => ({
        databaseName: name,
        collection: (colName: string) => ({
          collectionName: colName,
          find: mockFind,
          findOne: mockFindOne,
        }),
      }),
    };
  }),
}));

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('MyCalibreDbService (connection)', () => {
  const configService = { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClientCount.value = 0;
    mockClose.mockResolvedValue(undefined);
    mockFind.mockReturnValue({ sort: () => ({ toArray: () => Promise.resolve([{ id: 'u1' }]) }) });
    mockFindOne.mockResolvedValue({ id: 'u1' });
  });

  it('should not crash (unhandled rejection) when Mongo is down at startup', async () => {
    mockConnect.mockRejectedValue(new Error('connect ECONNREFUSED'));
    const unhandled = jest.fn();
    process.on('unhandledRejection', unhandled);

    new MyCalibreDbService(configService);
    await flush();
    await flush();

    process.off('unhandledRejection', unhandled);
    expect(unhandled).not.toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('should reject with the historical message while Mongo is down', async () => {
    mockConnect.mockRejectedValue(new Error('connect ECONNREFUSED'));
    const service = new MyCalibreDbService(configService);

    await expect(service.getAllUsers()).rejects.toBe('Cannot connect to Mongo !!');
    await expect(service.findUserById('u1')).rejects.toBe('Cannot connect to Mongo !!');
  });

  it('should reconnect on the next call once Mongo is back', async () => {
    mockConnect.mockRejectedValueOnce(new Error('connect ECONNREFUSED')).mockResolvedValue(undefined);
    const service = new MyCalibreDbService(configService);
    await flush();

    await expect(service.getAllUsers()).resolves.toEqual([{ id: 'u1' }]);
    expect(mockClientCount.value).toBe(2);
  });

  it('should share a single connection attempt between concurrent calls', async () => {
    mockConnect.mockResolvedValue(undefined);
    const service = new MyCalibreDbService(configService);

    await Promise.all([service.getAllUsers(), service.findUserById('u1'), service.findUserByUsername('bob')]);
    await service.findUserByGoogleId('g1');

    expect(mockClientCount.value).toBe(1);
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  describe('onModuleDestroy', () => {
    it('should close the Mongo connection once', async () => {
      mockConnect.mockResolvedValue(undefined);
      const service = new MyCalibreDbService(configService);
      await flush();

      await service.onModuleDestroy();
      await service.onModuleDestroy();

      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it('should do nothing when never connected', async () => {
      mockConnect.mockRejectedValue(new Error('connect ECONNREFUSED'));
      const service = new MyCalibreDbService(configService);
      await flush();
      mockClose.mockClear();

      await service.onModuleDestroy();

      expect(mockClose).not.toHaveBeenCalled();
    });
  });

  describe('getConnectionStatus', () => {
    it('should be OK once connected', async () => {
      mockConnect.mockResolvedValue(undefined);
      const service = new MyCalibreDbService(configService);
      await flush();

      expect(service.getConnectionStatus()).toBe('OK');
    });

    it('should report the last error and retry the connection when disconnected', async () => {
      mockConnect.mockRejectedValue(new Error('connect ECONNREFUSED'));
      const service = new MyCalibreDbService(configService);
      await flush();
      await flush();

      expect(service.getConnectionStatus()).toBe('KO : connect ECONNREFUSED');
      expect(mockClientCount.value).toBe(2);
      await flush();
    });
  });
});

import { jest } from "@jest/globals";

interface StorageResponse<T> {
  data: T | null;
  error: Error | null;
}

interface StorageFileObject {
  name: string;
  metadata?: {
    version?: string;
  };
}

export const mockUpload = jest
  .fn<() => Promise<StorageResponse<null>>>()
  .mockResolvedValue({ error: null, data: null });
export const mockDownload = jest
  .fn<() => Promise<StorageResponse<Blob>>>()
  .mockResolvedValue({ data: new Blob(["test content"]), error: null });
export const mockList = jest
  .fn<() => Promise<StorageResponse<StorageFileObject[]>>>()
  .mockResolvedValue({
    data: [],
    error: null,
  });

export const mockStorageClient = {
  from: jest.fn().mockReturnValue({
    upload: mockUpload,
    download: mockDownload,
    list: mockList,
  }),
};

export const mockStorage = {
  storage: mockStorageClient,
};

// Reset all mocks between tests
export function resetMocks(): void {
  mockUpload.mockClear();
  mockDownload.mockClear();
  mockList.mockClear();
  mockStorageClient.from.mockClear();
}

// Helper to simulate a version in storage
export function mockVersion(
  timestamp: string,
  content: string,
  hash: string,
): StorageFileObject {
  return {
    name: `${timestamp}.html`,
    metadata: {
      version: JSON.stringify({
        timestamp,
        length: content.length,
        hash,
      }),
    },
  };
}

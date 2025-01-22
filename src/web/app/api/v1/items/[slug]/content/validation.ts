import { z } from "zod";

export enum UploadStatus {
  UPDATED_MAIN = "UPDATED_MAIN",
  STORED_VERSION = "STORED_VERSION",
  SKIPPED = "SKIPPED",
  ERROR = "ERROR",
}

export const GetItemContentRequestSchema = z.object({
  slug: z.string(),
});

export type GetItemContentResponse =
  | {
      content: string;
      itemId: string;
    }
  | {
      error: string;
    };

export const UpdateItemContentRequestSchema = z.object({
  content: z.string(),
  slug: z.string(),
});

export type UpdateItemContentResponse =
  | {
      status: UploadStatus.UPDATED_MAIN;
      itemId: string;
      message: string;
    }
  | {
      status: UploadStatus.STORED_VERSION;
      itemId: string;
      message: string;
    }
  | {
      status: UploadStatus.SKIPPED;
      itemId: string;
      message: string;
    }
  | {
      status: UploadStatus.ERROR;
      error: string;
    };

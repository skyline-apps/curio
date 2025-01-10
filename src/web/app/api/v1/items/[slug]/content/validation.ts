import { z } from "zod";

export enum UploadStatus {
  UPDATED_MAIN = "UPDATED_MAIN",
  STORED_VERSION = "STORED_VERSION",
  SKIPPED = "SKIPPED",
  ERROR = "ERROR",
}

export const ItemContentSchema = z.object({
  content: z.string(),
});

export type GetItemContentResponse =
  | {
      content: string;
      itemId: string;
    }
  | {
      error: string;
    };

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

import { createReadStream, statSync } from "node:fs";
import path from "node:path";

export function getFileMeta(filePath: string): {
  fileName: string;
  fileSize: number;
} {
  const stat = statSync(filePath);
  return {
    fileName: path.basename(filePath),
    fileSize: stat.size
  };
}

export function createUploadStream(filePath: string) {
  return createReadStream(filePath);
}

import { getAccessToken } from './googleDriveAuth';

export interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  createdTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  shared?: boolean;
  owners?: { displayName: string; emailAddress: string; photoLink?: string }[];
  parents?: string[];
}

export interface DriveStorageQuota {
  limit?: string;
  usage?: string;
  usageInDrive?: string;
  usageInDriveTrash?: string;
}

export interface DriveUserInfo {
  displayName?: string;
  emailAddress?: string;
  photoLink?: string;
  storageQuota?: DriveStorageQuota;
}

/**
 * List files and folders from Google Drive
 */
export async function listDriveFiles(options?: {
  folderId?: string;
  query?: string;
  pageSize?: number;
  pageToken?: string;
}): Promise<{ files: DriveItem[]; nextPageToken?: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Not authenticated with Google Drive');
  }

  const queries: string[] = ['trashed = false'];

  if (options?.folderId) {
    queries.push(`'${options.folderId}' in parents`);
  }

  if (options?.query && options.query.trim()) {
    const escaped = options.query.replace(/'/g, "\\'");
    queries.push(`name contains '${escaped}'`);
  }

  const q = queries.join(' and ');
  const fields = 'nextPageToken, files(id, name, mimeType, size, modifiedTime, createdTime, webViewLink, webContentLink, iconLink, thumbnailLink, shared, owners, parents)';
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', q);
  url.searchParams.set('fields', fields);
  url.searchParams.set('pageSize', String(options?.pageSize || 30));
  url.searchParams.set('orderBy', 'folder,modifiedTime desc');

  if (options?.pageToken) {
    url.searchParams.set('pageToken', options.pageToken);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Google Drive API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create a new Folder in Google Drive
 */
export async function createDriveFolder(
  folderName: string,
  parentFolderId?: string
): Promise<DriveItem> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Drive');

  const metadata: Record<string, any> = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const response = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create folder on Google Drive');
  }

  return response.json();
}

/**
 * Upload a binary or text file to Google Drive using multipart upload
 */
export async function uploadDriveFile(
  file: File,
  parentFolderId?: string,
  description?: string
): Promise<DriveItem> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Drive');

  const metadata: Record<string, any> = {
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    description: description || 'Uploaded via Shobuj Bangla Farm Cloud',
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const reader = new FileReader();
  const fileData = await new Promise<ArrayBuffer>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const mediaHeader = `${delimiter}Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`;

  const encoder = new TextEncoder();
  const metadataBuffer = encoder.encode(metadataPart);
  const mediaHeaderBuffer = encoder.encode(mediaHeader);
  const closeDelimiterBuffer = encoder.encode(closeDelimiter);

  const combined = new Uint8Array(
    metadataBuffer.byteLength +
    mediaHeaderBuffer.byteLength +
    fileData.byteLength +
    closeDelimiterBuffer.byteLength
  );

  let offset = 0;
  combined.set(metadataBuffer, offset);
  offset += metadataBuffer.byteLength;
  combined.set(mediaHeaderBuffer, offset);
  offset += mediaHeaderBuffer.byteLength;
  combined.set(new Uint8Array(fileData), offset);
  offset += fileData.byteLength;
  combined.set(closeDelimiterBuffer, offset);

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: combined,
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to upload file to Google Drive');
  }

  return response.json();
}

/**
 * Upload text/document directly (e.g., CSV, Report, Agreement Text)
 */
export async function uploadTextDocumentToDrive(
  fileName: string,
  content: string,
  mimeType = 'text/plain',
  parentFolderId?: string
): Promise<DriveItem> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Drive');

  const metadata: Record<string, any> = {
    name: fileName,
    mimeType: mimeType,
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const mediaPart = `${delimiter}Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n${content}${closeDelimiter}`;

  const body = metadataPart + mediaPart;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to upload document to Google Drive');
  }

  return response.json();
}

/**
 * Delete a file or folder from Google Drive
 * CAUTION: Caller MUST ensure user confirmation dialog is displayed beforehand!
 */
export async function deleteDriveFile(fileId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Drive');

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to delete file from Google Drive');
  }
}

/**
 * Get Google Drive user profile and storage quota
 */
export async function getDriveAbout(): Promise<DriveUserInfo> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Drive');

  const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user,storageQuota', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to fetch Google Drive user details');
  }

  const data = await response.json();
  return {
    displayName: data.user?.displayName,
    emailAddress: data.user?.emailAddress,
    photoLink: data.user?.photoLink,
    storageQuota: data.storageQuota,
  };
}

/**
 * Format raw bytes into human-readable string
 */
export function formatBytes(bytesStr?: string | number): string {
  if (!bytesStr) return '0 B';
  const bytes = typeof bytesStr === 'string' ? parseInt(bytesStr, 10) : bytesStr;
  if (isNaN(bytes) || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

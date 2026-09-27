import * as Minio from 'minio';
import { config } from '../../config';
import fs from 'fs';
import path from 'path';

export class MinioService {
  private client?: Minio.Client;
  private bucket: string;
  private isConnected: boolean = false;
  private localFallbackDir: string;

  constructor() {
    this.bucket = config.minio.bucketName;
    this.localFallbackDir = path.resolve(__dirname, '../../../uploads_fallback');
    
    if (!fs.existsSync(this.localFallbackDir)) {
      fs.mkdirSync(this.localFallbackDir, { recursive: true });
    }

    try {
      this.client = new Minio.Client({
        endPoint: config.minio.endPoint,
        port: config.minio.port,
        useSSL: config.minio.useSSL,
        accessKey: config.minio.accessKey,
        secretKey: config.minio.secretKey
      });
      this.ensureBucket();
    } catch (err) {
      console.warn('[MinioService] MinIO não conectado, usando fallback local para anexos.');
    }
  }

  private async ensureBucket() {
    if (!this.client) return;
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket, 'us-east-1');
        console.log(`[MinioService] Bucket ${this.bucket} criado com sucesso.`);
      }
      this.isConnected = true;
    } catch (error) {
      console.warn(`[MinioService] Aviso ao conectar no MinIO: ${(error as Error).message}. Usando fallback local.`);
      this.isConnected = false;
    }
  }

  async uploadFile(file: Express.Multer.File, storageKey: string): Promise<{ storageKey: string; url: string }> {
    if (this.isConnected && this.client) {
      try {
        await this.client.putObject(this.bucket, storageKey, file.buffer, file.size, {
          'Content-Type': file.mimetype
        });
        const url = `http://${config.minio.endPoint}:${config.minio.port}/${this.bucket}/${storageKey}`;
        return { storageKey, url };
      } catch (err) {
        console.warn('[MinioService] Erro no upload MinIO, salvando localmente:', (err as Error).message);
      }
    }

    // Fallback de armazenamento local (útil para desenvolvimento offline)
    const filePath = path.join(this.localFallbackDir, storageKey);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, file.buffer);
    const url = `/api/v1/attachments/file/${storageKey}`;
    return { storageKey, url };
  }

  async getFileStream(storageKey: string) {
    if (this.isConnected && this.client) {
      try {
        return await this.client.getObject(this.bucket, storageKey);
      } catch (err) {
        // tenta fallback
      }
    }

    const filePath = path.join(this.localFallbackDir, storageKey);
    if (fs.existsSync(filePath)) {
      return fs.createReadStream(filePath);
    }
    throw new Error('Arquivo não encontrado no storage');
  }
}

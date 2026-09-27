import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'sinergia-super-secret-key-2026',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://sinergia:sinergia_secret@localhost:5432/sinergia_db',
  minio: {
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadminpassword',
    bucketName: process.env.MINIO_BUCKET || 'sinergia-attachments'
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || 'sinergia-task-manager',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk@sinergia.iam.gserviceaccount.com',
    privateKey: process.env.FIREBASE_PRIVATE_KEY || 'mock-private-key'
  }
};

import admin from 'firebase-admin';
import { config } from '../config';
import { logger } from '../shared/utils/logger';
import * as path from 'path';
import * as fs from 'fs';

let initialized = false;

export function initFirebaseAdmin() {
  if (initialized) return;

  try {
    const svcJson = config.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!svcJson) {
      logger.warn('Firebase service account not provided; Firebase Admin not initialized');
      return;
    }

    let serviceAccount: any;
    try {
      // Try parsing as JSON first
      serviceAccount = JSON.parse(svcJson);
    } catch (err) {
      // If it's a path (file path), resolve it and read the file
      try {
        // Resolve path relative to project root
        const filePath = path.isAbsolute(svcJson) 
          ? svcJson 
          : path.resolve(process.cwd(), svcJson);
        
        if (fs.existsSync(filePath)) {
          const fileContent = fs.readFileSync(filePath, 'utf8');
          serviceAccount = JSON.parse(fileContent);
          logger.info(`Loaded Firebase service account from: ${filePath}`);
        } else {
          logger.error(`Firebase service account file not found: ${filePath}`);
          return;
        }
      } catch (inner) {
        logger.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', inner);
        return;
      }
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    initialized = true;
    logger.info('Firebase Admin initialized');
  } catch (error) {
    logger.error('Error initializing Firebase Admin:', error);
  }
}

export const firebaseAdmin = admin;
export const firebaseInitialized = () => initialized;

import { writeFileSync } from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname + '/../.env')
dotenv.config({ path: envPath });


writeFileSync(
  'src/environments/environment.prod.ts',
  `
export const environment = {
  production: true,
  apiUrl: '${process.env.API_URL}',
  socketUrl: '${process.env.SOCKET_URL}',
  imageUrl: '${process.env.IMAGE_URL}',
  VAPID_PUBLIC_KEY: '${process.env.VAPID_PUBLIC_KEY}',
  bucketName: '${process.env.BUCKET_NAME}',
  get imageBaseUrl() {
    return "${process.env.IMAGE_BASE_URL}${process.env.BUCKET_NAME}/";
  },
};
`
);
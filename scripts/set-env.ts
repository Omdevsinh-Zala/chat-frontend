import { writeFileSync } from 'fs';

writeFileSync(
  'src/environments/environment.prod.ts',
  `
export const environment = {
  production: true,
  apiUrl: '${process.env.API_URL}',
  socketUrl: '${process.env.SOCKET_URL}',
  imageUrl: '${process.env.IMAGE_URL}',
  VAPID_PUBLIC_KEY: '${process.env.VAPID_PUBLIC_KEY}',
};
`
);
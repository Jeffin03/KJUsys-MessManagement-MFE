import { configLoader } from './config-loader.service';

export const environment = {
  production: true,
  project: 'mess-management',
  baseRoute: 'kjusys',
  local: false,
  baseUrl: 'https://kj-usys-mess-management-mfe.vercel.app',
  publicPath: 'https://kj-usys-mess-management.vercel.app/',
  apirefreshUrl: 'https://kj-usys-mess-management-mfe.vercel.app/kjusys-api/authnauthz/refresh-access-token',
};

configLoader.load(environment);
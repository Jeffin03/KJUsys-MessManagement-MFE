import { configLoader } from './config-loader.service';

export const environment = {
  production: true,
  manifestPath: '/assets/mf.manifest.vercel.json',
  mfe: {
    'mess-management': 'https://kj-usys-mess-management.vercel.app',
  },
  publicPath: 'https://kj-usys-mess-management-mfe.vercel.app/',
  baseUrl: 'https://kj-usys-mess-management-mfe.vercel.app',
  portalLambdaBaseUrl: 'https://your-lambda.amazonaws.com/prod',
  project: 'shell',
  baseRoute: 'kjusys',
  local: false,
};

configLoader.load(environment);
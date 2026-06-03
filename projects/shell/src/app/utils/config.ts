import { Manifest, RemoteConfig } from '@angular-architects/module-federation';

export type CustomRemoteConfig = RemoteConfig & {
  displayName: string;
  routePath: string;
  ngModuleName: string;
  subModule: [
    {
      remoteEntry: string;
      exposedModule: string;
      displayName: string;
      routePath: string;
      subPath: string;
      ngModuleName: string;
    }
  ];
};

export type CustomManifest = Manifest<CustomRemoteConfig>;

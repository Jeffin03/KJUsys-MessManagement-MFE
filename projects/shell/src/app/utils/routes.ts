// import { getManifest, loadRemoteModule } from '@angular-architects/module-federation';
// import { Routes } from '@angular/router';
// import { APP_ROUTES } from '../app.routes';
// import { CustomManifest } from './config';
// import { ManifestResolver } from './manifestResolver';
// import { NavigationComponent } from '../navigation/navigation.component';
// import { AuthGuard } from '@libs/shared-auth';



// export function buildRoutes(): Routes {
//     const lazyRoutes = Object.entries(getManifest<CustomManifest>())
//         .map(([key, value]) => {
//             // console.log(key);
//             // Check if value.subModule is defined and is an array
//             if (Array.isArray(value.subModule)) {
//                 return value.subModule.map((res) => {
//                     return {
//                         path: value.routePath,
//                         loadChildren: () =>
//                             loadRemoteModule({
//                                 type: 'manifest',
//                                 remoteName: key,
//                                 exposedModule: res.exposedModule,
//                             }).then((m) => m[res.ngModuleName!]),
//                             canActivate: [AuthGuard],
//                         data: {
//                             breadcrumb: {
//                                 module: value.displayName,
//                                 subModule: res.displayName,
//                                 url: res.subPath,
//                             },
                            
//                         },
//                     };
//                 });
//             } else {
//                 // Handle the case where value.subModule is not an array
//                 //console.error(`value.subModule is not an array for key: ${key}`);
//                 return []; // Return an empty array or handle this case as needed
//             }
//         })
//         .flat();

//     const notFound = [
//         {
//             path: '**',
//             redirectTo: '',
//         },
//     ];

//     const allroutes = [...lazyRoutes]; // Correctly initialize allroutes with lazyRoutes

//     const nav = [

//         {
//             path: 'kjusys',
//             component: NavigationComponent,
//             children: [
//                 ...allroutes,
//             ],
//             canActivate: [AuthGuard],
//         },

//     ];
//     return [...APP_ROUTES, ...nav];
//     //const routesWithLeftMenu = [...APP_ROUTES, ...nav, leftMenuRoute];
//     //return routesWithLeftMenu;
// }

// export function buildRoutes(): Routes {
//   const lazyRoutes = Object.entries(getManifest<CustomManifest>())
//     .map(([key, value]) => {
//       // Check if value.subModule is defined and is an array
//       if (Array.isArray(value.subModule)) {
//         return value.subModule.map((res) => {
//           return {
//             // Use the full subPath as specified in the manifest
//             // This should already be formatted as "hr/payslips" based on your example
//             path: res.subPath,
//             loadChildren: () =>
//               loadRemoteModule({
//                 type: 'manifest',
//                 remoteName: key,
//                 exposedModule: res.exposedModule,
//               }).then((m) => m[res.ngModuleName!]),
//             canActivate: [AuthGuard],
//             data: {
//               breadcrumb: {
//                 module: value.displayName,
//                 subModule: res.displayName,
//                 url: res.subPath,
//               },
//             },
//           };
//         });
//       } else {
//         // Handle the case where value.subModule is not an array
//         return []; // Return an empty array or handle this case as needed
//       }
//     })
//     .flat();

//   const notFound = [
//     {
//       path: '**',
//       redirectTo: '',
//     },
//   ];

//   const allroutes = [...lazyRoutes]; // Correctly initialize allroutes with lazyRoutes
  
//   const nav = [
//     {
//       path: 'kjusys',
//       component: NavigationComponent,
//       children: [
//         ...allroutes,
//       ],
//       canActivate: [AuthGuard],
//     },
//   ];

//   return [...APP_ROUTES, ...nav];
// }

import { getManifest, loadRemoteModule } from '@angular-architects/module-federation';
import { Routes } from '@angular/router';
import { APP_ROUTES } from '../app.routes';
import { CustomManifest } from './config';
import { ManifestResolver } from './manifestResolver';
import { NavigationComponent } from '../navigation/navigation.component';
import { AuthGuard } from '@libs/shared-auth';

// One silent retry for transient remoteEntry fetch failures (network blips).
// Waits 1s before retrying — enough for most transient conditions to resolve
// without any noticeable UX impact.
function withRetry<T>(fn: () => Promise<T>, delayMs = 1000): Promise<T> {
  return fn().catch(
    () => new Promise<T>((resolve, reject) =>
      setTimeout(() => fn().then(resolve).catch(reject), delayMs)
    )
  );
}

export function buildRoutes(): Routes {
  const manifest = getManifest<CustomManifest>();
  // console.log('Manifest:', manifest);
  const lazyRoutes = Object.entries(manifest)
    .map(([key, value]) => {
      // console.log(`Processing remote: ${key}`, value);
      if (Array.isArray(value.subModule)) {
        return value.subModule.map((res) => {
          // console.log(`Submodule for ${key}:`, res);
          const loadRemote = () =>
            withRetry(() =>
              loadRemoteModule({
                type: 'manifest',
                remoteName: key,
                exposedModule: res.exposedModule,
              })
            );

          const lazyLoader = res.componentName
            ? {
                loadComponent: () =>
                  loadRemote()
                    .then((m) => m[res.componentName!])
                    .catch((error) => {
                      console.error(`Failed to load component ${res.componentName} from ${key}:`, error);
                      throw error;
                    }),
              }
            : {
                loadChildren: () =>
                  loadRemote()
                    .then((m) => m[res.ngModuleName!])
                    .catch((error) => {
                      console.error(`Failed to load module ${res.ngModuleName} from ${key}:`, error);
                      throw error;
                    }),
              };

          return {
            path: res.subPath,
            ...lazyLoader,
            canActivate: [AuthGuard],
            data: {
              breadcrumb: {
                module: value.displayName,
                subModule: res.displayName,
                url: res.subPath,
              },
            },
          };
        });
      } else {
        console.log(`subModule is not an array for ${key}:`, value.subModule);
        return [];
      }
    })
    .flat();

  const notFound = [
    {
      path: '**',
      redirectTo: '',
    },
  ];

  const allroutes = [...lazyRoutes];
  const nav = [
    {
      path: 'kjusys',
      component: NavigationComponent,
      children: [...allroutes],
      canActivate: [AuthGuard],
    },
  ];

  return [...APP_ROUTES, ...nav];
}

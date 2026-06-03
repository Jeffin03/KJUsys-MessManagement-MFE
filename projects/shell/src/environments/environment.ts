// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
    production: false,
    manifestPath: '/assets/mf.manifest.json',
    mfe: {
        admissions: 'http://localhost:4201',
        core: 'http://localhost:4202',
        sim: 'http://localhost:4203',
        hr: 'http://localhost:4205',
        fees: 'http://localhost:4206',
        library: 'http://localhost:4207',
        apps: 'http://localhost:4208',
        arena: 'http://localhost:4209',
        guesthouse: 'http://localhost:4210',
        gymnasium: 'http://localhost:4211',

    },




    baseUrl: 'http://localhost:8080/kjusys-api',



   portalLambdaBaseUrl: 'https://2fezfat6k2.execute-api.ap-south-1.amazonaws.com/development',

    project: 'shell', 
    baseRoute: 'kjusys', 
    local: false,
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/*
  USAGE:
  npm run create:project -- --name <project-name>
  npm run create:project -- --name <project-name> --port <port>
*/

const args = process.argv.slice(2);
let projectName = '';
let port = 0;

args.forEach((arg, index) => {
  if (arg === '--name') {
    projectName = args[index + 1];
  } else if (arg === '--port') {
    port = parseInt(args[index + 1]);
  }
});

if (!projectName) {
  console.error('Error: Please provide a project name using --name <name>');
  process.exit(1);
}

const rootDir = path.resolve(__dirname, '..');
const angularJsonPath = path.join(rootDir, 'angular.json');
const packageJsonPath = path.join(rootDir, 'package.json');
const shellWebpackPath = path.join(rootDir, 'projects/shell/webpack.config.js');
const shellWebpackProdPath = path.join(rootDir, 'projects/shell/webpack.prod.config.js');
const shellWebpackDevPath = path.join(rootDir, 'projects/shell/webpack.dev.config.js');
const prodServerDir = path.join(rootDir, 'prod-server');

function runCommand(command) {
  console.log(`\n> ${command}`);
  try {
    execSync(command, { stdio: 'inherit', cwd: rootDir });
  } catch (e) {
    console.error(`Command failed: ${command}`);
    process.exit(1);
  }
}

if (!port) {
  console.log('Determining next available port...');
  const angularJson = JSON.parse(fs.readFileSync(angularJsonPath, 'utf8'));
  let maxPort = 4200;

  Object.values(angularJson.projects).forEach(project => {
    if (project.architect && project.architect.serve && project.architect.serve.options && project.architect.serve.options.port) {
      if (project.architect.serve.options.port > maxPort) {
        maxPort = project.architect.serve.options.port;
      }
    }
  });

  port = maxPort + 1;
  console.log(`Detected next available port: ${port}`);
}

console.log(`\nCreating Angular Project: ${projectName} (standalone=false)...`);
runCommand(`ng generate application ${projectName} --routing --style css --inline-style=false --inline-template=false --skip-tests --standalone=false`);

const projectRoot = path.join(rootDir, 'projects', projectName);
const srcDir = path.join(projectRoot, 'src');
const appDir = path.join(srcDir, 'app');
const environmentsDir = path.join(srcDir, 'environments');

console.log(`\nConfiguring Module Federation for ${projectName} on port ${port}...`);
runCommand(`ng add @angular-architects/module-federation --project ${projectName} --port ${port} --type remote`);

console.log(`\nOverwriting webpack.config.js with legacy template...`);
const webpackConfigContent = `const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
const mf = require("@angular-architects/module-federation/webpack");
const path = require("path");
const share = mf.share;

const sharedMappings = new mf.SharedMappings();
sharedMappings.register(
  path.join(__dirname, '../../tsconfig.json'),[
    /* mapped paths to share */
    "@libs/left-menu-lib",
    "@libs/menu-header-lib",
    "@libs/shared-auth",
    "@libs/http-common",
  ]);

module.exports = {
  output: {
    uniqueName: "${projectName}",
    publicPath: 'http://localhost:${port}/',
    scriptType: 'text/javascript',
  },
  optimization: {
    runtimeChunk: false
  },   
  resolve: {
    alias: {
      ...sharedMappings.getAliases(),
    }
  },
  experiments: {
    outputModule: true
  },
  plugins: [
    new ModuleFederationPlugin({
        library: { type: "module" },
        name: "${projectName}",
        filename: "remoteEntry.js",
        exposes: {
             // Example expose, user can add more modules here
             './Module': './projects/${projectName}/src/app/app.module.ts',
        },
        shared: share({
          "@angular/core": { singleton: true, strictVersion: true, requiredVersion: 'auto' }, 
          "@angular/common": { singleton: true, strictVersion: true, requiredVersion: 'auto' }, 
          "@angular/common/http": { singleton: true, strictVersion: true, requiredVersion: 'auto' }, 
          "@angular/router": { singleton: true, strictVersion: true, requiredVersion: 'auto' },
          "ngx-toastr": { singleton: true, strictVersion: true, requiredVersion: 'auto' },

          ...sharedMappings.getDescriptors()
        })
        
    }),
    sharedMappings.getPlugin()
  ],
};
`;
fs.writeFileSync(path.join(projectRoot, 'webpack.config.js'), webpackConfigContent);

console.log(`\nCreating webpack.prod.config.js...`);
const webpackProdConfigContent = `const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
const mf = require("@angular-architects/module-federation/webpack");
const path = require("path");
const share = mf.share;

const sharedMappings = new mf.SharedMappings();
sharedMappings.register(
  path.join(__dirname, '../../tsconfig.json'),[
    /* mapped paths to share */
    "@libs/left-menu-lib",
    "@libs/menu-header-lib",
    "@libs/shared-auth",
    "@libs/http-common",
  ]);

module.exports = {
  output: {
    uniqueName: "${projectName}",
    publicPath: "https://kjusys-${projectName}.kristujayanti.edu.in/",
    scriptType: "text/javascript",
  },
  optimization: {
    runtimeChunk: false
  },   
  resolve: {
    alias: {
      ...sharedMappings.getAliases(),
    }
  },
  experiments: {
    outputModule: true
  },
  plugins: [
    new ModuleFederationPlugin({
        library: { type: "module" },
        name:"${projectName}",
        filename: "remoteEntry.js",
        exposes:{
          // Example expose
          './Module': './projects/${projectName}/src/app/app.module.ts',
        },
        shared: share({
            "@angular/core": { singleton: true, strictVersion: true, requiredVersion: 'auto' }, 
            "@angular/common": { singleton: true, strictVersion: true, requiredVersion: 'auto' }, 
            "@angular/common/http": { singleton: true, strictVersion: true, requiredVersion: 'auto' }, 
            "@angular/router": { singleton: true, strictVersion: true, requiredVersion: 'auto' },
            "ngx-toastr": { singleton: true, strictVersion: true, requiredVersion: 'auto' },
  
            ...sharedMappings.getDescriptors()
          })
          
      }),
      sharedMappings.getPlugin()
    ],
  };
`;
fs.writeFileSync(path.join(projectRoot, 'webpack.prod.config.js'), webpackProdConfigContent);

console.log(`\nCreating webpack.dev.config.js...`);
const webpackDevConfigContent = webpackProdConfigContent.replace(
  `https://kjusys-\${projectName}.kristujayanti.edu.in/`,
  `http://\${projectName}.dev-kjusys.kristujayanti.edu.in/`
);
fs.writeFileSync(path.join(projectRoot, 'webpack.dev.config.js'), webpackDevConfigContent);

console.log(`\nCreating tailwind.config.js...`);
const tailwindConfigContent = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
    "./projects/${projectName}/src/**/*.{html,ts}",
    "../libs/**/*.{html,ts}",
    "../../node_modules/flowbite/**/*.js"
  ],
  theme: {
    screens:{
      'sm':'640px',
      'md':'768px',
      'lg':'1024px',
      'xl':'1280px',
      '2xl':'1536px',
    },
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [
    require('flowbite/plugin')({
      charts: true,
    }),
  ],
}
`;
fs.writeFileSync(path.join(projectRoot, 'tailwind.config.js'), tailwindConfigContent);

console.log(`\nCreating environment files...`);
if (!fs.existsSync(environmentsDir)) {
  fs.mkdirSync(environmentsDir, { recursive: true });
}

const envTs = `
export const environment = {
    production: false,
    mfe: {
        ${projectName}: 'http://localhost:${port}',
    },
    publicPath: 'http://localhost:${port}/', 
    baseUrl: 'http://172.21.14.247:8080/kjusys-api', 
    project: '${projectName}',
    baseRoute: 'kjusys', 
    local: false,
    apirefreshUrl: 'http://172.21.14.247:8080/kjusys-api/authnauthz/refresh-access-token'
};
`;

const envProdTs = `export const environment = {
  production: true,
  project: '${projectName}',
  baseRoute: 'kjusys',
  local: false,
  baseUrl: 'https://kjusys.kristujayanti.edu.in/kjusys-api',
  //apirefreshUrl:'http://kjusys.kristujayanti.edu.in/kjusys-api/authnauthz/refresh-access-token',
};
`;

const envDevTs = `export const environment = {
  production: true,
  project: '${projectName}',
  baseRoute: 'kjusys',
  local: false,
  baseUrl: 'http://dev-kjusys.kristujayanti.edu.in/kjusys-api',
};
`;


const envLocalServerProdTs = `// This file can be replaced during build by using the \`fileReplacements\` array.
// \`ng build\` replaces \`environment.ts\` with \`environment.prod.ts\`.
// The list of file replacements can be found in \`angular.json\`.

export const environment = {
    production: true,
    mfe: {
        // Add remotes here as needed
        admissions: 'http://localhost:4201',
        core: 'http://localhost:4202',
        sim: 'http://localhost:4203',
        applicant: 'http://localhost:4204',
        ${projectName}: 'http://localhost:${port}',
    },
    publicPath: 'http://localhost:4200/',
    baseUrl: 'http://172.21.14.247:8080/api/',
    project: 'shell',
    baseRoute: 'kjusys',
    local: true,
  };
`;

fs.writeFileSync(path.join(environmentsDir, 'environment.ts'), envTs);
fs.writeFileSync(path.join(environmentsDir, 'environment.prod.ts'), envProdTs);
fs.writeFileSync(path.join(environmentsDir, 'environment.dev.ts'), envDevTs);
fs.writeFileSync(path.join(environmentsDir, 'environment.local-server.prod.ts'), envLocalServerProdTs);

console.log(`\nCreating app routing files...`);

// Updated: Commented out the children example based on user request
const appRoutesTs = `import { Routes } from '@angular/router';
import { SharedAuthComponent } from '@libs/shared-auth';
import { NavigationComponent } from './modules/navigation/navigation.component';

export const APP_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: SharedAuthComponent,
    data: {
      module: '${projectName}',
    },
  },
  {
    path: 'kjusys',
    component: NavigationComponent,
    children: [
    ],
  },
];
`;
fs.writeFileSync(path.join(appDir, 'app.routes.ts'), appRoutesTs);

const appRoutingModuleTs = `import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { APP_ROUTES } from './app.routes';

@NgModule({
  imports: [RouterModule.forRoot(APP_ROUTES)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
`;
fs.writeFileSync(path.join(appDir, 'app-routing.module.ts'), appRoutingModuleTs);

const navModuleDir = path.join(appDir, 'modules/navigation');
fs.mkdirSync(navModuleDir, { recursive: true });

const navComponentTs = `import { Component } from '@angular/core';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})
export class NavigationComponent {}
`;
fs.writeFileSync(path.join(navModuleDir, 'navigation.component.ts'), navComponentTs);

const navComponentHtml = `<router-outlet></router-outlet>`;
fs.writeFileSync(path.join(navModuleDir, 'navigation.component.html'), navComponentHtml);

fs.writeFileSync(path.join(navModuleDir, 'navigation.component.css'), '');

// Updated: Added spec file creation
const navComponentSpecTs = `import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationComponent } from './navigation.component';

describe('NavigationComponent', () => {
  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NavigationComponent]
    });
    fixture = TestBed.createComponent(NavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
`;
fs.writeFileSync(path.join(navModuleDir, 'navigation.component.spec.ts'), navComponentSpecTs);


console.log(`\nUpdating app.module.ts...`);
const appModuleTs = `import { isDevMode, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavigationComponent } from './modules/navigation/navigation.component';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { CommonHttpInterceptor, HttpCommonModule } from '@libs/http-common';
import { AuthService, AuthGuard, SharedToastService, SharedAuthModule } from '@libs/shared-auth';
import { CookieService } from 'ngx-cookie-service';
import { ReactiveFormsModule } from '@angular/forms';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { EffectsModule } from '@ngrx/effects';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent
  ],
  providers: [
    {
      provide: LocationStrategy,
      useClass: HashLocationStrategy
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CommonHttpInterceptor,
      multi: true,
    },
    AuthService,
    AuthGuard,
    CookieService,
    SharedToastService
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    StoreModule.forRoot({}, {
          //  metaReducers,
          runtimeChecks: {
              strictStateImmutability: false,
              strictActionImmutability: false,
          },
      }),
    StoreDevtoolsModule.instrument({
          maxAge: 25, // Retains last 25 states
          logOnly: !isDevMode(), // Restrict extension to log-only mode
          autoPause: true, // Pauses recording actions and state changes when the extension window is not open
      }),
      EffectsModule.forRoot([]),
      HttpCommonModule.forRoot(environment),
      SharedAuthModule,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
`;
fs.writeFileSync(path.join(appDir, 'app.module.ts'), appModuleTs);

console.log(`\nCreating src/polyfills.ts...`);
const polyfillsTs = `import 'zone.js';
`;
fs.writeFileSync(path.join(srcDir, 'polyfills.ts'), polyfillsTs);

console.log(`\nCreating app.component.spec.ts...`);
const appComponentSpecTs = `import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [RouterTestingModule],
    declarations: [AppComponent]
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(\`should have as title '${projectName}'\`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('${projectName}');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.content span')?.textContent).toContain('${projectName} app is running!');
  });
});
`;
fs.writeFileSync(path.join(appDir, 'app.component.spec.ts'), appComponentSpecTs);

// Updated: Overwrite app.component.html with older project structure including app-toast
const appComponentHtml = `<router-outlet></router-outlet>
<app-toast></app-toast>
`;
fs.writeFileSync(path.join(appDir, 'app.component.html'), appComponentHtml);


console.log(`\nUpdating tsconfig.app.json...`);
const tsConfigPath = path.join(projectRoot, 'tsconfig.app.json');
if (fs.existsSync(tsConfigPath)) {
  const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
  if (tsConfig.files && !tsConfig.files.includes('src/polyfills.ts')) {
    const mainIndex = tsConfig.files.indexOf('src/main.ts');
    if (mainIndex !== -1) {
      tsConfig.files.splice(mainIndex + 1, 0, 'src/polyfills.ts');
    } else {
      tsConfig.files.push('src/polyfills.ts');
    }
    fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));
  }
}

console.log(`\nUpdating angular.json configurations...`);
const angularJson = JSON.parse(fs.readFileSync(angularJsonPath, 'utf8'));
const projectConfig = angularJson.projects[projectName];

if (projectConfig) {
  delete projectConfig.schematics;

  const build = projectConfig.architect.build;
  const serve = projectConfig.architect.serve;

  const styles = build.options.styles || [];
  const missingStyles = [
    "node_modules/ngx-toastr/toastr.css",
    "node_modules/ag-grid-community/styles/ag-grid.css",
    "node_modules/ag-grid-community/styles/ag-theme-alpine.css"
  ];
  missingStyles.forEach(s => {
    if (!styles.includes(s)) styles.push(s);
  });
  build.options.styles = styles;

  if (!build.options.polyfills || !build.options.polyfills.includes(`projects/${projectName}/src/polyfills.ts`)) {
    build.options.polyfills = [
      "zone.js",
      `projects/${projectName}/src/polyfills.ts`
    ];
  } else if (typeof build.options.polyfills === 'string') {
    build.options.polyfills = [
      "zone.js",
      `projects/${projectName}/src/polyfills.ts`
    ];
  }

  build.configurations = {
    "production": {
      "budgets": [
        { "type": "initial", "maximumWarning": "600kb", "maximumError": "2mb" },
        { "type": "anyComponentStyle", "maximumWarning": "20kb", "maximumError": "100kb" }
      ],
      "fileReplacements": [
        {
          "replace": `projects/${projectName}/src/environments/environment.ts`,
          "with": `projects/${projectName}/src/environments/environment.prod.ts`
        }
      ],
      "outputHashing": "all",
      "extraWebpackConfig": `projects/${projectName}/webpack.prod.config.js`
    },
    "demo": {
      "budgets": [
        { "type": "initial", "maximumWarning": "500kb", "maximumError": "1mb" },
        { "type": "anyComponentStyle", "maximumWarning": "2kb", "maximumError": "4kb" }
      ],
      "fileReplacements": [
        {
          "replace": `projects/${projectName}/src/environments/environment.ts`,
          "with": `projects/${projectName}/src/environments/environment.prod.ts`
        }
      ],
      "outputHashing": "all",
      "extraWebpackConfig": `projects/${projectName}/webpack.prod.config.js`
    },
    "local-server": {
      "budgets": [
        { "type": "initial", "maximumWarning": "2mb", "maximumError": "4mb" },
        { "type": "anyComponentStyle", "maximumWarning": "4mb", "maximumError": "8mb" }
      ],
      "fileReplacements": [
        {
          "replace": `projects/${projectName}/src/environments/environment.ts`,
          "with": `projects/${projectName}/src/environments/environment.local-server.prod.ts`
        }
      ],
      "outputHashing": "all",
      "extraWebpackConfig": `projects/${projectName}/webpack.config.js`
    },
    "development": {
      "buildOptimizer": false,
      "optimization": false,
      "vendorChunk": true,
      "extractLicenses": false,
      "sourceMap": true,
      "namedChunks": true,
      "fileReplacements": [
        {
          "replace": `projects/${projectName}/src/environments/environment.ts`,
          "with": `projects/${projectName}/src/environments/environment.dev.ts`
        }
      ],
      "extraWebpackConfig": `projects/${projectName}/webpack.dev.config.js`
    },
    "local": {
      "buildOptimizer": false,
      "optimization": false,
      "vendorChunk": true,
      "extractLicenses": false,
      "sourceMap": true,
      "namedChunks": true
    }
  };

  serve.configurations = {
    "production": {
      "browserTarget": `${projectName}:build:production`,
      "extraWebpackConfig": `projects/${projectName}/webpack.prod.config.js`
    },
    "development": {
      "browserTarget": `${projectName}:build:development`
    },
    "local": {
      "browserTarget": `${projectName}:build:local`
    }
  };

  serve.defaultConfiguration = "local";

  fs.writeFileSync(angularJsonPath, JSON.stringify(angularJson, null, 2));
}

console.log(`\nRegistering ${projectName} in Shell Webpack Configs...`);

function updateShellWebpack(filePath, isProd, isDev = false) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  const remotesRegex = /remotes:\s*{([^}]+)}/;
  const match = content.match(remotesRegex);

  if (match) {
    const currentRemotes = match[1];
    if (!currentRemotes.includes(projectName)) {
      let url;
      if (isProd) {
        url = `https://kjusys-${projectName}.kristujayanti.edu.in/remoteEntry.js`;
      } else if (isDev) {
        url = `http://${projectName}.dev-kjusys.kristujayanti.edu.in/remoteEntry.js`;
      } else {
        url = `http://localhost:${port}/remoteEntry.js`;
      }

      const updatedRemotes = currentRemotes.trimEnd() + `\n        ${projectName}: "${url}",\n      `;
      content = content.replace(currentRemotes, updatedRemotes);
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${path.basename(filePath)}`);
    }
  }
}

updateShellWebpack(shellWebpackPath, false);
updateShellWebpack(shellWebpackProdPath, true);
updateShellWebpack(shellWebpackDevPath, false, true);

console.log(`\nCreating Production Server Script: prod-server/${projectName}.js...`);
const serverTemplate = `const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
const app = express();
const port = ${port};

app.use(
  cors({
    credentials: true,
    "Access-Control-Allow-Origin": "*",
    origin: "*",
  })
);
/// Serve the ${projectName} application
app.use(
  "/",
  express.static(
    path.join(__dirname.split("/prod-server")[0], "/dist/${projectName}")
  )
);

app.get("*/", (req, res) => {
  if (req.path.endsWith(".js")) {
    res.sendFile(
      path.resolve(
        __dirname.split("/prod-server")[0],
        "/dist/${projectName}" + req.path
      )
    );
  } else {
    res.sendFile(
      path.resolve(
        __dirname.split("prod-server")[0],
        "dist/${projectName}/index.html"
      )
    );
  }
});
// Start the server
const server = http.createServer(app);
server.listen(port, "0.0.0.0", () => console.log("Running..."));
`;

fs.writeFileSync(path.join(prodServerDir, `${projectName}.js`), serverTemplate);

console.log(`\nUpdating package.json scripts...`);
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

packageJson.scripts[`build:${projectName}`] = `ng build ${projectName} --configuration=\${BUILD_CONFIG:-production}`;

let buildScript = packageJson.scripts['build'];
if (buildScript && !buildScript.includes(`build:${projectName}`)) {
  packageJson.scripts['build'] = buildScript + ` && npm run build:${projectName}`;
}

let startScript = packageJson.scripts['start'];
if (startScript && !startScript.includes(`prod-server/${projectName}.js`)) {
  packageJson.scripts['start'] = startScript + ` \"node prod-server/${projectName}.js\"`;
}

let serveScript = packageJson.scripts['serve'];
if (serveScript && !serveScript.includes(`${projectName} --host`)) {
  packageJson.scripts['serve'] = serveScript + ` \"ng serve ${projectName} --host 0.0.0.0 --disable-host-check\"`;
}

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log(`\n✅ Project ${projectName} created successfully on port ${port} with LEGACY structure!`);

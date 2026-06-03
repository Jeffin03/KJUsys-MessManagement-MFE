const fs = require('fs');
const path = require('path');
function getArg(name) {
    const validArgs = [`--${name}`, `-${name[0]}`];
    const index = process.argv.findIndex(arg => validArgs.includes(arg));
    if (index === -1 || index + 1 >= process.argv.length) return null;
    return process.argv[index + 1];
}

const projectName = getArg('project');
const moduleName = getArg('module');

if (!projectName || !moduleName) {
    console.error('Usage: node scripts/create-module.js --project <project-name> --module <module-name>');
    process.exit(1);
}

if (moduleName.startsWith('-')) {
    console.error(`Error: Module name "${moduleName}" invalid. Should not start with "-".`);
    process.exit(1);
}

const rootDir = process.cwd();
const projectPath = path.join(rootDir, 'projects', projectName);

if (!fs.existsSync(projectPath)) {
    console.error(`Error: Project "${projectName}" does not exist in ${path.join(rootDir, 'projects')}`);
    process.exit(1);
}

console.log(`Creating module "${moduleName}" in project "${projectName}"...`);

const paramCase = (str) => str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
const pascalCase = (str) => str.charAt(0).toUpperCase() + str.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
const moduleNameParam = paramCase(moduleName);
const moduleNamePascal = pascalCase(moduleName);

const modulePath = path.join(projectPath, 'src/app/modules', moduleNameParam);

if (fs.existsSync(modulePath)) {
    console.warn(`Warning: Module directory already exists at ${modulePath}. Skipping file creation.`);
} else {
    fs.mkdirSync(modulePath, { recursive: true });
    fs.writeFileSync(path.join(modulePath, `${moduleNameParam}.component.html`), `<p>${moduleNameParam} works!</p>\n`);
    fs.writeFileSync(path.join(modulePath, `${moduleNameParam}.component.css`), ``);
    const componentContent = `import { Component } from '@angular/core';

@Component({
  selector: 'app-${moduleNameParam}',
  templateUrl: './${moduleNameParam}.component.html',
  styleUrls: ['./${moduleNameParam}.component.css']
})
export class ${moduleNamePascal}Component {

}
`;
    fs.writeFileSync(path.join(modulePath, `${moduleNameParam}.component.ts`), componentContent);
    const specContent = `import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ${moduleNamePascal}Component } from './${moduleNameParam}.component';

describe('${moduleNamePascal}Component', () => {
  let component: ${moduleNamePascal}Component;
  let fixture: ComponentFixture<${moduleNamePascal}Component>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [${moduleNamePascal}Component]
    });
    fixture = TestBed.createComponent(${moduleNamePascal}Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
`;
    fs.writeFileSync(path.join(modulePath, `${moduleNameParam}.component.spec.ts`), specContent);
    const routingContent = `import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { ${moduleNamePascal}Component } from './${moduleNameParam}.component';



const routes:Routes = [
    {
        path:'',
        component:${moduleNamePascal}Component,
        data:{
            breadcrumb:{
                module:'KJUSYS',
                subModule: '${moduleNameParam}',
                url: '${projectName}/${moduleNameParam}'
            },
            submenu:true,
        }
    }
]


@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ${moduleNamePascal}ModuleRoutingModule {}
`;
    fs.writeFileSync(path.join(modulePath, `${moduleNameParam}-routing.module.ts`), routingContent);

    const moduleContent = `import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ${moduleNamePascal}ModuleRoutingModule } from './${moduleNameParam}-routing.module';
import { ${moduleNamePascal}Component } from './${moduleNameParam}.component';


@NgModule({
  declarations: [
    ${moduleNamePascal}Component
  ],
  imports: [
    CommonModule,
    ${moduleNamePascal}ModuleRoutingModule
  ]
})
export class ${moduleNamePascal}Module { }
`;
    fs.writeFileSync(path.join(modulePath, `${moduleNameParam}.module.ts`), moduleContent);
    console.log(`Created module files in ${modulePath}`);
}

const appRoutesPath = path.join(projectPath, 'src/app/app.routes.ts');
if (fs.existsSync(appRoutesPath)) {
    let routesContent = fs.readFileSync(appRoutesPath, 'utf8');
    
    if (!routesContent.includes(`path: '${moduleNameParam}'`)) {
        const routeEntry = `      {
        path: '${moduleNameParam}',
        loadChildren: () =>
          import('./modules/${moduleNameParam}/${moduleNameParam}.module')
            .then((m) => m.${moduleNamePascal}Module)
            .catch((error) => {
               console.error('Error loading ${moduleNamePascal}Module', error);
               throw error;
            }),
      },`;

        const childrenRegex = /(children:\s*\[)([\s\S]*?)(\s*\])/;
        
        if (childrenRegex.test(routesContent)) {
             routesContent = routesContent.replace(childrenRegex, (match, start, content, end) => {
                 let newContent = content.trimEnd();
                 if (newContent.length > 0 && !newContent.endsWith(',')) {
                     newContent += ',';
                 }
                 return `${start}${newContent}\n${routeEntry}\n${end}`;
             });
             fs.writeFileSync(appRoutesPath, routesContent);
             console.log(`Updated ${appRoutesPath}`);
        } else {
             console.warn(`Could not find "children: []" in app.routes.ts. Please add the route manually.`);
        }
    } else {
        console.log(`Route for ${moduleNameParam} already in app.routes.ts`);
    }
} else {
    console.error(`Error: app.routes.ts not found at ${appRoutesPath}`);
}

const tsConfigPath = path.join(projectPath, 'tsconfig.app.json');
if (fs.existsSync(tsConfigPath)) {
    try {
        const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
        if (tsConfig.files) {
            const moduleFile = `src/app/modules/${moduleNameParam}/${moduleNameParam}.module.ts`;
            if (!tsConfig.files.includes(moduleFile)) {
                tsConfig.files.push(moduleFile);
                fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));
                console.log(`Updated tsconfig.app.json`);
            } else {
                console.log(`Module entry already in tsconfig.app.json`);
            }
        }
    } catch(e) {
        console.error(`Error updating tsconfig.app.json: ${e.message}`);
    }
}

const webpackConfigs = ['webpack.config.js', 'webpack.prod.config.js', 'webpack.dev.config.js'];

webpackConfigs.forEach(configFile => {
    const configPath = path.join(projectPath, configFile);
    if (fs.existsSync(configPath)) {
        let content = fs.readFileSync(configPath, 'utf8');
        const exposeKey = `'./${moduleNamePascal}Module'`;
        
        if (!content.includes(exposeKey)) {
             const exposesRegex = /(exposes:\s*\{)([\s\S]*?)(\s*\})/;
             if (exposesRegex.test(content)) {
                 const newExpose = `          ${exposeKey}: './projects/${projectName}/src/app/modules/${moduleNameParam}/${moduleNameParam}.module.ts',`;
                 content = content.replace(exposesRegex, (match, start, inner, end) => {
                     let newInner = inner.trimEnd();
                     const needsComma = (str) => {
                        const trimmed = str.trim();
                        if (trimmed.length === 0) return false;
                        const lastChar = trimmed[trimmed.length - 1];
                        return lastChar !== ',' && lastChar !== '{';
                     };

                     if (needsComma(inner)) {
                         newInner += ',';
                     }
                     return `${start}${newInner}\n${newExpose}\n${end}`;
                 });
                 fs.writeFileSync(configPath, content);
                 console.log(`Updated ${configFile}`);
             } else {
                 console.warn(`Could not find "exposes: {}" in ${configFile}`);
             }
        } else {
             console.log(`Expose entry already exists in ${configFile}`);
        }
    }
});

const angularJsonPath = path.join(rootDir, 'angular.json');
let angularConfig;
try {
    angularConfig = JSON.parse(fs.readFileSync(angularJsonPath, 'utf8'));
} catch (e) {
    console.warn("Could not read angular.json to infer ports.");
}

const manifestFiles = [
    path.join(rootDir, 'projects/shell/src/assets/mf.manifest.json'),
    path.join(rootDir, 'projects/shell/src/assets/mf.manifest.prod.json'),
    path.join(rootDir, 'projects/shell/src/assets/mf.manifest.dev.json')
];

manifestFiles.forEach(manifestPath => {
    if (fs.existsSync(manifestPath)) {
        try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            
            if (!manifest[projectName]) {
                console.log(`Project "${projectName}" not in manifest. Attempting to add it...`);
                let port = 4200; 
                if (angularConfig && angularConfig.projects[projectName] && angularConfig.projects[projectName].architect.serve.options) {
                    port = angularConfig.projects[projectName].architect.serve.options.port;
                }
                
                manifest[projectName] = {
                    remoteEntry: `http://localhost:${port}/remoteEntry.js`,
                    displayName: pascalCase(projectName),
                    routePath: paramCase(projectName),
                    subModule: []
                };
            }

            if (manifest[projectName]) {
                if (!manifest[projectName].subModule) {
                     manifest[projectName].subModule = [];
                }
                
                const subModules = manifest[projectName].subModule;
                const exists = subModules.find(m => m.ngModuleName === `${moduleNamePascal}Module`);
                
                if (!exists) {
                    subModules.push({
                        exposedModule: `./${moduleNamePascal}Module`,
                        displayName: moduleNamePascal.replace(/([A-Z])/g, ' $1').trim(),
                        subPath: `${projectName}/${moduleNameParam}`,
                        ngModuleName: `${moduleNamePascal}Module`,
                        pinned: false
                    });
                    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
                    console.log(`Updated manifest ${path.basename(manifestPath)}`);
                } else {
                    console.log(`Module already in manifest ${path.basename(manifestPath)}`);
                }
            }
        } catch (e) {
            console.error(`Error updating manifest ${manifestPath}: ${e.message}`);
        }
    }
});

console.log('Done.');

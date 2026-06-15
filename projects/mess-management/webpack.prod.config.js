const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
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
    uniqueName: "mess-management",
    publicPath: "https://kjusys-mess-management.kristujayanti.edu.in/",
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
        name:"mess-management",
        filename: "remoteEntry.js",
        exposes:{
          './App': './projects/mess-management/src/app/app.component.ts',
          './Dashboard': './projects/mess-management/src/app/modules/dashboard/dashboard.component.ts',
          './SubscriberManagement': './projects/mess-management/src/app/modules/subscriber-management/subscriber-management.component.ts'
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

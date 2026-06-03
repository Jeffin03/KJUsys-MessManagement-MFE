const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
const mf = require("@angular-architects/module-federation/webpack");
const path = require("path");
const share = mf.share;

const sharedMappings = new mf.SharedMappings();
sharedMappings.register(path.join(__dirname, "../../tsconfig.json"), [
  "@libs/left-menu-lib",
  "@libs/menu-header-lib",
  "@libs/shared-auth",
  "@libs/http-common",
  "@libs/shared-toast"
]);

module.exports = {
  cache: { maxAge: 7 * 24 * 60 * 60 * 1000 },
  output: {
    uniqueName: "shell",
    publicPath: "http://localhost:4200/",
    scriptType: "text/javascript",
  },
  optimization: {
    runtimeChunk: false,
    splitChunks: {
      chunks: 'async',
      minSize: 20000,
      maxSize: 2000000,
      cacheGroups: {
        defaultVendors: false,
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
  },
  resolve: {
    alias: {
      ...sharedMappings.getAliases(),
    },
  },
  experiments: {
    outputModule: true,
  },
  plugins: [
    new ModuleFederationPlugin({
      library: { type: "module" },
      name: "shell",
      // All remotes are loaded dynamically via loadManifest at runtime.
      // Static entries here cause webpack to route remote chunk URLs through
      // the shell's own __webpack_require__ (publicPath = localhost:4200),
      // so every remote's lazy chunks are requested from the wrong server.
      // Leaving this empty lets each remote's import.meta.url resolve its
      // own publicPath correctly.
      remotes: {},

      // For remotes (please adjust)
      //name: "shell",
      //filename: "remoteEntry.js",
      //exposes: {
      //'./Component': './projects/shell/src/app/app.component.ts',
      //'./Module':'./projects/shell/src/app/modules/login/login.module.ts',
      //},

      // For hosts (please adjust)
      // remotes: {
      //     "admissions": "http://localhost:4200/remoteEntry.js",
      //     "sim": "http://localhost:4200/remoteEntry.js",
      //     "core": "http://localhost:4200/remoteEntry.js",
      //     "applicant": "http://localhost:4200/remoteEntry.js",
      // },

      shared: share({
        "@angular/core": {
          singleton: true,
          strictVersion: true,
          requiredVersion: "auto",
        },
        "@angular/common": {
          singleton: true,
          strictVersion: true,
          requiredVersion: "auto",
        },
        "@angular/common/http": {
          singleton: true,
          strictVersion: true,
          requiredVersion: "auto",
        },
        "@angular/router": {
          singleton: true,
          strictVersion: true,
          requiredVersion: "auto",
        },
        "ngx-toastr": {
          singleton: true,
          strictVersion: true,
          requiredVersion: "auto",
        },
        "@angular/platform-browser/animations": {
          singleton: true,
          strictVersion: true,
          requiredVersion: "auto",
        },
        "ngx-spinner": {
          singleton: true,
          strictVersion: true,
          requiredVersion: "auto",
        },
        "@libs/left-menu-lib": { singleton: true, strictVersion: true },
        "@libs/menu-header-lib": { singleton: true, strictVersion: true },
        "@libs/shared-auth": { singleton: true, strictVersion: true },
        "@libs/http-common": { singleton: true, strictVersion: true },
        "@libs/shared-toast": { singleton: true, strictVersion: true },
        "@ngx-formly/core": { singleton: true, strictVersion: false, requiredVersion: "auto" },
        "@ngx-formly/bootstrap": { singleton: true, strictVersion: false, requiredVersion: "auto" },




        ...sharedMappings.getDescriptors(),
      }),
    }),
    sharedMappings.getPlugin(),
  ],
};

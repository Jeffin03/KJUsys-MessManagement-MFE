const base = require('./webpack.config');
module.exports = {
  ...base,
  output: { ...base.output, publicPath: 'https://kj-usys-mess-management-mfe.vercel.app/' },
  mode: 'production',
};
const path = require('path')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

module.exports = {
  entry: path.resolve(`${__dirname}/src/OrgChart.vue`),
  output: {
    path: path.resolve(`${__dirname}/lib/`),
    filename: 'vue-orgchart.js',
    library: 'vue-orgchart',
    libraryTarget: 'umd',
    umdNamedDefine: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
    ],
  },
  plugins: [new BundleAnalyzerPlugin({ analyzerMode: 'static' })],
}

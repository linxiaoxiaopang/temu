const { defineConfig } = require('@vue/cli-service')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
module.exports = defineConfig({
  transpileDependencies: true,
  productionSourceMap: false,
  publicPath: './',
  devServer: {
    devMiddleware: {
      writeToDisk: (filePath) => {
        if (filePath.includes('.hot-update.')) {
          return false // 不写入磁盘
        }
        return true
      }
    }
  },
  configureWebpack: config => {
    config.devtool = false
    config.plugins.push(new CleanWebpackPlugin())
  }
})

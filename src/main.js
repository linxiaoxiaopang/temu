const mitmproxy = require('node-mitmproxy')
const main = require('./proxyController')

// main()
// 启动代理服务器
mitmproxy.createProxy({
  port: 9001, // 代理端口

  requestInterceptor: (rOptions, req, res, ssl, next) => {
    // console.log('rOptions', rOptions)
    console.log('rOptions', rOptions)
    console.log(`正在访问：${rOptions.protocol}//${rOptions.hostname}:${rOptions.port}`)
    next()
  },
  responseInterceptor: (req, res, proxyReq, proxyRes, ssl, next) => {
    if(res.path?.indexOf('productService/productPrototype/list')>=0) {
      console.log('proxyRes', proxyRes)
    }
    next()
  },

  // HTTPS 配置（需要生成证书）
  sslConnectInterceptor: (req, cltSocket, head) => {
    return req.url.indexOf('api.toaddit.com') >= 0
  },

  // // 证书配置（需要提前生成）
  // caCertPath: './certs/node-mitmproxy.ca.crt',
  // caKeyPath: './certs/node-mitmproxy.ca.key.pem'
})

console.log('代理服务器启动成功，监听端口 9000')
console.log('请将设备代理设置为: http://当前IP:9000')

let requests = []
let maxRequests = 100 // 最大存储请求数

// 监听请求发送事件，捕获请求头
chrome.webRequest.onSendHeaders.addListener(
  (details) => {
    // 构建请求信息对象
    const requestInfo = {
      id: Date.now(),
      url: details.url,
      method: details.method,
      time: new Date(details.timeStamp).toLocaleTimeString(),
      headers: details.requestHeaders || []
    }
    const headers = details.requestHeaders.reduce((prev, cur) => {
      prev[cur.name] = cur.value
      return prev
    }, {})
    if (details.url === 'https://api.toaddit.com/toadditbusiness/productService/productCategory/list' && !headers.isZucstomHeader) {
      headers.isZucstomHeader = 1
      fetch('https://api.toaddit.com/toadditbusiness/productService/productPrototype/list', {
        method: 'post',
        headers: headers,
        body: JSON.stringify({
          // orderItems: [{ asc: false, column: 'sort_number' }],
          page: {
            pageIndex: 1,
            pageSize: 0
          }
        })
      }).then(res => {
        return res.json()
      }).then(res => {
        debugger
      }).catch(err => {
        debugger
      })
    }

    // 添加到请求列表前端
    requests.unshift(requestInfo)

    // 限制请求数量，防止内存占用过大
    if (requests.length > maxRequests) {
      requests = requests.slice(0, maxRequests)
    }

    // 保存到本地存储
    chrome.storage.local.set({ requests: requests })
  },
  { urls: ["<all_urls>"] }, // 监听所有URL
  ["requestHeaders", "extraHeaders"] // 需要获取的信息
)

// 处理来自popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "GET_REQUESTS":
      sendResponse({ requests: requests })
      break
    case "CLEAR_REQUESTS":
      requests = []
      chrome.storage.local.set({ requests: [] })
      sendResponse({ success: true })
      break
    default:
      sendResponse({})
  }
})


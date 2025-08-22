// 监听请求发送事件，捕获请求头
chrome.webRequest.onSendHeaders.addListener(
  (details) => {
    // 构建请求信息对象
    const headers = details.requestHeaders.reduce((prev, cur) => {
      prev[cur.name] = cur.value
      return prev
    }, {})

    if (!headers.isZucstomHeader && details.method != 'OPTIONS') {
      headers.isZucstomHeader = 1
      fetch('http://localhost:3000/setHeaders', {
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          headers
        })
      }).then(res => {
        return res.json()
      })
    }
  },
  { urls: getMatchUrls(['userInfo', 'getUserInfo']) }, // 监听所有URL
  // { urls: ["<all_urls>"] }, // 监听所有URL
  ["requestHeaders", "extraHeaders"] // 需要获取的信息
)


function getMatchUrls(apiNameList) {
  const separatorCount = 8
  if (!Array.isArray(apiNameList)) apiNameList = [apiNameList]
  const tmpArr = []
  apiNameList.map(apiName => {
    const protocol = '*://'
    for (let i = 1; i <= separatorCount; i++) {
      const path = new Array(i).fill('*').join('/')
      tmpArr.push(`${protocol}${path}/${apiName}`)
    }
  })
  return tmpArr
}

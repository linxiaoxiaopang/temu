const { exec } = require('child_process');
const http = require('http');

// 存储原始代理设置，用于恢复
let originalProxySettings = null;
const PROXY_PORT = 9001;
const PROXY_HOST = '127.0.0.1';

// 设置Windows系统代理
function setSystemProxy(enable) {
  return new Promise((resolve, reject) => {
    if (enable) {
      // 先保存当前代理设置
      getCurrentProxySettings().then(originalSettings => {
        originalProxySettings = originalSettings;

        // 启用代理并设置为9001端口
        const command = `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 1 /f && ` +
          `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer /t REG_SZ /d "${PROXY_HOST}:${PROXY_PORT}" /f && ` +
          `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyOverride /t REG_SZ /d "<local>" /f`;

        exec(command, (error, stdout, stderr) => {
          if (error) {
            reject(`设置代理失败: ${error.message}`);
            return;
          }
          if (stderr) {
            reject(`错误: ${stderr}`);
            return;
          }
          // 通知系统代理设置已更改
          notifyProxyChange();
          resolve(`代理已启用，端口: ${PROXY_PORT}`);
        });
      }).catch(reject);
    } else {
      // 恢复原始代理设置
      if (!originalProxySettings) {
        resolve("没有需要恢复的代理设置");
        return;
      }

      let command = '';
      // 恢复代理启用状态
      command += `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d ${originalProxySettings.enabled ? 1 : 0} /f && `;

      // 恢复代理服务器设置
      if (originalProxySettings.server) {
        command += `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer /t REG_SZ /d "${originalProxySettings.server}" /f && `;
      } else {
        command += `reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer /f && `;
      }

      // 恢复代理例外设置
      if (originalProxySettings.override) {
        command += `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyOverride /t REG_SZ /d "${originalProxySettings.override}" /f`;
      } else {
        command += `reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyOverride /f`;
      }

      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(`恢复代理失败: ${error.message}`);
          return;
        }
        if (stderr) {
          reject(`错误: ${stderr}`);
          return;
        }
        // 通知系统代理设置已更改
        notifyProxyChange();
        resolve("代理已禁用，恢复原始设置");
      });
    }
  });
}

// 获取当前代理设置
function getCurrentProxySettings() {
  return new Promise((resolve, reject) => {
    const command = `reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /v ProxyServer /v ProxyOverride`;

    exec(command, (error, stdout, stderr) => {
      const settings = {
        enabled: false,
        server: '',
        override: ''
      };

      if (error && !stdout) {
        // 如果没有任何代理设置，返回默认值
        resolve(settings);
        return;
      }

      if (stderr) {
        reject(`获取代理设置错误: ${stderr}`);
        return;
      }

      // 解析注册表查询结果
      const lines = stdout.split('\n');
      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.includes('ProxyEnable')) {
          settings.enabled = trimmedLine.split(/\s+/).pop() === '0x1';
        } else if (trimmedLine.includes('ProxyServer')) {
          settings.server = trimmedLine.split(/\s+/).pop();
        } else if (trimmedLine.includes('ProxyOverride')) {
          settings.override = trimmedLine.split(/\s+/).pop();
        }
      });

      resolve(settings);
    });
  });
}

// 通知系统代理设置已更改
function notifyProxyChange() {
  // 发送WM_SETTINGCHANGE消息通知系统设置已更改
  const command = `powershell -Command "$signature = '[DllImport(\"user32.dll\")] public static extern bool SendMessageTimeoutA(IntPtr hWnd, uint Msg, UIntPtr wParam, string lParam, uint fuFlags, uint uTimeout, out UIntPtr lpdwResult);'; $type = Add-Type -MemberDefinition $signature -Name 'Win32SendMessageTimeout' -Namespace Win32Functions -PassThru; $result = [UIntPtr]::Zero; $type::SendMessageTimeoutA([IntPtr]::Zero, 0x001A, [UIntPtr]::Zero, 'Internet Settings', 2, 5000, [ref]$result)"`;
  exec(command, (error) => {
    if (error) {
      console.warn('通知系统代理更改失败，但设置已更新');
    }
  });
}

// 创建一个简单的HTTP服务器用于测试
function startTestServer() {
  const server = http.createServer((req, res) => {
    console.log(`收到请求: ${req.method} ${req.url}`);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('代理服务器运行中\n');
  });

  server.listen(PROXY_PORT, PROXY_HOST, () => {
    console.log(`测试服务器运行在 http://${PROXY_HOST}:${PROXY_PORT}`);
  });

  return server;
}

// 主函数
async function main() {
  // 处理程序退出，确保恢复代理设置
  process.on('SIGINT', async () => {
    console.log('\n正在关闭程序并恢复代理设置...');
    try {
      await setSystemProxy(false);
    } catch (err) {
      console.error('恢复代理设置时出错:', err);
    }
    process.exit();
  });

  // 启动测试服务器
  const server = startTestServer();

  // 启用代理
  try {
    const result = await setSystemProxy(true);
    console.log(result);
    console.log('按 Ctrl+C 关闭程序并恢复原始代理设置');
  } catch (err) {
    console.error('操作失败:', err);
    server.close();
    process.exit(1);
  }
}

module.exports = main


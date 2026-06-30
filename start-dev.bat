@echo off
chcp 65001 >nul
setlocal

set "ROOT=%~dp0"
set "SERVER_DIR=%ROOT%server"
set "FRONTEND_PORT=5500"

title 原题真解 Pro - 一键启动

echo.
echo ============================================
echo  原题真解 Pro - 本地开发一键启动
echo ============================================
echo.

if not exist "%SERVER_DIR%\package.json" (
  echo [错误] 未找到 server\package.json，请确认脚本放在项目根目录。
  echo 项目根目录应为：C:\Users\admins\Desktop\math-website
  pause
  exit /b 1
)

if not exist "%SERVER_DIR%\.env" (
  echo [提醒] 未找到 server\.env。
  echo 如果需要真实 AI、数据库和登录功能，请先根据 server\.env.example 配置 server\.env。
  echo.
)

if not exist "%SERVER_DIR%\node_modules" (
  echo [首次启动] 正在安装后端依赖，这一步只使用 server\package.json 中已有依赖。
  pushd "%SERVER_DIR%"
  call npm.cmd install
  if errorlevel 1 (
    echo [错误] 后端依赖安装失败，请检查 Node.js 和 npm 是否可用。
    popd
    pause
    exit /b 1
  )
  popd
)

echo [1/3] 启动后端 API：http://localhost:3001
start "原题真解 Pro 后端 API" /D "%SERVER_DIR%" cmd /k "npm.cmd start"

echo [2/3] 启动前端静态页面：http://localhost:%FRONTEND_PORT%
where py >nul 2>nul
if %errorlevel%==0 (
  start "原题真解 Pro 前端页面" /D "%ROOT%" cmd /k "py -3 -m http.server %FRONTEND_PORT%"
  goto OPEN_BROWSER
)

where python >nul 2>nul
if %errorlevel%==0 (
  start "原题真解 Pro 前端页面" /D "%ROOT%" cmd /k "python -m http.server %FRONTEND_PORT%"
  goto OPEN_BROWSER
)

echo [提醒] 没检测到 Python，无法自动启动 http://localhost:%FRONTEND_PORT%。
echo 将改为直接打开 index.html。真实 AI 接口仍依赖后端窗口正常运行。
start "" "%ROOT%index.html"
goto DONE

:OPEN_BROWSER
timeout /t 3 >nul
echo [3/3] 打开浏览器
start "" "http://localhost:%FRONTEND_PORT%"

:DONE
echo.
echo 已启动。请保留弹出的后端窗口；关闭窗口即停止服务。
echo 如果页面显示旧效果，请在浏览器按 Ctrl + F5 强制刷新。
echo.
pause

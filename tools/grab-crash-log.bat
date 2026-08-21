@echo off
REM Eagle 闪退日志抓取脚本 (Windows)
REM 用法: 手机开 USB 调试并连接电脑, 双击本文件
setlocal
where adb >nul 2>nul
if errorlevel 1 (
  echo 错误: 未找到 adb。请下载 platform-tools 并把解压目录加入 PATH:
  echo   https://developer.android.com/tools/releases/platform-tools
  pause
  exit /b 1
)

echo == 设备列表 ==
adb devices

echo == 清空日志缓冲 ==
adb logcat -c

echo == 正在启动 Eagle (请等待手机上闪退完成) ==
adb shell am start -n org.eagle.livetv/.MainActivity 2>nul
if errorlevel 1 adb shell monkey -p org.eagle.livetv -c android.intent.category.LAUNCHER 1

echo 等待 8 秒让闪退发生...
timeout /t 8 /nobreak >nul

echo == FATAL / AndroidRuntime / Eagle 相关日志 ==
adb logcat -d 2>nul | findstr /i "FATAL AndroidRuntime eagle reactnative hermes sentry"

echo.
echo == 完整最近崩溃堆栈 ==
adb logcat -d -b crash 2>nul

echo.
echo 完。把以上全部输出复制发给助手即可。
pause

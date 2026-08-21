#!/usr/bin/env bash
# Eagle 闪退日志抓取脚本 — 一键运行
# 用法: 手机开 USB 调试并连接电脑, 然后运行本脚本
set -u
ADB="${ADB:-adb}"
command -v "$ADB" >/dev/null 2>&1 || { echo "错误: 未找到 adb。请安装 platform-tools 并加入 PATH,或设置 ADB=/path/to/adb"; exit 1; }

echo "== 设备列表 =="
"$ADB" devices

echo -e "\n== 清空日志缓冲 =="
"$ADB" logcat -c

echo "== 正在启动 Eagle (请等待手机上闪退完成) =="
"$ADB" shell am start -n org.eagle.livetv/.MainActivity 2>/dev/null || \
  "$ADB" shell monkey -p org.eagle.livetv -c android.intent.category.LAUNCHER 1

echo "等待 8 秒让闪退发生..."
sleep 8

echo -e "\n== FATAL / AndroidRuntime / Eagle 相关日志 =="
"$ADB" logcat -d 2>/dev/null | grep -iE "FATAL|AndroidRuntime|eagle|reactnative|hermes|sentry" | tail -80

echo -e "\n== 完整最近崩溃堆栈 =="
"$ADB" logcat -d -b crash 2>/dev/null | tail -60

echo -e "\n完。把以上全部输出复制发给助手即可。"

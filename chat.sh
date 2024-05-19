#!/bin/bash

# 定义清理并退出函数
cleanup_exit() {
    # 停止 pnpm dev 进程
    pkill -f "pnpm"
    pkill -f "mongod"
    echo "pnpm dev 进程已停止。"
    exit
}

# 捕获退出信号
trap cleanup_exit EXIT

# 加载 bash 配置文件
source ~/.bash_profile

# 切换到项目目录
cd ~/Desktop/chatgpt-web-main

# 启动 MongoDB
mongod --dbpath ~/Desktop/chatgpt-web-main/data/db &
MONGOD_PID=$!
echo "MongoDB 启动，进程 ID 为 $MONGOD_PID"
# 在主目录中启动 pnpm dev
# 在 service 目录中启动 pnpm dev
cd ~/Desktop/chatgpt-web-main/service && /usr/local/bin/pnpm dev &
PNPM_SERVICE_DEV_PID=$!
echo "service 中的 pnpm dev 启动，进程 ID 为 $PNPM_SERVICE_DEV_PID"
echo "所有进程已启动。"

cd ~/Desktop/chatgpt-web-main && /usr/local/bin/pnpm dev &
PNPM_DEV_PID=$!
echo "pnpm dev 启动，进程 ID 为 $PNPM_DEV_PID"
# 保持脚本运行，直到手动退出
echo "脚本正在运行。按 Ctrl+C 退出。"
while true; do
    sleep 1
done

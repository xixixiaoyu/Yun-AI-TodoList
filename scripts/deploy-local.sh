#!/bin/bash

# 本地 Cloudflare 部署脚本
# 简化版本，适合本地快速部署

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 开始本地 Cloudflare 部署...${NC}"

# 检查 wrangler 是否安装
if ! command -v wrangler &> /dev/null; then
    echo -e "${YELLOW}⚠️  Wrangler CLI 未安装${NC}"
    echo "💡 安装方法: npm install -g wrangler"
    exit 1
fi

# 获取当前分支
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "${BLUE}📍 当前分支: $CURRENT_BRANCH${NC}"

# 构建项目
echo -e "${BLUE}🏗️  构建项目...${NC}"
pnpm build:shared
pnpm build:frontend

# 根据分支选择部署环境
if [ "$CURRENT_BRANCH" = "main" ]; then
    echo -e "${BLUE}📦 部署到生产环境...${NC}"
    pnpm wrangler deploy --env production
    echo -e "${GREEN}✅ 已部署到生产环境！${NC}"
elif [ "$CURRENT_BRANCH" = "develop" ]; then
    echo -e "${BLUE}📦 部署到开发环境...${NC}"
    pnpm wrangler deploy --env development
    echo -e "${GREEN}✅ 已部署到开发环境！${NC}"
else
    echo -e "${YELLOW}⚠️  当前分支 ($CURRENT_BRANCH) 将部署到开发环境${NC}"
    pnpm wrangler deploy --env development
    echo -e "${GREEN}✅ 已部署到开发环境！${NC}"
fi

echo -e "${GREEN}🎉 Cloudflare 部署完成！${NC}"

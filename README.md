# szhAo Cloud Storage

个人云盘后端服务 - Copyright © szhAo

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

项目支持两个环境配置：

| 环境        | 配置文件             | 说明         |
| ----------- | -------------------- | ------------ |
| development | `.env.development` | 本地开发环境 |
| production  | `.env.production`  | 生产环境     |

**配置项说明：**

```env
# 数据库配置
DB_HOST=localhost          # MySQL主机
DB_PORT=3306              # MySQL端口
DB_NAME=cloud_storage     # 数据库名
DB_USER=root              # 用户名
DB_PASSWORD= # 密码

# Redis配置
REDIS_HOST=localhost      # Redis主机
REDIS_PORT=6379          # Redis端口
REDIS_PASSWORD= # Redis密码
REDIS_DB=0               # 数据库编号

# JWT配置
JWT_SECRET=your_secret_key  # JWT密钥（生产环境必须修改）
```

### 3. 初始化数据库

```bash
# 开发环境
npm run db:generate
npm run db:push

# 生产环境
npm run db:push:prod
```

### 4. 创建默认管理员账号

```bash
# 开发环境
npm run init:admin

# 生产环境
npm run init:admin:prod
```

### 5. 启动服务

```bash
# 本地开发环境（默认）
npm run dev

# 生产环境
npm run prod
```

## 环境配置详情

### 开发环境

- MySQL: localhost:3306
- Redis: localhost:6379
- 日志级别: debug

### 生产环境

- MySQL: 127.0.0.1:3306
- Redis: 39.102.48.146:6379
- 日志级别: warn

## API接口

### 认证接口

- `POST /api/v1/auth/login` - 用户登录

### 用户管理接口

- `GET /api/v1/users/me` - 获取当前用户信息
- `POST /api/v1/users` - 管理员创建用户
- `GET /api/v1/users` - 管理员获取用户列表
- `PATCH /api/v1/users/:user_id` - 管理员更新用户信息
- `DELETE /api/v1/users/:user_id` - 管理员删除用户

### 文件接口

- `POST /api/v1/files/upload` - 上传文件
- `POST /api/v1/files/instant-check` - 秒传检查
- `GET /api/v1/files/download/:file_id` - 下载文件
- `GET /api/v1/files/:file_id` - 获取文件信息
- `GET /api/v1/files` - 获取文件列表
- `PATCH /api/v1/files/:file_id/visibility` - 更新文件可见性
- `DELETE /api/v1/files/:file_id` - 删除文件

### 分享接口

- `POST /api/v1/shares` - 创建分享链接
- `GET /api/v1/shares/:share_code` - 获取分享信息
- `POST /api/v1/shares/:share_code/verify` - 验证分享密码
- `GET /api/v1/shares/:share_code/download` - 下载分享文件
- `GET /api/v1/shares` - 获取分享列表
- `DELETE /api/v1/shares/:share_id` - 取消分享

### 统计接口

- `GET /api/v1/stats/storage` - 获取存储统计

## 默认管理员账号

- 用户名：`admin`
- 密码：`admin123`

**⚠️ 首次登录后请立即修改默认密码！**

## 技术栈

- Node.js 18+
- Koa2
- MySQL 8.0+
- Redis 7.0+
- Prisma

## 版权信息

Copyright © szhAo. All rights reserved.

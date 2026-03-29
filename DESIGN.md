# 个人云盘后端服务设计文档

## 项目概述

### 1.1 项目简介

基于Node.js开发的个人云盘后端服务，提供文件存储、分享、下载等功能，支持高并发、高性能的文件传输。

### 1.2 核心功能

- 文件上传（支持分片、秒传、断点续传）
- 文件下载（支持Range请求、多线程下载）
- 文件可见性控制（私密/公开）
- 时效性分享链接（支持访问密码、下载次数限制）
- 用户存储配额管理
- 文件去重
- 管理员用户管理（创建、修改、删除用户）
- 默认管理员账号初始化

### 1.3 版权信息

所有接口响应均包含版权签名：
- 版权所有者：szhAo
- 版本：1.0.0

---

## 技术架构

### 2.1 技术栈

| 层级 | 技术选型 | 版本 | 说明 |
|------|---------|------|------|
| 运行时 | Node.js | 18+ | 支持原生ESM、更好的性能 |
| Web框架 | Koa2 | 2.x | 轻量级、中间件机制优雅 |
| 数据库 | MySQL | 8.0+ | 存储元数据 |
| 缓存 | Redis | 7.0+ | 会话、缓存、限流 |
| ORM | Prisma | 5.x | 类型安全的ORM |
| 认证 | JWT | - | 无状态认证 |
| 文件上传 | multer | - | 处理multipart/form-data |
| 密码加密 | bcrypt | - | 密码哈希 |
| 文件校验 | crypto | - | SHA256文件哈希 |

### 2.2 项目目录结构

```
个人云盘/
├── src/
│   ├── config/                 # 配置文件
│   │   ├── index.js           # 主配置
│   │   ├── database.js        # 数据库配置
│   │   └── storage.js         # 存储配置
│   ├── controllers/            # 控制器
│   │   ├── fileController.js  # 文件操作
│   │   ├── shareController.js # 分享管理
│   │   └── userController.js  # 用户管理
│   ├── models/                 # 数据模型
│   │   ├── User.js
│   │   ├── File.js
│   │   └── Share.js
│   ├── routes/                 # 路由定义
│   │   ├── index.js
│   │   ├── file.js
│   │   └── share.js
│   ├── middlewares/            # 中间件
│   │   ├── auth.js            # 认证中间件
│   │   ├── signature.js       # 签名响应中间件
│   │   ├── rateLimit.js       # 限流
│   │   ├── errorHandler.js    # 错误处理
│   │   └── fileAccess.js      # 文件访问控制
│   ├── services/               # 业务逻辑
│   │   ├── fileService.js
│   │   ├── shareService.js
│   │   ├── storageService.js
│   │   └── cacheService.js
│   ├── utils/                  # 工具函数
│   │   ├── response.js        # 统一响应封装
│   │   ├── crypto.js          # 加密工具
│   │   ├── stream.js          # 流处理工具
│   │   └── validator.js       # 数据验证
│   └── app.js                  # 应用入口
├── uploads/                    # 文件存储目录
│   ├── private/               # 私密文件
│   │   └── {user_id}/
│   │       └── {year}/{month}/{day}/
│   └── public/                # 公开文件
│       └── {user_id}/
│           └── {year}/{month}/{day}/
├── temp/                       # 临时文件(分片上传)
│   └── {upload_id}/
├── prisma/
│   └── schema.prisma          # 数据库模型
├── logs/                       # 日志目录
├── package.json
├── .env                        # 环境变量
└── README.md
```

---

## 数据库设计

### 3.1 用户表 (users)

```sql
CREATE TABLE users (
    id              VARCHAR(36) PRIMARY KEY COMMENT '用户ID (UUID)',
    username        VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password_hash   VARCHAR(255) NOT NULL COMMENT '密码哈希 (bcrypt)',
    email           VARCHAR(100) UNIQUE COMMENT '邮箱',
    role            TINYINT DEFAULT 0 COMMENT '角色: 0-普通用户 1-管理员',
    storage_quota   BIGINT DEFAULT 10737418240 COMMENT '存储配额(默认10GB)',
    storage_used    BIGINT DEFAULT 0 COMMENT '已用空间(字节)',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    status          TINYINT DEFAULT 1 COMMENT '状态: 1-正常 0-禁用',
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
```

**说明：**
- `role` 字段：0-普通用户，1-管理员
- 默认创建一个管理员账号（通过初始化脚本）
- 只有管理员可以创建新用户账号
- 不提供公开注册接口

### 3.2 文件表 (files)

```sql
CREATE TABLE files (
    id              VARCHAR(36) PRIMARY KEY COMMENT '文件ID (UUID)',
    user_id         VARCHAR(36) NOT NULL COMMENT '所属用户ID',
    filename        VARCHAR(255) NOT NULL COMMENT '存储文件名',
    original_name   VARCHAR(255) NOT NULL COMMENT '原始文件名',
    file_path       VARCHAR(500) NOT NULL COMMENT '物理存储路径',
    file_size       BIGINT NOT NULL COMMENT '文件大小(字节)',
    mime_type       VARCHAR(100) COMMENT 'MIME类型',
    file_hash       VARCHAR(64) COMMENT 'SHA256文件哈希',
    visibility      TINYINT DEFAULT 0 COMMENT '可见性: 0-私密 1-公开',
    download_count  INT DEFAULT 0 COMMENT '下载次数',
    is_deleted      TINYINT DEFAULT 0 COMMENT '是否删除: 0-否 1-是',
    deleted_at      TIMESTAMP NULL COMMENT '删除时间',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_file_hash (file_hash),
    INDEX idx_visibility (visibility),
    INDEX idx_created_at (created_at DESC),
    INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文件表';
```

### 3.3 分享表 (shares)

```sql
CREATE TABLE shares (
    id              VARCHAR(36) PRIMARY KEY COMMENT '分享ID (UUID)',
    file_id         VARCHAR(36) NOT NULL COMMENT '文件ID',
    user_id         VARCHAR(36) NOT NULL COMMENT '创建者ID',
    share_code      VARCHAR(16) UNIQUE NOT NULL COMMENT '分享短码',
    access_password VARCHAR(255) COMMENT '访问密码(加密存储)',
    expire_at       TIMESTAMP NULL COMMENT '过期时间(NULL表示永久)',
    max_downloads   INT DEFAULT -1 COMMENT '最大下载次数(-1无限制)',
    download_count  INT DEFAULT 0 COMMENT '已下载次数',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_share_code (share_code),
    INDEX idx_expire_at (expire_at),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分享表';
```

### 3.4 下载记录表 (download_logs)

```sql
CREATE TABLE download_logs (
    id              VARCHAR(36) PRIMARY KEY COMMENT '记录ID (UUID)',
    file_id         VARCHAR(36) NOT NULL COMMENT '文件ID',
    user_id         VARCHAR(36) NULL COMMENT '下载用户ID(NULL表示匿名)',
    share_id        VARCHAR(36) NULL COMMENT '分享ID',
    ip_address      VARCHAR(45) COMMENT 'IP地址',
    user_agent      VARCHAR(500) COMMENT '用户代理',
    download_size   BIGINT COMMENT '下载大小(字节)',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '下载时间',
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (share_id) REFERENCES shares(id) ON DELETE SET NULL,
    INDEX idx_file_id (file_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='下载记录表';
```

---

## API接口设计

### 4.1 统一响应格式

所有接口返回数据均包含版权签名：

```json
{
    "code": 200,
    "message": "success",
    "data": {},
    "timestamp": 1709234567890,
    "signature": {
        "copyright": "szhAo",
        "version": "1.0.0",
        "powered": "szhAo Cloud Storage"
    }
}
```

### 4.2 状态码定义

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 410 | 资源已过期 |
| 413 | 文件过大 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

### 4.3 用户管理接口

#### 4.3.1 用户登录

```
POST /api/v1/auth/login

请求体:
{
    "username": "admin",
    "password": "admin123"
}

响应:
{
    "code": 200,
    "message": "登录成功",
    "data": {
        "token": "jwt_token",
        "refresh_token": "refresh_token",
        "expires_in": 7200,
        "user": {
            "user_id": "uuid",
            "username": "admin",
            "role": 1,
            "email": "admin@example.com"
        }
    }
}
```

#### 4.3.2 获取用户信息

```
GET /api/v1/users/me
Authorization: Bearer <token>

响应:
{
    "code": 200,
    "data": {
        "user_id": "uuid",
        "username": "admin",
        "email": "admin@example.com",
        "role": 1,
        "storage_quota": 10737418240,
        "storage_used": 524288000,
        "used_percent": 4.88
    }
}
```

#### 4.3.3 管理员创建用户

```
POST /api/v1/users
Authorization: Bearer <token> (需要管理员权限)

请求体:
{
    "username": "newuser",
    "password": "password123",
    "email": "newuser@example.com",
    "storage_quota": 10737418240
}

响应:
{
    "code": 201,
    "message": "用户创建成功",
    "data": {
        "user_id": "uuid",
        "username": "newuser",
        "email": "newuser@example.com",
        "role": 0,
        "storage_quota": 10737418240,
        "storage_used": 0
    }
}
```

#### 4.3.4 管理员获取用户列表

```
GET /api/v1/users
Authorization: Bearer <token> (需要管理员权限)

查询参数:
- page: 页码 (默认1)
- limit: 每页数量 (默认20)
- role: 筛选角色 (0-普通用户 1-管理员)

响应:
{
    "code": 200,
    "data": {
        "users": [
            {
                "user_id": "uuid",
                "username": "admin",
                "email": "admin@example.com",
                "role": 1,
                "storage_quota": 10737418240,
                "storage_used": 524288000,
                "status": 1,
                "created_at": "2024-03-01T10:00:00Z"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 2,
            "total_pages": 1
        }
    }
}
```

#### 4.3.5 管理员更新用户信息

```
PATCH /api/v1/users/:user_id
Authorization: Bearer <token> (需要管理员权限)

请求体:
{
    "password": "newpassword",
    "email": "updated@example.com",
    "storage_quota": 21474836480,
    "status": 1
}

响应:
{
    "code": 200,
    "message": "用户信息已更新",
    "data": {
        "user_id": "uuid",
        "username": "newuser",
        "email": "updated@example.com",
        "storage_quota": 21474836480,
        "status": 1
    }
}
```

#### 4.3.6 管理员删除用户

```
DELETE /api/v1/users/:user_id
Authorization: Bearer <token> (需要管理员权限)

响应:
{
    "code": 200,
    "message": "用户已删除"
}
```

#### 4.3.7 初始化默认管理员账号

系统启动时自动创建默认管理员账号（如果不存在）：

```javascript
// 默认管理员配置
const DEFAULT_ADMIN = {
    username: 'admin',
    password: 'admin123',
    email: 'admin@szhao.cloud',
    role: 1,
    storage_quota: 107374182400  // 100GB
};
```

**注意：**
- 首次部署后请立即修改默认管理员密码
- 不提供公开注册接口
- 只有管理员可以创建、修改、删除用户

### 4.4 文件上传接口

#### 4.4.1 普通文件上传

```
POST /api/v1/files/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

请求参数:
- file: 文件二进制数据 (必填)
- visibility: 0|1 (可选，默认0-私密)
- instant_upload: true|false (可选，是否启用秒传)

响应:
{
    "code": 200,
    "message": "上传成功",
    "data": {
        "file_id": "uuid",
        "filename": "document.pdf",
        "original_name": "document.pdf",
        "file_size": 1024000,
        "mime_type": "application/pdf",
        "visibility": 0,
        "file_hash": "sha256_hash",
        "upload_time": "2024-03-01T10:00:00Z",
        "is_instant": false
    }
}
```

#### 4.4.2 秒传检查

```
POST /api/v1/files/instant-check
Authorization: Bearer <token>

请求体:
{
    "filename": "document.pdf",
    "file_size": 1024000,
    "file_hash": "sha256_hash"
}

响应 (文件已存在):
{
    "code": 200,
    "message": "文件已存在，可秒传",
    "data": {
        "exists": true,
        "file_id": "uuid",
        "filename": "document.pdf"
    }
}

响应 (文件不存在):
{
    "code": 200,
    "message": "文件不存在，需上传",
    "data": {
        "exists": false
    }
}
```

#### 4.4.3 初始化分片上传

```
POST /api/v1/files/upload/init
Authorization: Bearer <token>

请求体:
{
    "filename": "large_video.mp4",
    "file_size": 1073741824,
    "file_hash": "sha256_hash",
    "visibility": 0,
    "chunk_size": 5242880
}

响应:
{
    "code": 200,
    "message": "分片上传初始化成功",
    "data": {
        "upload_id": "upload_uuid",
        "chunk_size": 5242880,
        "total_chunks": 205,
        "chunks": [0, 1, 2, ..., 204]
    }
}
```

#### 4.4.4 上传分片

```
POST /api/v1/files/upload/chunk
Content-Type: multipart/form-data
Authorization: Bearer <token>

请求参数:
- upload_id: 上传任务ID (必填)
- chunk_index: 分片序号 (必填)
- chunk_data: 分片数据 (必填)
- chunk_hash: 分片哈希 (可选，用于校验)

响应:
{
    "code": 200,
    "message": "分片上传成功",
    "data": {
        "upload_id": "upload_uuid",
        "chunk_index": 0,
        "uploaded_chunks": [0, 1, 2],
        "remaining_chunks": [3, 4, 5, ...]
    }
}
```

#### 4.4.5 完成分片上传

```
POST /api/v1/files/upload/complete
Authorization: Bearer <token>

请求体:
{
    "upload_id": "upload_uuid",
    "chunks": [0, 1, 2, ..., 204]
}

响应:
{
    "code": 200,
    "message": "文件上传完成",
    "data": {
        "file_id": "uuid",
        "filename": "large_video.mp4",
        "file_size": 1073741824,
        "file_hash": "sha256_hash",
        "upload_time": "2024-03-01T10:00:00Z"
    }
}
```

#### 4.4.6 取消分片上传

```
DELETE /api/v1/files/upload/:upload_id
Authorization: Bearer <token>

响应:
{
    "code": 200,
    "message": "上传已取消"
}
```

### 4.5 文件下载接口

#### 4.5.1 下载文件

```
GET /api/v1/files/download/:file_id
Authorization: Bearer <token>

支持 Range 请求头:
Range: bytes=0-1023

响应头:
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="example.pdf"
Content-Length: 1024000
Accept-Ranges: bytes
Content-Range: bytes 0-1023/1024000 (当使用Range时)

响应体: 文件二进制流
```

#### 4.5.2 获取文件信息

```
GET /api/v1/files/:file_id
Authorization: Bearer <token>

响应:
{
    "code": 200,
    "data": {
        "file_id": "uuid",
        "filename": "document.pdf",
        "original_name": "document.pdf",
        "file_size": 1024000,
        "mime_type": "application/pdf",
        "file_hash": "sha256_hash",
        "visibility": 0,
        "download_count": 5,
        "created_at": "2024-03-01T10:00:00Z"
    }
}
```

#### 4.5.3 文件列表

```
GET /api/v1/files
Authorization: Bearer <token>

查询参数:
- page: 页码 (默认1)
- limit: 每页数量 (默认20，最大100)
- visibility: 筛选可见性 (0-私密 1-公开)
- keyword: 搜索关键词
- sort_by: 排序字段 (created_at, file_size, download_count)
- order: asc|desc (默认desc)

响应:
{
    "code": 200,
    "data": {
        "files": [
            {
                "file_id": "uuid",
                "filename": "document.pdf",
                "original_name": "document.pdf",
                "file_size": 1024000,
                "mime_type": "application/pdf",
                "visibility": 0,
                "download_count": 5,
                "created_at": "2024-03-01T10:00:00Z"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 100,
            "total_pages": 5
        }
    }
}
```

#### 4.5.4 更新文件可见性

```
PATCH /api/v1/files/:file_id/visibility
Authorization: Bearer <token>

请求体:
{
    "visibility": 1
}

响应:
{
    "code": 200,
    "message": "可见性已更新",
    "data": {
        "file_id": "uuid",
        "visibility": 1
    }
}
```

#### 4.5.5 删除文件

```
DELETE /api/v1/files/:file_id
Authorization: Bearer <token>

响应:
{
    "code": 200,
    "message": "文件已删除"
}
```

### 4.6 分享接口

#### 4.6.1 创建分享链接

```
POST /api/v1/shares
Authorization: Bearer <token>

请求体:
{
    "file_id": "uuid",
    "expire_hours": 24,
    "max_downloads": 10,
    "password": "123456"
}

响应:
{
    "code": 200,
    "message": "分享创建成功",
    "data": {
        "share_id": "uuid",
        "share_code": "Ab3Kx9",
        "share_url": "https://cloud.example.com/s/Ab3Kx9",
        "expire_at": "2024-03-02T10:00:00Z",
        "max_downloads": 10,
        "has_password": true
    }
}
```

#### 4.6.2 获取分享信息

```
GET /api/v1/shares/:share_code

响应:
{
    "code": 200,
    "data": {
        "share_code": "Ab3Kx9",
        "filename": "document.pdf",
        "file_size": 1024000,
        "mime_type": "application/pdf",
        "expire_at": "2024-03-02T10:00:00Z",
        "max_downloads": 10,
        "download_count": 2,
        "remaining_downloads": 8,
        "has_password": true,
        "created_at": "2024-03-01T10:00:00Z"
    }
}
```

#### 4.6.3 验证分享密码

```
POST /api/v1/shares/:share_code/verify

请求体:
{
    "password": "123456"
}

响应:
{
    "code": 200,
    "message": "密码验证成功",
    "data": {
        "valid": true,
        "token": "share_token"
    }
}
```

#### 4.6.4 下载分享文件

```
GET /api/v1/shares/:share_code/download

查询参数:
- token: 分享令牌 (如果有密码)

支持 Range 请求头

响应头:
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="document.pdf"
Content-Length: 1024000
Accept-Ranges: bytes

响应体: 文件二进制流
```

#### 4.6.5 获取用户的分享列表

```
GET /api/v1/shares
Authorization: Bearer <token>

查询参数:
- page: 页码
- limit: 每页数量
- status: active|expired

响应:
{
    "code": 200,
    "data": {
        "shares": [
            {
                "share_id": "uuid",
                "share_code": "Ab3Kx9",
                "share_url": "https://cloud.example.com/s/Ab3Kx9",
                "filename": "document.pdf",
                "file_size": 1024000,
                "expire_at": "2024-03-02T10:00:00Z",
                "max_downloads": 10,
                "download_count": 2,
                "has_password": true,
                "created_at": "2024-03-01T10:00:00Z"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 10,
            "total_pages": 1
        }
    }
}
```

#### 4.6.6 取消分享

```
DELETE /api/v1/shares/:share_id
Authorization: Bearer <token>

响应:
{
    "code": 200,
    "message": "分享已取消"
}
```

### 4.7 统计接口

#### 4.7.1 获取存储统计

```
GET /api/v1/stats/storage
Authorization: Bearer <token>

响应:
{
    "code": 200,
    "data": {
        "total_files": 150,
        "total_size": 1073741824,
        "quota": 10737418240,
        "used": 1073741824,
        "available": 9663676416,
        "used_percent": 10,
        "by_type": {
            "image": {
                "count": 50,
                "size": 524288000
            },
            "video": {
                "count": 10,
                "size": 429496729
            },
            "document": {
                "count": 90,
                "size": 119808095
            }
        }
    }
}
```

---

## 存储策略

### 5.1 目录结构

```
uploads/
├── private/                          # 私密文件
│   └── {user_id}/
│       └── {year}/
│           └── {month}/
│               └── {day}/
│                   └── {file_hash}.dat
├── public/                           # 公开文件
│   └── {user_id}/
│       └── {year}/{month}/{day}/
│           └── {file_hash}.dat
└── temp/                             # 临时文件(分片上传)
    └── {upload_id}/
        ├── chunk_0
        ├── chunk_1
        ├── ...
        └── meta.json
```

### 5.2 文件命名规则

- 存储文件名：使用SHA256哈希值 + `.dat` 后缀
- 避免文件名冲突和特殊字符问题
- 支持文件去重

### 5.3 文件去重策略

```javascript
// 基于文件内容的SHA256哈希去重
// 相同内容的文件只存储一份，数据库记录引用

1. 上传前计算文件SHA256哈希
2. 查询数据库是否存在相同哈希的文件
3. 如果存在，创建新的文件记录，指向同一物理文件（秒传）
4. 如果不存在，正常上传并存储
```

### 5.4 分片上传配置

```javascript
const CHUNK_CONFIG = {
    chunkSize: 5 * 1024 * 1024,        // 5MB每片
    maxConcurrentChunks: 3,            // 最大并发分片数
    retryAttempts: 3,                   // 重试次数
    chunkTimeout: 30000,                // 分片超时时间(30秒)
    tempRetention: 86400               // 临时文件保留时间(24小时)
};
```

---

## 安全机制

### 6.1 认证与授权

#### 6.1.1 JWT配置

```javascript
const JWT_CONFIG = {
    secret: process.env.JWT_SECRET,
    accessTokenExpiry: '2h',
    refreshTokenExpiry: '7d',
    algorithm: 'HS256'
};
```

#### 6.1.2 Token结构

```javascript
{
    "user_id": "uuid",
    "username": "admin",
    "role": 1,
    "iat": 1709234567,
    "exp": 1709241767
}
```

#### 6.1.3 认证流程

```
1. 用户登录，验证用户名密码
2. 生成JWT Access Token (2小时有效)
3. 生成Refresh Token (7天有效)
4. 返回Token给客户端
5. 客户端请求时携带Access Token
6. Token过期后使用Refresh Token刷新
```

#### 6.1.4 管理员权限验证

```javascript
async function requireAdmin(ctx, next) {
    const user = ctx.state.user;
    
    if (!user || user.role !== 1) {
        throw new ForbiddenError('需要管理员权限');
    }
    
    await next();
}
```

**权限说明：**
- 普通用户（role=0）：只能访问自己的文件和分享
- 管理员（role=1）：可以创建、修改、删除用户，管理所有用户数据

### 6.2 文件访问控制

#### 6.2.1 权限检查逻辑

```javascript
async function checkFileAccess(fileId, userId) {
    const file = await FileModel.findById(fileId);
    
    if (!file) {
        throw new NotFoundError('文件不存在');
    }
    
    if (file.visibility === 1) {
        return file;
    }
    
    if (file.userId !== userId) {
        throw new ForbiddenError('无权访问此文件');
    }
    
    return file;
}
```

### 6.3 分享链接安全

#### 6.3.1 分享码生成

```javascript
function generateShareCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
```

#### 6.3.2 分享验证

```javascript
async function validateShare(shareCode, password = null) {
    const share = await ShareModel.findByCode(shareCode);
    
    if (!share) {
        throw new NotFoundError('分享链接不存在');
    }
    
    if (share.expireAt && new Date() > share.expireAt) {
        throw new GoneError('分享链接已过期');
    }
    
    if (share.maxDownloads > 0 && share.downloadCount >= share.maxDownloads) {
        throw new GoneError('下载次数已用尽');
    }
    
    if (share.accessPassword) {
        if (!password) {
            throw new BadRequestError('需要访问密码');
        }
        const isValid = await bcrypt.compare(password, share.accessPassword);
        if (!isValid) {
            throw new UnauthorizedError('访问密码错误');
        }
    }
    
    return share;
}
```

### 6.4 上传安全限制

```javascript
const UPLOAD_LIMITS = {
    maxFileSize: 5 * 1024 * 1024 * 1024,    // 单文件最大5GB
    maxRequestSize: 10 * 1024 * 1024 * 1024, // 请求最大10GB
    allowedMimeTypes: [
        'image/*',
        'video/*',
        'audio/*',
        'application/pdf',
        'application/zip',
        'application/x-rar-compressed',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/*'
    ],
    blockedExtensions: [
        '.exe', '.bat', '.cmd', '.sh', '.ps1',
        '.php', '.asp', '.aspx', '.jsp', '.js'
    ]
};
```

### 6.5 速率限制

```javascript
const RATE_LIMITS = {
    api: {
        windowMs: 60 * 1000,
        max: 100
    },
    upload: {
        windowMs: 60 * 60 * 1000,
        max: 50
    },
    download: {
        windowMs: 60 * 1000,
        max: 30
    },
    auth: {
        windowMs: 15 * 60 * 1000,
        max: 5
    }
};
```

---

## 性能优化

### 7.1 高速下载实现

#### 7.1.1 流式下载

```javascript
const fs = require('fs');

async function downloadFile(ctx, fileId) {
    const file = await FileModel.findById(fileId);
    const filePath = file.filePath;
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    
    const range = ctx.headers.range;
    
    if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;
        
        ctx.status = 206;
        ctx.set({
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': file.mimeType || 'application/octet-stream',
            'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`
        });
        
        ctx.body = fs.createReadStream(filePath, { start, end });
    } else {
        ctx.set({
            'Content-Length': fileSize,
            'Content-Type': file.mimeType || 'application/octet-stream',
            'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
            'Accept-Ranges': 'bytes'
        });
        
        ctx.body = fs.createReadStream(filePath);
    }
}
```

#### 7.1.2 下载优化配置

```javascript
const DOWNLOAD_CONFIG = {
    compression: true,
    cacheControl: {
        public: 'public, max-age=31536000',
        private: 'private, max-age=3600'
    },
    optimalChunkSize: 1024 * 1024,
    highWaterMark: 64 * 1024
};
```

### 7.2 缓存策略

#### 7.2.1 Redis缓存

```javascript
const CacheService = {
    async getFileMeta(fileId) {
        const cached = await redis.get(`file:meta:${fileId}`);
        if (cached) return JSON.parse(cached);
        
        const file = await FileModel.findById(fileId);
        await redis.setex(`file:meta:${fileId}`, 3600, JSON.stringify(file));
        return file;
    },
    
    async getShareInfo(shareCode) {
        const cached = await redis.get(`share:${shareCode}`);
        if (cached) return JSON.parse(cached);
        
        const share = await ShareModel.findByCode(shareCode);
        await redis.setex(`share:${shareCode}`, 300, JSON.stringify(share));
        return share;
    },
    
    async getUserQuota(userId) {
        const cached = await redis.get(`user:quota:${userId}`);
        if (cached) return JSON.parse(cached);
        
        const quota = await UserModel.getQuota(userId);
        await redis.setex(`user:quota:${userId}`, 60, JSON.stringify(quota));
        return quota;
    }
};
```

#### 7.2.2 缓存过期策略

| 数据类型 | 过期时间 | 说明 |
|---------|---------|------|
| 文件元数据 | 1小时 | 频繁访问的数据 |
| 分享信息 | 5分钟 | 需要及时更新的数据 |
| 用户配额 | 1分钟 | 频繁变化的数据 |
| 限流计数器 | 根据配置 | 动态过期 |

### 7.3 数据库优化

#### 7.3.1 连接池配置

```javascript
const DB_POOL = {
    max: 20,
    min: 5,
    acquire: 30000,
    idle: 10000
};
```

#### 7.3.2 索引策略

```sql
-- 用户表索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- 文件表索引
CREATE INDEX idx_files_user_visibility ON files(user_id, visibility);
CREATE INDEX idx_files_created ON files(created_at DESC);
CREATE INDEX idx_files_file_hash ON files(file_hash);

-- 分享表索引
CREATE INDEX idx_shares_code_expire ON shares(share_code, expire_at);
CREATE INDEX idx_shares_user_id ON shares(user_id);

-- 下载记录表索引
CREATE INDEX idx_download_logs_file_id ON download_logs(file_id);
CREATE INDEX idx_download_logs_created ON download_logs(created_at);
```

#### 7.3.3 查询优化

```javascript
// 使用游标分页代替OFFSET
async function getFilesByCursor(userId, cursor, limit) {
    const whereClause = cursor 
        ? 'WHERE user_id = ? AND id < ?'
        : 'WHERE user_id = ?';
    
    const files = await db.query(`
        SELECT * FROM files 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT ?
    `, cursor ? [userId, cursor, limit] : [userId, limit]);
    
    return files;
}
```

---

## 环境配置

### 8.1 环境变量

```env
# 应用配置
NODE_ENV=development
PORT=3000

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cloud_storage
DB_USER=root
DB_PASSWORD=your_password

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT配置
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRES_IN=2h
REFRESH_TOKEN_EXPIRES_IN=7d

# 默认管理员配置（首次部署使用）
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin123
DEFAULT_ADMIN_EMAIL=admin@szhao.cloud
DEFAULT_ADMIN_QUOTA=107374182400

# 存储配置
STORAGE_PATH=./uploads
MAX_FILE_SIZE=5368709120
CHUNK_SIZE=5242880

# 上传限制
ALLOWED_MIME_TYPES=image/*,video/*,audio/*,application/pdf,application/zip
BLOCKED_EXTENSIONS=.exe,.bat,.cmd,.sh,.php,.asp,.aspx,.jsp

# 速率限制
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# 版权信息
COPYRIGHT_OWNER=szhAo
APP_VERSION=1.0.0
APP_NAME=szhAo Cloud Storage

# 日志配置
LOG_LEVEL=info
LOG_PATH=./logs
```

### 8.2 生产环境建议

```env
NODE_ENV=production
PORT=3000

# 使用强密码
DB_PASSWORD=strong_random_password
JWT_SECRET=very_long_random_secret_key

# 使用HTTPS
HTTPS=true
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem

# 启用压缩
COMPRESSION=true

# 日志级别
LOG_LEVEL=warn
```

---

## 部署方案

### 9.1 Docker部署

#### 9.1.1 Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/app.js"]
```

#### 9.1.2 docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
      - REDIS_HOST=redis
    depends_on:
      - mysql
      - redis
    volumes:
      - ./uploads:/app/uploads

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=rootpassword
      - MYSQL_DATABASE=cloud_storage
    volumes:
      - mysql_data:/var/lib/mysql

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  mysql_data:
  redis_data:
```

### 9.2 初始化管理员账号

系统首次启动时会自动创建默认管理员账号（如果不存在）：

```javascript
// src/scripts/initAdmin.js
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initAdmin() {
    const { DEFAULT_ADMIN_USERNAME, DEFAULT_ADMIN_PASSWORD, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_QUOTA } = process.env;
    
    const existingAdmin = await prisma.user.findUnique({
        where: { username: DEFAULT_ADMIN_USERNAME }
    });
    
    if (existingAdmin) {
        console.log('管理员账号已存在，跳过初始化');
        return;
    }
    
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
    
    const admin = await prisma.user.create({
        data: {
            username: DEFAULT_ADMIN_USERNAME,
            passwordHash,
            email: DEFAULT_ADMIN_EMAIL,
            role: 1,
            storageQuota: BigInt(DEFAULT_ADMIN_QUOTA),
            storageUsed: BigInt(0),
            status: 1
        }
    });
    
    console.log('默认管理员账号创建成功:', admin.username);
    console.log('请立即修改默认密码！');
}

initAdmin()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
```

**首次部署步骤：**

1. 修改 `.env` 文件中的默认管理员配置
2. 启动服务：`docker-compose up -d`
3. 使用默认管理员账号登录
4. 立即修改默认密码

### 9.3 Nginx反向代理

```nginx
server {
    listen 80;
    server_name cloud.example.com;

    client_max_body_size 5G;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /uploads/ {
        alias /app/uploads/;
        internal;
    }
}
```

---

## 监控与日志

### 10.1 日志配置

```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error' 
        }),
        new winston.transports.File({ 
            filename: 'logs/combined.log' 
        })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}
```

### 10.2 性能监控

```javascript
const promClient = require('prom-client');

const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code']
});

const fileUploadDuration = new promClient.Histogram({
    name: 'file_upload_duration_seconds',
    help: 'Duration of file uploads in seconds',
    labelNames: ['file_size']
});

const fileDownloadDuration = new promClient.Histogram({
    name: 'file_download_duration_seconds',
    help: 'Duration of file downloads in seconds',
    labelNames: ['file_size']
});

promClient.collectDefaultMetrics();
```

---

## 扩展功能建议

### 11.1 文件夹管理

```sql
CREATE TABLE folders (
    id          VARCHAR(36) PRIMARY KEY,
    user_id     VARCHAR(36) NOT NULL,
    parent_id   VARCHAR(36),
    name        VARCHAR(255) NOT NULL,
    path        VARCHAR(1000),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
);
```

### 11.2 文件版本控制

```sql
CREATE TABLE file_versions (
    id          VARCHAR(36) PRIMARY KEY,
    file_id     VARCHAR(36) NOT NULL,
    version     INT NOT NULL,
    file_path   VARCHAR(500) NOT NULL,
    file_size   BIGINT NOT NULL,
    file_hash   VARCHAR(64),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
);
```

### 11.3 回收站功能

```javascript
const TRASH_CONFIG = {
    retentionDays: 30,
    autoCleanup: true,
    cleanupSchedule: '0 2 * * *'
};
```

### 11.4 文件预览

```javascript
const PREVIEW_TYPES = {
    image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    video: ['mp4', 'webm', 'ogg'],
    audio: ['mp3', 'wav', 'ogg', 'flac'],
    document: ['pdf'],
    text: ['txt', 'md', 'json', 'xml', 'csv']
};
```

---

## 附录

### A. 错误码定义

| 错误码 | 说明 |
|--------|------|
| 10001 | 用户名已存在 |
| 10002 | 用户名或密码错误 |
| 10003 | Token无效或已过期 |
| 10004 | 需要管理员权限 |
| 10005 | 用户不存在 |
| 10006 | 无法删除管理员账号 |
| 20001 | 文件不存在 |
| 20002 | 文件大小超过限制 |
| 20003 | 文件类型不被允许 |
| 20004 | 存储空间不足 |
| 30001 | 分享链接不存在 |
| 30002 | 分享链接已过期 |
| 30003 | 下载次数已用尽 |
| 30004 | 访问密码错误 |

### B. 常见问题

#### Q1: 如何实现断点续传？

A: 使用HTTP Range请求头，服务端根据Range返回对应的文件片段。

#### Q2: 如何处理大文件上传？

A: 使用分片上传，将大文件分成多个小块并发上传，最后合并。

#### Q3: 如何提高下载速度？

A: 使用流式传输、支持Range请求、启用压缩、使用CDN加速。

#### Q4: 如何保证文件安全？

A: 使用JWT认证、权限控制、文件访问验证、速率限制、文件类型检查。

#### Q5: 如何创建新用户账号？

A: 使用默认管理员账号登录后，通过 `POST /api/v1/users` 接口创建新用户。

#### Q6: 如何修改默认管理员密码？

A: 使用默认管理员账号登录后，通过 `PATCH /api/v1/users/:user_id` 接口修改密码。

### C. 参考资料

- [Node.js官方文档](https://nodejs.org/docs/)
- [Koa.js文档](https://koajs.com/)
- [Prisma文档](https://www.prisma.io/docs)
- [JWT规范](https://tools.ietf.org/html/rfc7519)
- [HTTP Range请求](https://tools.ietf.org/html/rfc7233)

---

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2024-03-01 | 初始版本 |

---

**版权所有 © 2024 szhAo. 保留所有权利。**

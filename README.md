# LocalGame

> 冰霜粗野主义风格的游戏展示平台

LocalGame 是一个采用冰霜粗野主义（Frost Brutalism）设计风格的游戏展示平台。

**核心特性**：
- ✅ **无框架依赖** - 纯原生 JavaScript ES6 模块化
- ✅ **无数据库依赖** - JSON 文件存储，轻量部署
- ✅ **严格分离** - HTML/CSS/JS 完全解耦
- ✅ **单页应用** - 基于状态管理的 SPA 架构
- ✅ **Hash 路由** - 每个页面有独立 URL，可直接分享
- ✅ **用户系统** - 邮箱注册登录，验证码认证
- ✅ **游戏上传** - 用户可上传 HTML 游戏
- ✅ **极简后台** - 纯文本链接，无边框设计
- ✅ **移动优化** - 响应式支持（电脑15个/平板9个/手机6个）

**技术栈**：FastAPI + Uvicorn + JWT + SHA256 | 原生 JavaScript ES6

---

## 一句话概述

基于 FastAPI + 原生 JavaScript 的游戏展示平台，用户可上传 HTML 游戏，支持邮箱注册登录，管理员可管理公告、通告、游戏和留言。

---

## 核心功能

### 用户端
- **游戏展示**：网格展示已发布游戏（电脑15个/平板9个/手机6个一行）
- **游戏上传**：登录用户可上传 HTML 游戏（草稿/发布机制）
- **我的游戏**：管理自己上传的游戏（发布/删除）
- **留言功能**：用户可发送留言
- **公告查看**：点击 Doge 查看最新公告
- **通告列表**：查看系统通告
- **用户中心**：修改昵称、删除账户
- **电台播放**：背景音乐播放器
- **书籍滚动**：顶部文字滚动展示

### 管理端
- **公告管理**：管理 Doge 弹窗公告（单个最新）
- **通告管理**：管理文章列表形式的通告（多篇）
- **游戏管理**：查看所有已发布游戏，删除任何游戏
- **留言管理**：查看所有留言，删除任何留言
- **极简设计**：纯文本链接，无边框

---

## 项目结构

```
LocalGame/
│
├─ backend/                           # Python 后端
│   ├─ main.py                        # FastAPI 应用入口
│   ├─ config.py                      # 配置管理
│   │
│   ├─ routers/                       # API 路由模块
│   │   ├─ auth.py                    # 用户认证（注册/登录/验证码）
│   │   ├─ announcement.py            # 公告路由（弹窗）
│   │   ├─ bulletin.py                # 通告路由（列表）
│   │   ├─ game.py                    # 游戏路由（上传/发布/删除）
│   │   ├─ chat.py                    # 聊天留言路由
│   │   ├─ book.py                    # 书籍滚动路由
│   │   ├─ config.py                  # 配置信息路由
│   │   └─ search.py                  # 搜索路由
│   │
│   ├─ schemas/                       # Pydantic 数据验证
│   │   ├─ auth.py                    # 认证相关 schema
│   │   └─ content.py                 # 内容相关 schema
│   │
│   ├─ services/                      # 业务逻辑层
│   │   └─ email_service.py           # 邮件发送服务
│   │
│   └─ utils/                         # 工具函数
│       ├─ auth.py                    # JWT 工具函数
│       └─ user_manager.py            # 用户管理工具
│
├─ frontend/                          # 纯前端代码
│   ├─ index.html                     # 用户界面主入口（SPA）
│   │
│   ├─ admin/                         # 管理后台
│   │   ├─ index.html                 # 管理后台主页
│   │   └─ login.html                 # 管理员登录页
│   │
│   ├─ pages/                         # 其他页面
│   │   └─ chat.html                  # 聊天页（iframe 嵌入）
│   │
│   ├─ css/                           # 样式文件
│   │   ├─ style.css                  # 全局样式（冰霜粗野主义配色）
│   │   ├─ index.css                  # 主页布局样式
│   │   ├─ components.css             # 组件样式（Toast/灯箱/游戏网格）
│   │   ├─ chat.css                   # 聊天页样式
│   │   └─ admin.css                  # 管理后台样式（极简无边框）
│   │
│   ├─ js/                            # JavaScript 模块
│   │   ├─ main.js                    # 应用入口（初始化 SPA）
│   │   │
│   │   ├─ core/                      # 核心系统模块
│   │   │   └─ StateManager.js        # 状态管理器（SPA 核心）
│   │   │
│   │   ├─ components/                # 可复用组件
│   │   │   ├─ MainContentArea.js     # 主内容区渲染器
│   │   │   ├─ ContentCard.js         # 内容卡片组件
│   │   │   ├─ EmptyState.js          # 空状态组件
│   │   │   ├─ RadioPlayer.js         # 音频播放器组件
│   │   │   ├─ ImageLightbox.js       # 图片灯箱组件
│   │   │   ├─ Toast.js               # 提示消息组件（极简浅色）
│   │   │   ├─ AnnouncementModal.js   # 公告弹窗组件
│   │   │   └─ AuthUI.js              # 用户认证 UI
│   │   │
│   │   ├─ utils/                     # 工具函数
│   │   │   ├─ apiClient.js           # HTTP 客户端封装
│   │   │   ├─ htmlHelpers.js         # HTML 处理工具
│   │   │   └─ navIconLoader.js       # 导航图标加载器
│   │   │
│   │   ├─ config/                    # 配置模块
│   │   │   └─ pageConfigs.js         # 页面配置定义
│   │   │
│   │   ├─ pages/                     # 页面逻辑
│   │   │   ├─ game.js                # 游戏页逻辑（列表/上传/我的游戏）
│   │   │   └─ chat.js                # 聊天页逻辑
│   │   │
│   │   └─ admin/                     # 管理后台逻辑
│   │       ├─ admin.js               # 管理后台主逻辑（公告/通告/游戏/留言）
│   │       └─ login.js               # 管理员登录逻辑（验证码）
│   │
│   └─ images/                        # 静态图片资源
│       ├─ background.webp            # 背景图片
│       ├─ doge.gif                   # Doge 动图（点击查看公告）
│       ├─ play.png                   # 播放按钮
│       ├─ pause.png                  # 暂停按钮
│       ├─ nav-announcement.png       # 通告导航图标
│       ├─ nav-game.gif               # 游戏导航图标（GIF 动图）
│       └─ nav-chat.png               # 留言导航图标
│
├─ data/                              # 数据目录
│   ├─ system/                        # 系统数据
│   │   ├─ users.json                 # 用户列表
│   │   ├─ pending_registrations.json # 待验证注册
│   │   ├─ login_codes.json           # 登录验证码
│   │   ├─ rate_limits.json           # 限流记录
│   │   ├─ announcement_drafts.json   # 公告草稿
│   │   ├─ announcement_published.json# 公告已发布
│   │   ├─ bulletin_drafts.json       # 通告草稿
│   │   └─ bulletin_published.json    # 通告已发布
│   │
│   ├─ chat/                          # 聊天数据
│   │   └─ messages.json              # 留言记录
│   │
│   └─ users/                         # 用户数据
│       └─ {user_folder}/             # 每个用户独立文件夹
│           ├─ drafts/                # 草稿
│           │   └─ game.json          # 游戏草稿
│           ├─ published/             # 已发布
│           │   └─ game.json          # 已发布游戏
│           ├─ games/                 # 游戏文件
│           │   └─ {uuid}.html        # HTML 游戏文件
│           └─ images/                # 图片文件
│               └─ {uuid}.{ext}       # 缩略图
│
├─ book/                              # 书籍内容
│   └─ 查拉图斯特拉如是说.txt
│
├─ config.json                        # 全局配置（管理员邮箱/SMTP/JWT）
├─ requirements.txt                   # Python 依赖
├─ init_data.py                       # 初始化数据目录
├─ del_data.py                        # 清空数据目录
├─ README.md                          # 项目说明
├─ ARCHITECTURE.md                    # 架构文档
└─ Nginx命令手册.txt                   # Nginx 配置手册
```

---

## 快速启动

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 初始化数据目录

```bash
python init_data.py
```

### 3. 配置管理员邮箱

编辑 `config.json`，设置管理员邮箱和 SMTP 信息：

```json
{
  "admin_email": "your-email@qq.com",
  "smtp_host": "smtp.qq.com",
  "smtp_port": 465,
  "smtp_password": "your-smtp-auth-code",
  "smtp_use_ssl": true
}
```

### 4. 启动服务

```bash
python backend/main.py
```

### 5. 访问地址

- **前台访问**: http://127.0.0.1:8000
- **管理后台**: http://127.0.0.1:8000/admin/index.html
- **管理员邮箱**: 配置文件中的 admin_email（验证码登录）

---

## 核心架构

### 1. 用户系统

**注册流程**：
1. 输入邮箱 → 发送验证码
2. 输入验证码 + 设置密码 → 注册成功
3. 自动创建用户文件夹（UUID）

**登录方式**：
- **普通用户**：邮箱+密码 或 邮箱+验证码
- **管理员**：邮箱+验证码（仅验证码登录）

**管理员特性**：
- 在 `config.json` 中配置 `admin_email`
- 首次使用验证码登录时自动创建管理员账户
- 在前台作为普通用户，无特权
- 在后台（`/admin`）拥有完整管理权限

### 2. 游戏系统

**上传流程**：
1. 登录后点击"上传游戏"
2. 填写标题、介绍、选择 HTML 文件和缩略图
3. 上传后保存为草稿状态
4. 到"我的游戏"页面发布

**文件限制**：
- 游戏文件：HTML 格式，无大小限制
- 缩略图：图片格式，无大小限制

**操作权限**：
- 用户只能管理自己的游戏
- 管理员可在后台删除任何游戏

### 3. 双存储模型

**数据结构**：

```
用户游戏数据：
  data/users/{user_folder}/
    ├─ drafts/game.json         # 草稿
    └─ published/game.json      # 已发布

系统通告数据：
  data/system/
    ├─ bulletin_drafts.json     # 通告草稿
    └─ bulletin_published.json  # 通告已发布
```

**操作语义**：

| 操作 | 草稿区 | 发布区 | 效果 |
|------|--------|--------|------|
| 上传游戏 | 写入 | - | 保存为草稿 |
| 发布 | 保留 | 复制 | 发布后两区都有 |
| 删除 | 删除 | 删除 | 彻底删除（含文件） |

### 4. 管理后台

**4个管理栏目**：
1. **公告**（Announcement）：管理 Doge 弹窗公告
2. **通告**（Bulletin）：管理文章列表形式的通告
3. **游戏**（Game）：查看和删除所有游戏
4. **留言**（Chat）：查看和删除所有留言

**设计原则**：
- 纯文本链接，无边框
- 极简主义，一切从简
- 文字变色交互，无弹窗

---

## API 接口

### 公开接口

```http
# 游戏相关
GET  /api/game/list                   # 获取已发布游戏列表
GET  /api/game/{id}                   # 获取游戏详情

# 通告相关
GET  /api/bulletin/list               # 获取已发布通告列表

# 公告相关
GET  /api/announcement/latest         # 获取最新公告

# 留言相关
GET  /api/chat/messages               # 获取留言列表

# 其他
GET  /api/book/content                # 获取书籍滚动内容
GET  /api/config/stream               # 获取电台配置
GET  /api/search?q={keyword}          # 搜索游戏
```

### 用户接口（需登录）

```http
# 游戏管理
POST   /api/game/upload               # 上传游戏
GET    /api/game/my-games             # 我的游戏列表
POST   /api/game/{id}/publish         # 发布游戏
DELETE /api/game/{id}                 # 删除游戏

# 留言
POST   /api/chat/messages             # 发送留言

# 用户管理
PUT    /api/auth/change-username      # 修改昵称
DELETE /api/auth/delete-account       # 删除账户
```

### 管理员接口（需管理员权限）

```http
# 公告管理
GET    /api/announcement/admin/list
POST   /api/announcement/admin/create
PUT    /api/announcement/admin/{id}
POST   /api/announcement/admin/{id}/publish
POST   /api/announcement/admin/{id}/unpublish
DELETE /api/announcement/admin/{id}

# 通告管理
GET    /api/bulletin/admin/list
POST   /api/bulletin/admin/create
PUT    /api/bulletin/admin/{id}
POST   /api/bulletin/admin/{id}/publish
POST   /api/bulletin/admin/{id}/unpublish
DELETE /api/bulletin/admin/{id}

# 游戏管理（查看和删除所有用户的游戏）
DELETE /api/game/{id}                 # 管理员可删除任何游戏

# 留言管理
DELETE /api/chat/messages/{id}        # 删除单条留言
```

---

## 认证系统

### 注册流程

1. 输入邮箱 → 点击"发送验证码"
2. 输入验证码 + 设置密码（至少8位）
3. 可选填写昵称（留空自动生成"用户001"）
4. 点击"注册" → 自动登录

**验证码机制**：
- 6位数字验证码
- 5分钟内有效
- 60秒倒计时后可重新发送

### 登录流程

**普通用户**：
- 方式1：邮箱 + 密码
- 方式2：邮箱 + 验证码

**管理员**：
- 仅支持：邮箱 + 验证码
- 首次登录自动创建管理员账户

### JWT Token

- 算法：HS256
- 有效期：7天
- 存储：localStorage（`authToken`）

---

## 数据模型

### 游戏数据

```typescript
interface Game {
  id: string;                    // 格式: YYYYMMDDHHMMSSffffff
  title: string;                 // 游戏名称
  content?: string;              // 游戏介绍
  thumbnail: string;             // 缩略图 URL
  game_file: string;             // 游戏文件 URL
  author_id: string;             // 作者 ID
  author_name: string;           // 作者昵称
  status: 'draft' | 'published'; // 状态
  created_at: string;            // 创建时间
  updated_at: string;            // 更新时间
  published_at?: string;         // 发布时间
}
```

### 用户数据

```typescript
interface User {
  id: string;                    // 用户 ID（001, 002, ...）
  email: string;                 // 邮箱（唯一）
  username: string;              // 昵称（可修改）
  password_hash: string;         // 密码哈希（SHA256）
  role: 'user' | 'admin';        // 角色
  folder: string;                // 文件夹名（UUID）
  is_active: boolean;            // 账户状态
  created_at: string;            // 注册时间
  last_login?: string;           // 最后登录时间
}
```

---

## 响应式设计

### 游戏网格布局

- **电脑端**（>1024px）：一行 15 个
- **平板端**（≤1024px）：一行 9 个
- **手机端**（≤768px）：一行 6 个

### 触摸优化

- 最小触摸目标：44×44px
- 间距适配移动端
- 图片灯箱支持触摸滑动

---

## 部署指南

### 开发环境

```bash
python backend/main.py
```

访问 http://127.0.0.1:8000

### 生产环境（Nginx）

参考 `Nginx命令手册.txt`

**配置要点**：
- 静态文件：`/css`, `/js`, `/images`, `/admin`
- 反向代理：`/api` → 127.0.0.1:8000
- 用户媒体文件：`/media` → 127.0.0.1:8000

---

## 配置说明

### config.json

```json
{
  "admin_email": "your-email@qq.com",           # 管理员邮箱
  "smtp_host": "smtp.qq.com",                   # SMTP 服务器
  "smtp_port": 465,                             # SMTP 端口
  "smtp_password": "your-smtp-auth-code",       # SMTP 授权码
  "smtp_use_ssl": true,                         # 使用 SSL
  "stream_url": "https://...",                  # 电台流 URL
  "stream_name": "电台名称",                     # 电台名称
  "jwt_secret": "your-secret-key",              # JWT 密钥（至少32字符）
  "jwt_algorithm": "HS256",                     # JWT 算法
  "jwt_expiration_days": 7                      # Token 有效期（天）
}
```

---

## 设计原则

1. **HTML/CSS/JS 完全分离**：三者独立，互不依赖
2. **单一职责**：每个模块只负责一件事
3. **无框架依赖**：原生 JavaScript，永不过时
4. **无数据库依赖**：JSON 文件存储，轻量部署
5. **极简主义**：纯文本链接，无边框装饰
6. **移动优先**：完整的响应式支持

---

## 特色亮点

- ✅ **游戏平台**：用户可上传 HTML 游戏
- ✅ **双重身份**：管理员在前台 = 普通用户，在后台 = 管理员
- ✅ **邮箱认证**：验证码注册登录，60秒倒计时
- ✅ **账户管理**：修改昵称、删除账户
- ✅ **公告 vs 通告**：弹窗公告（单个）+ 列表通告（多篇）
- ✅ **极简 UI**：无边框、纯文本、浅色 Toast
- ✅ **4399 风格**：游戏网格展示（15/9/6 响应式）

---

## 数据管理

### 初始化空数据

```bash
python init_data.py
```

### 清空所有数据

```bash
python del_data.py
```

### 备份数据

```bash
# Windows
Compress-Archive -Path data,book,config.json -DestinationPath backup-$(Get-Date -Format "yyyyMMdd").zip

# Linux/Mac
tar -czf backup-$(date +%Y%m%d).tar.gz data/ book/ config.json
```

---

## 安全建议

**生产环境必须修改**：

1. `config.json` 中的 `jwt_secret`（使用随机字符串）
2. `config.json` 中的 `admin_email`（改为你的邮箱）
3. 配置正确的 SMTP 信息
4. 使用 HTTPS 部署
5. 添加 API 限流中间件

---

## 技术细节

### 密码加密

使用 Python 内置 `hashlib.sha256`，无需额外依赖。

### 文件存储

- 用户文件夹：UUID 随机字符串
- 游戏文件：UUID.html
- 缩略图：UUID.{ext}

### 验证码机制

- 6位数字
- 5分钟有效
- 限流：1小时内最多3次（注册）或5次（登录）

---

## 开发规范

### 前端代码规范

1. **HTML**：只写结构，使用 `data-*` 传递数据
2. **CSS**：只写样式，使用类名控制状态
3. **JavaScript**：只写逻辑，通过 `classList` 操作样式

### 组件设计规范

1. **单一职责**：每个组件只负责一件事
2. **明确接口**：输入输出清晰
3. **无副作用**：不依赖全局状态
4. **可组合**：可与其他组件组合

---

## 常见问题

### Q1: 收不到验证码？

**原因**：
1. 邮箱地址不存在
2. SMTP 配置错误
3. QQ 邮箱授权码错误

**解决**：
1. 确认邮箱地址正确
2. 检查 `config.json` 中的 SMTP 配置
3. 查看终端日志获取详细错误信息

### Q2: 管理员如何登录？

1. 访问 `/admin/login.html`
2. 输入 `config.json` 中配置的管理员邮箱
3. 点击"发送验证码"（首次登录会自动创建账户）
4. 输入验证码登录

### Q3: 如何区分公告和通告？

- **公告**（Announcement）：左上角 Doge 点击的弹窗，只显示最新一条
- **通告**（Bulletin）：文章列表形式，可以有多篇

---

## 更新日志

### v2.0 - 游戏平台版本

- ✅ 从博客系统改造为游戏展示平台
- ✅ 添加用户注册登录系统
- ✅ 添加游戏上传功能
- ✅ 区分公告和通告
- ✅ 管理后台统一管理（公告/通告/游戏/留言）
- ✅ 简化密码加密（SHA256）
- ✅ 极简UI（无边框、浅色Toast）
- ✅ 添加用户管理（修改昵称、删除账户）

---

**适用场景**：游戏展示平台、小游戏分享社区、HTML5 游戏托管

**MIT License**

# API 接口规范

## 接口设计原则

1. **RESTful 风格** - 符合 REST 规范
2. **统一响应格式** - 成功/失败统一结构
3. **HTTP 状态码** - 200/400/401/403/404/500
4. **JWT 认证** - Authorization: Bearer {token}

## 公开接口（无需登录）

```http
GET  /api/game/list                   # 获取游戏列表
GET  /api/game/{id}                   # 获取游戏详情
GET  /api/bulletin/list               # 获取通告列表
GET  /api/announcement/latest         # 获取最新公告
GET  /api/chat/messages               # 获取留言列表
GET  /api/book/content                # 获取书籍内容
GET  /api/config/stream               # 获取电台配置
GET  /api/search?q={keyword}          # 搜索游戏
```

## 用户接口（需登录）

```http
POST   /api/game/upload               # 上传游戏
GET    /api/game/my-games             # 我的游戏
POST   /api/game/{id}/publish         # 发布游戏
DELETE /api/game/{id}                 # 删除游戏
POST   /api/chat/messages             # 发送留言
```

## 管理员接口

```http
DELETE /api/game/{id}                 # 删除任何游戏
DELETE /api/chat/messages/{id}        # 删除留言
POST   /api/announcement/admin/create # 创建公告
POST   /api/bulletin/admin/create     # 创建通告
```

**响应**：成功 `{"success": true}`，失败 `{"detail": "错误信息"}`

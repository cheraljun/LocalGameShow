"""
FastAPI主应用入口
提供静态文件服务和API路由
"""
import sys
import json
from pathlib import Path

# 添加项目根目录到 Python 路径（使用 resolve() 确保获取绝对路径）
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os

# ========== 检查必需的目录是否存在 ==========
def check_directories():
    """检查必需的目录是否存在"""
    data_dir = ROOT_DIR / "data"
    if not data_dir.exists():
        print("\n❌ 错误：data 目录不存在！")
        print("\n请先运行以下命令初始化数据目录：")
        print("  python init_data.py")
        print("\n如果是首次部署，请按以下步骤操作：")
        print("  1. python 提交git前运行.py    # 清空旧数据")
        print("  2. python init_data.py          # 初始化空结构")
        print("  3. 编辑 config.json 配置 smtp_password")
        print("  4. python backend/main.py       # 启动服务器")
        print("")
        import sys
        sys.exit(1)

# 检查目录
check_directories()

# 创建FastAPI应用
app = FastAPI(
    title="LocalGame API",
    description="游戏展示平台的后端API",
    version="2.0.0"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载静态文件目录（使用绝对路径，不依赖工作目录）
app.mount("/css", StaticFiles(directory=str(ROOT_DIR / "frontend/css")), name="css")
app.mount("/js", StaticFiles(directory=str(ROOT_DIR / "frontend/js")), name="js")
app.mount("/pages", StaticFiles(directory=str(ROOT_DIR / "frontend/pages")), name="pages")
app.mount("/images", StaticFiles(directory=str(ROOT_DIR / "frontend/images")), name="images")
app.mount("/admin", StaticFiles(directory=str(ROOT_DIR / "frontend/admin")), name="admin")

# 用户媒体文件的静态服务（通过 API 路由实现）
from fastapi.responses import FileResponse as FR
from fastapi import HTTPException as HE

@app.get("/media/games/{user_folder}/{filename}")
async def serve_game_file(user_folder: str, filename: str):
    """提供用户游戏文件"""
    file_path = ROOT_DIR / "data" / "users" / user_folder / "games" / filename
    if not file_path.exists():
        raise HE(status_code=404, detail="文件不存在")
    return FR(str(file_path))

@app.get("/media/images/{user_folder}/{filename}")
async def serve_image_file(user_folder: str, filename: str):
    """提供用户图片文件"""
    file_path = ROOT_DIR / "data" / "users" / user_folder / "images" / filename
    if not file_path.exists():
        raise HE(status_code=404, detail="文件不存在")
    return FR(str(file_path))

# 根路由 - 返回首页（SPA入口）
@app.get("/")
async def read_root():
    return FileResponse(str(ROOT_DIR / "frontend/index.html"))

# 健康检查
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# 导入API路由
from backend.routers import auth, search, chat, book, announcement, bulletin, config, game

# 认证路由
app.include_router(auth.router, prefix="/api/auth", tags=["认证"])

# 配置路由（公开）
app.include_router(config.router, prefix="/api/config", tags=["配置"])

# 搜索路由
app.include_router(search.router, prefix="/api", tags=["搜索"])

# 聊天路由
app.include_router(chat.router, prefix="/api/chat", tags=["聊天"])

# 书籍滚动路由
app.include_router(book.router, prefix="/api/book", tags=["书籍"])

# 公告路由（弹窗）
app.include_router(announcement.router, prefix="/api/announcement", tags=["公告"])

# 通告路由（列表）
app.include_router(bulletin.router, prefix="/api/bulletin", tags=["通告"])

# 游戏路由
app.include_router(game.router, prefix="/api/game", tags=["游戏"])

def convert_background_to_webp():
    """将背景图片转换为 WebP 格式"""
    from PIL import Image
    from pathlib import Path
    
    images_dir = ROOT_DIR / "frontend" / "images"
    images_dir.mkdir(exist_ok=True)
    
    # 检查是否已有 WebP 格式
    webp_path = images_dir / "background.webp"
    if webp_path.exists():
        print("✅ 背景图片已是 WebP 格式")
        return "background.webp"
    
    # 查找其他格式的背景图片
    for ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp']:
        bg_path = images_dir / f"background{ext}"
        if bg_path.exists():
            print(f"🔄 发现 {bg_path.name}，正在转换为 WebP 格式...")
            try:
                # 打开图片并转换为 WebP
                img = Image.open(bg_path)
                # 如果是 PNG 带透明度，保留 alpha 通道
                if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                    img = img.convert('RGBA')
                else:
                    img = img.convert('RGB')
                
                # 保存为 WebP，质量设为 85
                img.save(webp_path, 'WEBP', quality=85)
                print(f"✅ 成功转换为 WebP 格式: {webp_path.name}")
                
                # 更新 CSS 文件
                update_css_background_path("background.webp")
                
                return "background.webp"
            except Exception as e:
                print(f"❌ 转换失败: {e}")
                return f"background{ext}"
    
    print("⚠️  未找到背景图片文件")
    return None

def update_css_background_path(filename):
    """更新 CSS 文件中的背景图片路径"""
    css_file = ROOT_DIR / "frontend" / "css" / "style.css"
    if not css_file.exists():
        return
    
    content = css_file.read_text(encoding='utf-8')
    
    # 替换所有背景图片引用
    import re
    pattern = r"url\(['\"]?\.\./images/background\.[a-zA-Z]+['\"]?\)"
    replacement = f"url('../images/{filename}')"
    
    new_content = re.sub(pattern, replacement, content)
    
    if new_content != content:
        css_file.write_text(new_content, encoding='utf-8')
        print(f"✅ 已更新 CSS 文件中的背景图片路径: {filename}")

if __name__ == "__main__":
    import uvicorn
    
    # 转换背景图片为 WebP 格式
    print("")
    convert_background_to_webp()
    print("")
    
    print("启动服务器...")
    print("")
    print("🌐 前台访问: http://127.0.0.1:8000")
    print("🔧 管理后台: http://127.0.0.1:8000/admin/index.html")
    print("📧 管理员邮箱: 1773384983@qq.com (验证码登录)")
    print("")
    
    # # ========== 开发环境配置 ==========
    # uvicorn.run(
    #     app, 
    #     host="127.0.0.1", 
    #     port=8000,
    #     reload=True,              # 代码变更自动重载
    #     log_level="info"          # 详细日志
    # )
    
    # ========== 生产环境配置（2核2G服务器优化）==========
    uvicorn.run(
        "main:app",
        host="0.0.0.0",              # 监听所有网络接口
        port=8000,
        log_level="info",            # 显示info级别日志（便于调试）
        limit_concurrency=200,       # 2核2G服务器的合理并发数
        timeout_keep_alive=60,       # Keep-Alive超时（节省连接资源）
        access_log=False             # 禁用访问日志（节省I/O）
    )


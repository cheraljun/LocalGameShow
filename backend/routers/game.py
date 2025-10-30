"""
游戏管理路由
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import FileResponse
from typing import Optional, List
from pathlib import Path
import json
import uuid
from datetime import datetime
import shutil

from backend.routers.auth import get_current_user, get_current_admin
from backend.utils.user_manager import get_user_by_id

router = APIRouter()

# 数据目录
DATA_DIR = Path(__file__).parent.parent.parent / "data"
USERS_DIR = DATA_DIR / "users"


# === 辅助函数 ===

def get_user_game_file(user_folder: str, status: str) -> Path:
    """获取用户游戏文件路径"""
    return USERS_DIR / user_folder / status / "game.json"


def load_games(user_folder: str, status: str) -> List[dict]:
    """加载游戏列表"""
    file_path = get_user_game_file(user_folder, status)
    if not file_path.exists():
        return []
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data.get('posts', [])


def save_games(user_folder: str, status: str, games: List[dict]):
    """保存游戏列表"""
    file_path = get_user_game_file(user_folder, status)
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump({'posts': games}, f, ensure_ascii=False, indent=2)


def get_game_by_id(user_folder: str, game_id: str) -> Optional[dict]:
    """获取游戏详情（从 drafts 或 published）"""
    # 先在草稿中查找
    drafts = load_games(user_folder, 'drafts')
    for game in drafts:
        if game['id'] == game_id:
            return game, 'drafts'
    
    # 再在已发布中查找
    published = load_games(user_folder, 'published')
    for game in published:
        if game['id'] == game_id:
            return game, 'published'
    
    return None, None


def get_all_published_games() -> List[dict]:
    """获取所有用户的已发布游戏"""
    all_games = []
    
    if not USERS_DIR.exists():
        return []
    
    # 遍历所有用户文件夹
    for user_dir in USERS_DIR.iterdir():
        if not user_dir.is_dir():
            continue
        
        # 读取该用户的已发布游戏
        published_file = user_dir / "published" / "game.json"
        if published_file.exists():
            with open(published_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                games = data.get('posts', [])
                all_games.extend(games)
    
    # 按发布时间倒序排序
    all_games.sort(key=lambda x: x.get('published_at', ''), reverse=True)
    
    return all_games


# === 游戏上传 ===

@router.post("/upload")
async def upload_game(
    title: str = Form(...),
    content: str = Form(""),
    game_file: UploadFile = File(...),
    thumbnail: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    上传游戏（HTML文件 + 缩略图）
    """
    user_folder = current_user['folder']
    user_id = current_user['id']
    username = current_user['username']
    
    # 验证文件类型
    if not game_file.filename.endswith('.html'):
        raise HTTPException(
            status_code=400,
            detail="游戏文件必须是 HTML 格式"
        )
    
    allowed_image_types = ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    if not any(thumbnail.filename.lower().endswith(ext) for ext in allowed_image_types):
        raise HTTPException(
            status_code=400,
            detail="缩略图必须是图片格式（PNG/JPG/GIF/WEBP）"
        )
    
    # 读取文件内容（无大小限制）
    game_content = await game_file.read()
    thumbnail_content = await thumbnail.read()
    
    # 生成唯一ID
    game_id = datetime.now().strftime("%Y%m%d%H%M%S")
    file_uuid = uuid.uuid4().hex
    
    # 保存文件
    user_dir = USERS_DIR / user_folder
    games_dir = user_dir / "games"
    images_dir = user_dir / "images"
    
    games_dir.mkdir(parents=True, exist_ok=True)
    images_dir.mkdir(parents=True, exist_ok=True)
    
    # 保存游戏HTML文件
    game_filename = f"{file_uuid}.html"
    game_path = games_dir / game_filename
    with open(game_path, 'wb') as f:
        f.write(game_content)
    
    # 保存缩略图
    thumbnail_ext = Path(thumbnail.filename).suffix
    thumbnail_filename = f"{file_uuid}{thumbnail_ext}"
    thumbnail_path = images_dir / thumbnail_filename
    with open(thumbnail_path, 'wb') as f:
        f.write(thumbnail_content)
    
    # 创建游戏记录
    game_record = {
        "id": game_id,
        "title": title,
        "content": content,
        "thumbnail": f"/media/images/{user_folder}/{thumbnail_filename}",
        "game_file": f"/media/games/{user_folder}/{game_filename}",
        "author_id": user_id,
        "author_name": username,
        "status": "draft",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "published_at": None
    }
    
    # 保存到草稿
    drafts = load_games(user_folder, 'drafts')
    drafts.append(game_record)
    save_games(user_folder, 'drafts', drafts)
    
    return {
        "success": True,
        "message": "游戏上传成功（草稿状态）",
        "game": game_record
    }


# === 获取游戏列表 ===

@router.get("/list")
async def get_published_games():
    """
    获取所有已发布的游戏列表（公开访问）
    """
    games = get_all_published_games()
    return {
        "success": True,
        "games": games
    }


@router.get("/my-games")
async def get_my_games(current_user: dict = Depends(get_current_user)):
    """
    获取当前用户的所有游戏（草稿 + 已发布）
    """
    user_folder = current_user['folder']
    
    drafts = load_games(user_folder, 'drafts')
    published = load_games(user_folder, 'published')
    
    # 合并并标记状态
    all_games = []
    for game in drafts:
        game['status'] = 'draft'
        all_games.append(game)
    
    for game in published:
        game['status'] = 'published'
        all_games.append(game)
    
    # 按创建时间倒序
    all_games.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    
    return {
        "success": True,
        "games": all_games
    }


# === 获取游戏详情 ===

@router.get("/{game_id}")
async def get_game_detail(game_id: str):
    """
    获取游戏详情（公开访问已发布的游戏）
    """
    # 在所有用户的已发布游戏中查找
    all_games = get_all_published_games()
    
    for game in all_games:
        if game['id'] == game_id:
            return {
                "success": True,
                "game": game
            }
    
    raise HTTPException(
        status_code=404,
        detail="游戏不存在或未发布"
    )


# === 编辑游戏 ===

@router.put("/{game_id}")
async def update_game(
    game_id: str,
    title: Optional[str] = Form(None),
    content: Optional[str] = Form(None),
    game_file: Optional[UploadFile] = File(None),
    thumbnail: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    """
    编辑游戏（只能编辑自己的游戏）
    """
    user_folder = current_user['folder']
    
    # 查找游戏
    game, status = get_game_by_id(user_folder, game_id)
    
    if not game:
        raise HTTPException(
            status_code=404,
            detail="游戏不存在"
        )
    
    # 确认所有权
    if game['author_id'] != current_user['id']:
        raise HTTPException(
            status_code=403,
            detail="无权编辑此游戏"
        )
    
    # 更新文字信息
    if title:
        game['title'] = title
    if content is not None:
        game['content'] = content
    
    # 更新游戏文件
    if game_file:
        if not game_file.filename.endswith('.html'):
            raise HTTPException(
                status_code=400,
                detail="游戏文件必须是 HTML 格式"
            )
        
        game_content = await game_file.read()
        
        # 删除旧文件
        old_game_path = USERS_DIR / user_folder / "games" / Path(game['game_file']).name
        if old_game_path.exists():
            old_game_path.unlink()
        
        # 保存新文件
        file_uuid = uuid.uuid4().hex
        game_filename = f"{file_uuid}.html"
        game_path = USERS_DIR / user_folder / "games" / game_filename
        with open(game_path, 'wb') as f:
            f.write(game_content)
        
        game['game_file'] = f"/media/games/{user_folder}/{game_filename}"
    
    # 更新缩略图
    if thumbnail:
        allowed_types = ['.png', '.jpg', '.jpeg', '.gif', '.webp']
        if not any(thumbnail.filename.lower().endswith(ext) for ext in allowed_types):
            raise HTTPException(
                status_code=400,
                detail="缩略图必须是图片格式"
            )
        
        thumbnail_content = await thumbnail.read()
        
        # 删除旧文件
        old_thumb_path = USERS_DIR / user_folder / "images" / Path(game['thumbnail']).name
        if old_thumb_path.exists():
            old_thumb_path.unlink()
        
        # 保存新文件
        file_uuid = uuid.uuid4().hex
        thumbnail_ext = Path(thumbnail.filename).suffix
        thumbnail_filename = f"{file_uuid}{thumbnail_ext}"
        thumbnail_path = USERS_DIR / user_folder / "images" / thumbnail_filename
        with open(thumbnail_path, 'wb') as f:
            f.write(thumbnail_content)
        
        game['thumbnail'] = f"/media/images/{user_folder}/{thumbnail_filename}"
    
    # 更新时间
    game['updated_at'] = datetime.now().isoformat()
    
    # 如果是已发布的，自动撤回到草稿（编辑后需要重新发布）
    if status == 'published':
        # 从已发布中删除
        published = load_games(user_folder, 'published')
        published = [g for g in published if g['id'] != game_id]
        save_games(user_folder, 'published', published)
        
        # 更新状态
        game['status'] = 'draft'
        game['published_at'] = None
        
        # 保存到草稿（如果不存在）
        drafts = load_games(user_folder, 'drafts')
        existing_draft = next((g for g in drafts if g['id'] == game_id), None)
        if existing_draft:
            # 更新现有草稿
            for i, g in enumerate(drafts):
                if g['id'] == game_id:
                    drafts[i] = game
                    break
        else:
            # 添加新草稿
            drafts.append(game)
        save_games(user_folder, 'drafts', drafts)
    else:
        # 更新草稿
        drafts = load_games(user_folder, 'drafts')
        for i, g in enumerate(drafts):
            if g['id'] == game_id:
                drafts[i] = game
                break
        save_games(user_folder, 'drafts', drafts)
    
    return {
        "success": True,
        "message": "游戏更新成功",
        "game": game
    }


# === 发布/撤回游戏 ===

@router.post("/{game_id}/publish")
async def publish_game(game_id: str, current_user: dict = Depends(get_current_user)):
    """
    发布游戏
    """
    user_folder = current_user['folder']
    
    # 从草稿中查找
    drafts = load_games(user_folder, 'drafts')
    game = next((g for g in drafts if g['id'] == game_id), None)
    
    if not game:
        raise HTTPException(
            status_code=404,
            detail="游戏不存在或已发布"
        )
    
    # 确认所有权
    if game['author_id'] != current_user['id']:
        raise HTTPException(
            status_code=403,
            detail="无权发布此游戏"
        )
    
    # 更新状态
    game['status'] = 'published'
    game['published_at'] = datetime.now().isoformat()
    
    # 保存到已发布
    published = load_games(user_folder, 'published')
    
    # 检查是否已存在（去重）
    existing = next((g for g in published if g['id'] == game_id), None)
    if existing:
        # 更新现有记录
        for i, g in enumerate(published):
            if g['id'] == game_id:
                published[i] = game
                break
    else:
        # 添加新记录
        published.append(game)
    
    save_games(user_folder, 'published', published)
    
    # 同时更新草稿中的状态
    for i, g in enumerate(drafts):
        if g['id'] == game_id:
            drafts[i] = game
            break
    save_games(user_folder, 'drafts', drafts)
    
    return {
        "success": True,
        "message": "游戏已发布",
        "game": game
    }


@router.post("/{game_id}/unpublish")
async def unpublish_game(game_id: str, current_user: dict = Depends(get_current_user)):
    """
    撤回游戏（从已发布变回草稿）
    """
    user_folder = current_user['folder']
    
    # 从已发布中查找
    published = load_games(user_folder, 'published')
    game = next((g for g in published if g['id'] == game_id), None)
    
    if not game:
        raise HTTPException(
            status_code=404,
            detail="游戏不存在或未发布"
        )
    
    # 确认所有权
    if game['author_id'] != current_user['id']:
        raise HTTPException(
            status_code=403,
            detail="无权撤回此游戏"
        )
    
    # 从已发布中删除
    published = [g for g in published if g['id'] != game_id]
    save_games(user_folder, 'published', published)
    
    # 更新状态
    game['status'] = 'draft'
    game['published_at'] = None
    
    # 更新草稿中的状态
    drafts = load_games(user_folder, 'drafts')
    for i, g in enumerate(drafts):
        if g['id'] == game_id:
            drafts[i] = game
            break
    save_games(user_folder, 'drafts', drafts)
    
    return {
        "success": True,
        "message": "游戏已撤回到草稿",
        "game": game
    }


# === 删除游戏 ===

@router.delete("/{game_id}")
async def delete_game(game_id: str, current_user: dict = Depends(get_current_user)):
    """
    删除游戏（用户只能删除自己的，管理员可以删除任何游戏）
    """
    # 如果是管理员，可以删除任何游戏
    if current_user['role'] == 'admin':
        # 在所有用户中查找并删除
        for user_dir in USERS_DIR.iterdir():
            if not user_dir.is_dir():
                continue
            
            user_folder = user_dir.name
            
            # 尝试从草稿中删除
            drafts = load_games(user_folder, 'drafts')
            game = next((g for g in drafts if g['id'] == game_id), None)
            
            if game:
                # 删除文件
                game_path = USERS_DIR / user_folder / "games" / Path(game['game_file']).name
                thumb_path = USERS_DIR / user_folder / "images" / Path(game['thumbnail']).name
                
                if game_path.exists():
                    game_path.unlink()
                if thumb_path.exists():
                    thumb_path.unlink()
                
                # 从列表中删除
                drafts = [g for g in drafts if g['id'] != game_id]
                save_games(user_folder, 'drafts', drafts)
                
                # 同时从已发布中删除
                published = load_games(user_folder, 'published')
                published = [g for g in published if g['id'] != game_id]
                save_games(user_folder, 'published', published)
                
                return {
                    "success": True,
                    "message": "游戏已删除"
                }
        
        raise HTTPException(
            status_code=404,
            detail="游戏不存在"
        )
    
    # 普通用户只能删除自己的游戏
    user_folder = current_user['folder']
    
    # 从草稿中查找
    drafts = load_games(user_folder, 'drafts')
    game = next((g for g in drafts if g['id'] == game_id), None)
    
    if not game:
        raise HTTPException(
            status_code=404,
            detail="游戏不存在"
        )
    
    # 确认所有权
    if game['author_id'] != current_user['id']:
        raise HTTPException(
            status_code=403,
            detail="无权删除此游戏"
        )
    
    # 删除文件
    game_path = USERS_DIR / user_folder / "games" / Path(game['game_file']).name
    thumb_path = USERS_DIR / user_folder / "images" / Path(game['thumbnail']).name
    
    if game_path.exists():
        game_path.unlink()
    if thumb_path.exists():
        thumb_path.unlink()
    
    # 从列表中删除
    drafts = [g for g in drafts if g['id'] != game_id]
    save_games(user_folder, 'drafts', drafts)
    
    # 同时从已发布中删除
    published = load_games(user_folder, 'published')
    published = [g for g in published if g['id'] != game_id]
    save_games(user_folder, 'published', published)
    
    return {
        "success": True,
        "message": "游戏已删除"
    }


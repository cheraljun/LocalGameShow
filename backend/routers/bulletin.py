"""
通告管理路由（Bulletin - 文章列表形式）
与公告（Announcement - 弹窗）分离
"""
from fastapi import APIRouter, HTTPException, Depends
from pathlib import Path
import json
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

from backend.routers.auth import get_current_admin

router = APIRouter()

# 数据目录
DATA_DIR = Path(__file__).parent.parent.parent / "data"
SYSTEM_DIR = DATA_DIR / "system"
DRAFTS_FILE = SYSTEM_DIR / "bulletin_drafts.json"
PUBLISHED_FILE = SYSTEM_DIR / "bulletin_published.json"


# === Schema ===

class BulletinCreate(BaseModel):
    """创建通告"""
    title: str
    content: str


class BulletinUpdate(BaseModel):
    """更新通告"""
    title: Optional[str] = None
    content: Optional[str] = None


# === 辅助函数 ===

def load_drafts() -> List[dict]:
    """加载草稿通告"""
    if not DRAFTS_FILE.exists():
        return []
    with open(DRAFTS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data.get('posts', [])


def save_drafts(posts: List[dict]):
    """保存草稿通告"""
    DRAFTS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(DRAFTS_FILE, 'w', encoding='utf-8') as f:
        json.dump({'posts': posts}, f, ensure_ascii=False, indent=2)


def load_published() -> List[dict]:
    """加载已发布通告"""
    if not PUBLISHED_FILE.exists():
        return []
    with open(PUBLISHED_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data.get('posts', [])


def save_published(posts: List[dict]):
    """保存已发布通告"""
    PUBLISHED_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(PUBLISHED_FILE, 'w', encoding='utf-8') as f:
        json.dump({'posts': posts}, f, ensure_ascii=False, indent=2)


# === 公开接口 ===

@router.get("/list")
async def get_published_bulletins():
    """
    获取已发布的通告列表（公开访问）
    """
    posts = load_published()
    
    # 按发布时间倒序排序
    posts.sort(key=lambda x: x.get('published_at', ''), reverse=True)
    
    return {
        "success": True,
        "bulletins": posts
    }


# === 管理员接口 ===

@router.get("/admin/list")
async def get_all_bulletins(current_admin: dict = Depends(get_current_admin)):
    """
    获取所有通告（草稿 + 已发布）- 仅管理员
    """
    drafts = load_drafts()
    published = load_published()
    
    # 标记状态
    all_posts = []
    
    for post in drafts:
        post['status'] = 'draft'
        all_posts.append(post)
    
    for post in published:
        post['status'] = 'published'
        # 如果草稿中没有，添加到列表
        if not any(p['id'] == post['id'] for p in all_posts):
            all_posts.append(post)
    
    # 按创建时间倒序
    all_posts.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    
    return {
        "success": True,
        "bulletins": all_posts
    }


@router.post("/admin/create")
async def create_bulletin(
    request: BulletinCreate,
    current_admin: dict = Depends(get_current_admin)
):
    """
    创建通告（草稿）- 仅管理员
    """
    drafts = load_drafts()
    
    # 生成ID
    new_id = datetime.now().strftime("%Y%m%d%H%M%S")
    
    # 创建通告对象
    bulletin = {
        "id": new_id,
        "title": request.title,
        "content": request.content,
        "status": "draft",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "published_at": None
    }
    
    drafts.append(bulletin)
    save_drafts(drafts)
    
    return {
        "success": True,
        "message": "通告创建成功（草稿状态）",
        "bulletin": bulletin
    }


@router.put("/admin/{bulletin_id}")
async def update_bulletin(
    bulletin_id: str,
    request: BulletinUpdate,
    current_admin: dict = Depends(get_current_admin)
):
    """
    更新通告 - 仅管理员
    """
    drafts = load_drafts()
    
    # 查找通告
    bulletin = None
    for i, post in enumerate(drafts):
        if post['id'] == bulletin_id:
            bulletin = post
            break
    
    if not bulletin:
        raise HTTPException(
            status_code=404,
            detail="通告不存在"
        )
    
    # 更新字段
    if request.title is not None:
        bulletin['title'] = request.title
    if request.content is not None:
        bulletin['content'] = request.content
    
    bulletin['updated_at'] = datetime.now().isoformat()
    
    # 如果是已发布的，自动撤回到草稿
    published = load_published()
    published = [p for p in published if p['id'] != bulletin_id]
    save_published(published)
    
    bulletin['status'] = 'draft'
    bulletin['published_at'] = None
    
    save_drafts(drafts)
    
    return {
        "success": True,
        "message": "通告更新成功",
        "bulletin": bulletin
    }


@router.post("/admin/{bulletin_id}/publish")
async def publish_bulletin(
    bulletin_id: str,
    current_admin: dict = Depends(get_current_admin)
):
    """
    发布通告 - 仅管理员
    """
    drafts = load_drafts()
    
    # 查找通告
    bulletin = None
    for post in drafts:
        if post['id'] == bulletin_id:
            bulletin = post
            break
    
    if not bulletin:
        raise HTTPException(
            status_code=404,
            detail="通告不存在"
        )
    
    # 更新状态
    bulletin['status'] = 'published'
    bulletin['published_at'] = datetime.now().isoformat()
    
    # 保存到已发布
    published = load_published()
    
    # 检查是否已存在
    existing = None
    for i, p in enumerate(published):
        if p['id'] == bulletin_id:
            existing = i
            break
    
    if existing is not None:
        published[existing] = bulletin
    else:
        published.append(bulletin)
    
    save_published(published)
    
    # 同时更新草稿
    save_drafts(drafts)
    
    return {
        "success": True,
        "message": "通告已发布",
        "bulletin": bulletin
    }


@router.post("/admin/{bulletin_id}/unpublish")
async def unpublish_bulletin(
    bulletin_id: str,
    current_admin: dict = Depends(get_current_admin)
):
    """
    撤回通告 - 仅管理员
    """
    published = load_published()
    drafts = load_drafts()
    
    # 查找通告
    bulletin = None
    for post in drafts:
        if post['id'] == bulletin_id:
            bulletin = post
            break
    
    if not bulletin:
        raise HTTPException(
            status_code=404,
            detail="通告不存在"
        )
    
    # 从已发布中删除
    published = [p for p in published if p['id'] != bulletin_id]
    save_published(published)
    
    # 更新状态
    bulletin['status'] = 'draft'
    bulletin['published_at'] = None
    
    save_drafts(drafts)
    
    return {
        "success": True,
        "message": "通告已撤回",
        "bulletin": bulletin
    }


@router.delete("/admin/{bulletin_id}")
async def delete_bulletin(
    bulletin_id: str,
    current_admin: dict = Depends(get_current_admin)
):
    """
    删除通告 - 仅管理员
    """
    drafts = load_drafts()
    published = load_published()
    
    # 从两个列表中删除
    drafts = [p for p in drafts if p['id'] != bulletin_id]
    published = [p for p in published if p['id'] != bulletin_id]
    
    save_drafts(drafts)
    save_published(published)
    
    return {
        "success": True,
        "message": "通告已删除"
    }


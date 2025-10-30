"""
搜索路由 - 搜索已发布的游戏
"""
from fastapi import APIRouter, Query
from typing import List, Dict, Any
import json
from pathlib import Path

router = APIRouter()

# 数据目录
DATA_DIR = Path(__file__).parent.parent.parent / "data"
USERS_DIR = DATA_DIR / "users"


@router.get("/search")
async def search_games(q: str = Query(..., min_length=1)):
    """
    全局搜索 - 搜索所有已发布的游戏
    :param q: 搜索关键词
    """
    keyword = q.lower()
    results = []
    
    if not USERS_DIR.exists():
        return {
            'games': [],
            'total': 0
        }
    
    # 遍历所有用户文件夹
    for user_dir in USERS_DIR.iterdir():
        if not user_dir.is_dir():
            continue
        
        # 读取该用户的已发布游戏
        published_file = user_dir / "published" / "game.json"
        if not published_file.exists():
            continue
        
        try:
            with open(published_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                games = data.get('posts', [])
                
                # 搜索游戏
                for game in games:
                    if game.get('status') != 'published':
                        continue
                    
                    title = (game.get('title') or '').lower()
                    content = (game.get('content') or '').lower()
                    author = (game.get('author_name') or '').lower()
                    
                    # 匹配标题、介绍或作者
                    if keyword in title or keyword in content or keyword in author:
                        results.append(game)
        
        except Exception as e:
            print(f"搜索用户 {user_dir.name} 的游戏失败: {e}")
            continue
    
    # 按发布时间倒序
    results.sort(key=lambda x: x.get('published_at', ''), reverse=True)
    
    return {
        'games': results,
        'total': len(results)
    }

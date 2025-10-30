"""
书籍内容滚动路由
"""
from fastapi import APIRouter, HTTPException
from pathlib import Path
import os

router = APIRouter()

# 书籍文件夹路径（根目录）
BOOK_DIR = Path(__file__).parent.parent.parent / "book"

@router.get("/content")
async def get_book_content():
    """
    获取书籍内容用于滚动显示
    只返回前100行内容，避免页面卡顿
    """
    if not BOOK_DIR.exists():
        return {"content": ""}
    
    content_lines = []
    max_lines = 100  # 只读取前100行
    
    # 遍历 book 目录下的所有 txt 文件
    for file_path in BOOK_DIR.glob("*.txt"):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line:  # 只保留非空行
                        content_lines.append(line)
                        if len(content_lines) >= max_lines:
                            break
            
            if len(content_lines) >= max_lines:
                break
                
        except Exception as e:
            print(f"读取文件 {file_path} 失败: {e}")
            continue
    
    # 返回合并后的内容，用空格连接
    return {
        "content": " ".join(content_lines) if content_lines else "",
        "total_lines": len(content_lines)
    }

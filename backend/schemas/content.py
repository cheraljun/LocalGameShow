"""
内容相关的数据模式
"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ContentBase(BaseModel):
    """内容基础模式"""
    title: Optional[str] = None
    content: str
    images: List[str] = []
    links: List[dict] = []
    status: str = "published"  # published, draft

class ContentCreate(ContentBase):
    """创建内容"""
    pass

class ContentUpdate(ContentBase):
    """更新内容"""
    pass

class ContentResponse(ContentBase):
    """内容响应"""
    id: str
    type: str
    created_at: str
    updated_at: str
    author: str = "Admin"

    class Config:
        from_attributes = True

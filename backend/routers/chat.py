"""
聊天留言路由
- 游客可以查看留言
- 登录用户才能发送留言
- 管理员可以删除任何留言
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from pathlib import Path
import json
import uuid
from datetime import datetime
from pydantic import BaseModel

from backend.routers.auth import get_current_user, get_current_admin

router = APIRouter()

# 聊天消息文件路径（使用新的 data 目录）
DATA_DIR = Path(__file__).parent.parent.parent / "data"
CHAT_DIR = DATA_DIR / "chat"
CHAT_FILE = CHAT_DIR / "messages.json"


class ChatMessage(BaseModel):
    """发送消息请求"""
    text: str


class ChatResponse(BaseModel):
    """聊天响应模型"""
    messages: List[Dict[str, Any]]


def read_messages() -> List[Dict[str, Any]]:
    """读取聊天消息"""
    if not CHAT_FILE.exists():
        return []
    
    with open(CHAT_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
        return data.get('messages', [])


def write_messages(messages: List[Dict[str, Any]]):
    """写入聊天消息"""
    CHAT_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    with open(CHAT_FILE, 'w', encoding='utf-8') as f:
        json.dump({'messages': messages}, f, ensure_ascii=False, indent=2)


# === 公开接口 ===

@router.get("/messages", response_model=ChatResponse)
async def get_messages(limit: int = 100):
    """
    获取聊天消息（公开访问）
    """
    try:
        messages = read_messages()
        
        # 限制返回数量
        if limit > 0:
            messages = messages[-limit:]
        
        return {"messages": messages}
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"读取消息失败: {str(e)}"
        )


# === 需要登录的接口 ===

@router.post("/messages")
async def send_message(
    message: ChatMessage,
    current_user: dict = Depends(get_current_user)
):
    """
    发送新消息（需要登录）
    """
    try:
        # 读取现有消息
        messages = read_messages()
        
        # 创建新消息（包含用户信息）
        new_message = {
            "id": str(uuid.uuid4()),
            "user_id": current_user['id'],
            "username": current_user['username'],
            "email": current_user['email'],
            "text": message.text,
            "timestamp": datetime.now().isoformat()
        }
        
        # 添加到消息列表
        messages.append(new_message)
        
        # 只保留最近200条消息
        if len(messages) > 200:
            messages = messages[-200:]
        
        # 写入文件
        write_messages(messages)
        
        return {
            "success": True,
            "message": new_message
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"发送消息失败: {str(e)}"
        )


# === 管理员接口 ===

@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: str,
    current_admin: dict = Depends(get_current_admin)
):
    """
    删除单条消息（仅管理员）
    """
    try:
        messages = read_messages()
        
        # 查找要删除的消息
        message_to_delete = None
        for msg in messages:
            if msg.get('id') == message_id:
                message_to_delete = msg
                break
        
        if not message_to_delete:
            raise HTTPException(
                status_code=404,
                detail="消息不存在"
            )
        
        # 删除消息
        messages = [msg for msg in messages if msg.get('id') != message_id]
        write_messages(messages)
        
        return {
            "success": True,
            "message": "消息已删除"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"删除消息失败: {str(e)}"
        )


@router.delete("/messages")
async def clear_all_messages(current_admin: dict = Depends(get_current_admin)):
    """
    清空所有消息（仅管理员）
    """
    try:
        write_messages([])
        return {
            "success": True,
            "message": "所有消息已清空"
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"清空消息失败: {str(e)}"
        )

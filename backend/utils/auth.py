"""
JWT 认证工具
"""
import json
from datetime import datetime, timedelta
from typing import Optional, Dict
from jose import JWTError, jwt
from pathlib import Path

# 配置文件路径（根目录）
CONFIG_PATH = Path(__file__).parent.parent.parent / "config.json"

def ensure_config():
    """确保配置文件存在"""
    if not CONFIG_PATH.exists():
        # 创建默认配置
        default_config = {
            "admin_email": "1773384983@qq.com",
            "smtp_host": "smtp.qq.com",
            "smtp_port": 465,
            "smtp_password": "",
            "smtp_use_ssl": True,
            "stream_url": "https://n10as.radiocult.fm/stream",
            "stream_name": "RadioCult.fm",
            "jwt_secret": "your-secret-key-change-in-production",
            "jwt_algorithm": "HS256",
            "jwt_expiration_days": 7
        }
        
        with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
            json.dump(default_config, f, ensure_ascii=False, indent=2)

def load_config():
    """加载配置文件"""
    ensure_config()
    with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def verify_admin(username: str, password: str) -> bool:
    """验证管理员账号密码（已废弃，管理员只能用邮箱验证码登录）"""
    return False

def create_access_token(data: Dict, expires_delta: Optional[timedelta] = None) -> str:
    """创建 JWT token"""
    config = load_config()
    
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=config.get('jwt_expiration_days', 7))
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, 
        config.get('jwt_secret'), 
        algorithm=config.get('jwt_algorithm', 'HS256')
    )
    return encoded_jwt

def verify_token(token: str) -> Optional[Dict]:
    """验证 JWT token"""
    try:
        config = load_config()
        
        payload = jwt.decode(
            token, 
            config.get('jwt_secret'), 
            algorithms=[config.get('jwt_algorithm', 'HS256')]
        )
        return payload
    except JWTError:
        return None

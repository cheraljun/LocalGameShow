"""
认证相关的数据模式
"""
from pydantic import BaseModel, EmailStr
from typing import Optional


# === 注册相关 ===

class SendRegistrationCodeRequest(BaseModel):
    """发送注册验证码请求"""
    email: EmailStr


class RegisterRequest(BaseModel):
    """注册请求"""
    email: EmailStr
    code: str
    password: str
    username: Optional[str] = None


# === 登录相关 ===

class LoginPasswordRequest(BaseModel):
    """邮箱+密码登录请求"""
    email: EmailStr
    password: str


class SendLoginCodeRequest(BaseModel):
    """发送登录验证码请求"""
    email: EmailStr


class LoginCodeRequest(BaseModel):
    """邮箱+验证码登录请求"""
    email: EmailStr
    code: str


class ChangePasswordRequest(BaseModel):
    """修改密码请求"""
    email: EmailStr
    code: str
    new_password: str


# === Token相关 ===

class TokenResponse(BaseModel):
    """Token响应"""
    access_token: str
    token_type: str = "bearer"
    user: dict


class TokenData(BaseModel):
    """Token数据"""
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None


# === 用户信息 ===

class UserInfo(BaseModel):
    """用户信息"""
    id: str
    email: str
    username: str
    role: str
    created_at: str
    last_login: str

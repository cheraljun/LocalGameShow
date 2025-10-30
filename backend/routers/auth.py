"""
用户认证路由
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.schemas.auth import (
    SendRegistrationCodeRequest,
    RegisterRequest,
    LoginPasswordRequest,
    SendLoginCodeRequest,
    LoginCodeRequest,
    ChangePasswordRequest,
    TokenResponse,
    UserInfo
)
from backend.utils.auth import create_access_token, verify_token
from backend.utils.user_manager import (
    get_user_by_email,
    create_user,
    update_last_login,
    update_user_password,
    hash_password,
    verify_password,
    add_pending_registration,
    verify_registration_code,
    add_login_code,
    verify_login_code,
    check_email_rate_limit
)
from backend.services.email_service import (
    send_registration_code,
    send_login_code,
    generate_verification_code
)
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
security = HTTPBearer()


# === 注册流程 ===

@router.post("/register/send-code")
async def send_registration_verification_code(request: SendRegistrationCodeRequest):
    """
    发送注册验证码
    """
    email = request.email
    
    # 检查邮箱是否已注册
    existing_user = get_user_by_email(email)
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="该邮箱已注册"
        )
    
    # 检查邮件发送限流（多层防护）
    passed, error_msg = check_email_rate_limit(email)
    if not passed:
        raise HTTPException(
            status_code=429,
            detail=error_msg
        )
    
    # 生成验证码
    code = generate_verification_code()
    
    # 保存验证码
    add_pending_registration(email, code)
    
    # 发送邮件
    success = await send_registration_code(email, code)
    
    if not success:
        raise HTTPException(
            status_code=500,
            detail="邮件发送失败，请检查邮箱地址或稍后重试"
        )
    
    return {
        "success": True,
        "message": "验证码已发送，请查收邮件（5分钟内有效）"
    }


@router.post("/register")
async def register(request: RegisterRequest):
    """
    注册新用户
    """
    email = request.email
    code = request.code
    password = request.password
    username = request.username
    
    # 检查邮箱是否已注册
    existing_user = get_user_by_email(email)
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="该邮箱已注册"
        )
    
    # 验证验证码
    if not verify_registration_code(email, code):
        raise HTTPException(
            status_code=400,
            detail="验证码错误或已过期"
        )
    
    # 检查是否是管理员邮箱
    from backend.utils.user_manager import get_admin_email
    admin_email = get_admin_email()
    is_admin = (email == admin_email)
    
    # 如果是管理员，不需要密码（只能验证码登录）
    if is_admin:
        password = ""  # 管理员不设置密码
    else:
        # 普通用户验证密码强度（至少8位）
        if not password or len(password) < 8:
            raise HTTPException(
                status_code=400,
                detail="密码至少需要8位字符"
            )
    
    # 创建用户
    try:
        new_user = create_user(email, password, username)
        
        # 生成 JWT Token
        token_data = {
            "sub": new_user['id'],
            "email": new_user['email'],
            "role": new_user['role']
        }
        access_token = create_access_token(token_data, timedelta(days=7))
        
        return TokenResponse(
            access_token=access_token,
            user={
                "id": new_user['id'],
                "email": new_user['email'],
                "username": new_user['username'],
                "role": new_user['role']
            }
        )
    
    except Exception as e:
        logger.error(f"注册失败: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="注册失败，请稍后重试"
        )


# === 登录流程 - 方式A: 邮箱+密码 ===

@router.post("/login/password", response_model=TokenResponse)
async def login_with_password(request: LoginPasswordRequest):
    """
    邮箱+密码登录（仅普通用户）
    """
    email = request.email
    password = request.password
    
    # 检查是否是管理员邮箱
    from backend.utils.user_manager import get_admin_email
    admin_email = get_admin_email()
    
    if email == admin_email:
        raise HTTPException(
            status_code=403,
            detail="管理员只能使用验证码登录"
        )
    
    # 查找用户
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="邮箱或密码错误"
        )
    
    # 验证密码
    if not user['password_hash'] or not verify_password(password, user['password_hash']):
        raise HTTPException(
            status_code=401,
            detail="邮箱或密码错误"
        )
    
    # 检查用户状态
    if not user.get('is_active', True):
        raise HTTPException(
            status_code=403,
            detail="账户已被禁用"
        )
    
    # 更新最后登录时间
    update_last_login(user['id'])
    
    # 生成 JWT Token
    token_data = {
        "sub": user['id'],
        "email": user['email'],
        "role": user['role']
    }
    access_token = create_access_token(token_data, timedelta(days=7))
    
    return TokenResponse(
        access_token=access_token,
        user={
            "id": user['id'],
            "email": user['email'],
            "username": user['username'],
            "role": user['role']
        }
    )


# === 登录流程 - 方式B: 邮箱+验证码 ===

@router.post("/login/send-code")
async def send_login_verification_code(request: SendLoginCodeRequest):
    """
    发送登录验证码
    """
    email = request.email
    
    # 检查是否是管理员邮箱
    from backend.utils.user_manager import get_admin_email
    admin_email = get_admin_email()
    
    # 如果不是管理员邮箱，检查用户是否存在
    if email != admin_email:
        user = get_user_by_email(email)
        if not user:
            raise HTTPException(
                status_code=404,
                detail="该邮箱未注册"
            )
    
    # 检查邮件发送限流（多层防护）
    passed, error_msg = check_email_rate_limit(email)
    if not passed:
        raise HTTPException(
            status_code=429,
            detail=error_msg
        )
    
    # 生成验证码
    code = generate_verification_code()
    
    # 保存验证码
    add_login_code(email, code)
    
    # 发送邮件
    success = await send_login_code(email, code)
    
    if not success:
        raise HTTPException(
            status_code=500,
            detail="邮件发送失败，请稍后重试"
        )
    
    return {
        "success": True,
        "message": "验证码已发送，请查收邮件（5分钟内有效）"
    }


@router.post("/login/code", response_model=TokenResponse)
async def login_with_code(request: LoginCodeRequest):
    """
    邮箱+验证码登录
    """
    email = request.email
    code = request.code
    
    # 验证验证码（必须先验证验证码）
    if not verify_login_code(email, code):
        raise HTTPException(
            status_code=400,
            detail="验证码错误或已过期"
        )
    
    # 检查是否是管理员邮箱
    from backend.utils.user_manager import get_admin_email
    admin_email = get_admin_email()
    
    # 查找用户
    user = get_user_by_email(email)
    
    # 如果是管理员邮箱但没有用户记录，自动创建管理员账户
    if not user and email == admin_email:
        logger.info(f"管理员首次登录，创建账户: {email}")
        user = create_user(
            email=email,
            password="",  # 管理员不使用密码登录
            username="管理员"
        )
    
    # 如果还是没有用户，说明是普通用户未注册
    if not user:
        raise HTTPException(
            status_code=404,
            detail="该邮箱未注册"
        )
    
    # 检查用户状态
    if not user.get('is_active', True):
        raise HTTPException(
            status_code=403,
            detail="账户已被禁用"
        )
    
    # 更新最后登录时间
    update_last_login(user['id'])
    
    # 生成 JWT Token
    token_data = {
        "sub": user['id'],
        "email": user['email'],
        "role": user['role']
    }
    access_token = create_access_token(token_data, timedelta(days=7))
    
    return TokenResponse(
        access_token=access_token,
        user={
            "id": user['id'],
            "email": user['email'],
            "username": user['username'],
            "role": user['role']
        }
    )


# === Token 验证 ===

@router.get("/verify")
async def verify_user_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    验证 Token 是否有效
    """
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Token 无效或已过期"
        )
    
    # 获取用户信息
    user_id = payload.get("sub")
    user = get_user_by_email(payload.get("email"))
    
    if not user:
        raise HTTPException(
            status_code=401,
            detail="用户不存在"
        )
    
    return {
        "valid": True,
        "user": {
            "id": user['id'],
            "email": user['email'],
            "username": user['username'],
            "role": user['role']
        }
    }


# === 依赖注入：获取当前用户 ===

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    获取当前登录用户（依赖注入）
    """
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="未授权：请先登录"
        )
    
    user = get_user_by_email(payload.get("email"))
    
    if not user:
        raise HTTPException(
            status_code=401,
            detail="用户不存在"
        )
    
    if not user.get('is_active', True):
        raise HTTPException(
            status_code=403,
            detail="账户已被禁用"
        )
    
    return user


def get_current_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """
    获取当前管理员（依赖注入）
    """
    if current_user['role'] != 'admin':
        raise HTTPException(
            status_code=403,
            detail="权限不足：需要管理员权限"
        )
    
    return current_user


# === 修改密码 ===

@router.post("/change-password")
async def change_password(request: ChangePasswordRequest):
    """
    修改密码（需要验证码验证）
    注意：管理员不能设置密码
    """
    email = request.email
    code = request.code
    new_password = request.new_password
    
    # 检查是否是管理员
    from backend.utils.user_manager import get_admin_email
    admin_email = get_admin_email()
    
    if email == admin_email:
        raise HTTPException(
            status_code=403,
            detail="管理员不能设置密码，只能使用验证码登录"
        )
    
    # 查找用户
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="该邮箱未注册"
        )
    
    # 验证登录验证码（复用登录验证码）
    if not verify_login_code(email, code):
        raise HTTPException(
            status_code=400,
            detail="验证码错误或已过期"
        )
    
    # 验证新密码强度
    if len(new_password) < 8:
        raise HTTPException(
            status_code=400,
            detail="密码至少需要8位字符"
        )
    
    # 更新密码
    try:
        update_user_password(email, new_password)
        return {
            "success": True,
            "message": "密码修改成功"
        }
    except ValueError as e:
        raise HTTPException(
            status_code=403,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"修改密码失败: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="修改密码失败，请稍后重试"
        )


# === 修改昵称 ===

@router.put("/change-username")
async def change_username(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    修改用户昵称
    """
    new_username = request.get('username', '').strip()
    
    if not new_username:
        raise HTTPException(
            status_code=400,
            detail="昵称不能为空"
        )
    
    if len(new_username) < 2:
        raise HTTPException(
            status_code=400,
            detail="昵称至少需要2个字符"
        )
    
    try:
        from backend.utils.user_manager import update_username
        update_username(current_user['id'], new_username)
        
        # 返回更新后的用户信息
        updated_user = get_user_by_email(current_user['email'])
        
        return {
            "success": True,
            "message": "昵称修改成功",
            "user": {
                "id": updated_user['id'],
                "email": updated_user['email'],
                "username": updated_user['username'],
                "role": updated_user['role']
            }
        }
    except Exception as e:
        logger.error(f"修改昵称失败: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="修改昵称失败，请稍后重试"
        )


# === 删除账户 ===

@router.delete("/delete-account")
async def delete_account(current_user: dict = Depends(get_current_user)):
    """
    删除用户账户（包括所有相关数据）
    """
    try:
        from backend.utils.user_manager import delete_user_account
        delete_user_account(current_user['id'])
        
        return {
            "success": True,
            "message": "账户已删除"
        }
    except Exception as e:
        logger.error(f"删除账户失败: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="删除账户失败，请稍后重试"
        )



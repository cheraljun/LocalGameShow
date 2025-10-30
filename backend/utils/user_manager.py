"""
用户管理工具
"""
import json
import uuid
import hashlib
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict, List

# 数据文件路径
DATA_DIR = Path(__file__).parent.parent.parent / "data"
SYSTEM_DIR = DATA_DIR / "system"
USERS_DIR = DATA_DIR / "users"
CONFIG_PATH = Path(__file__).parent.parent.parent / "config.json"

USERS_FILE = SYSTEM_DIR / "users.json"
PENDING_REG_FILE = SYSTEM_DIR / "pending_registrations.json"
LOGIN_CODES_FILE = SYSTEM_DIR / "login_codes.json"
RATE_LIMITS_FILE = SYSTEM_DIR / "rate_limits.json"


def get_admin_email() -> str:
    """获取管理员邮箱"""
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            config = json.load(f)
        return config.get('admin_email', '')
    return ''


def hash_password(password: str) -> str:
    """密码哈希（使用 SHA256）"""
    if not password:
        return ""
    return hashlib.sha256(password.encode('utf-8')).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    if not plain_password or not hashed_password:
        return False
    return hash_password(plain_password) == hashed_password


def load_users() -> List[Dict]:
    """加载用户列表"""
    if not USERS_FILE.exists():
        return []
    with open(USERS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data.get('users', [])


def save_users(users: List[Dict]):
    """保存用户列表"""
    USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump({'users': users}, f, ensure_ascii=False, indent=2)


def get_user_by_email(email: str) -> Optional[Dict]:
    """通过邮箱获取用户"""
    users = load_users()
    for user in users:
        if user['email'] == email:
            return user
    return None


def get_user_by_id(user_id: str) -> Optional[Dict]:
    """通过ID获取用户"""
    users = load_users()
    for user in users:
        if user['id'] == user_id:
            return user
    return None


def create_user(email: str, password: str, username: Optional[str] = None) -> Dict:
    """
    创建新用户（管理员和普通用户逻辑相同）
    
    Returns:
        Dict: 新用户信息
    """
    users = load_users()
    
    # 判断是否是管理员邮箱
    admin_email = get_admin_email()
    is_admin = (email == admin_email)
    
    # 生成用户ID（递增）
    max_id = 0
    for user in users:
        try:
            user_id = int(user['id'])
            if user_id > max_id:
                max_id = user_id
        except:
            pass
    
    new_id = str(max_id + 1).zfill(3)  # 001, 002, ...
    
    # 生成用户名（如果没有提供）
    if not username:
        username = f"用户{new_id}"
    
    # 生成用户文件夹名（使用UUID随机字符串）
    folder = uuid.uuid4().hex
    
    # 创建用户对象
    new_user = {
        "id": new_id,
        "email": email,
        "username": username,
        "password_hash": hash_password(password) if password else "",
        "role": "admin" if is_admin else "user",  # 根据邮箱判断角色
        "folder": folder,
        "email_verified": True,
        "created_at": datetime.now().isoformat(),
        "last_login": datetime.now().isoformat(),
        "is_active": True
    }
    
    # 保存到用户列表
    users.append(new_user)
    save_users(users)
    
    # 创建用户文件夹结构
    user_dir = USERS_DIR / folder
    user_dir.mkdir(parents=True, exist_ok=True)
    (user_dir / "drafts").mkdir(exist_ok=True)
    (user_dir / "published").mkdir(exist_ok=True)
    (user_dir / "games").mkdir(exist_ok=True)
    (user_dir / "images").mkdir(exist_ok=True)
    
    # 创建用户资料文件
    profile = {
        "id": new_id,
        "email": email,
        "username": username,
        "role": "user",
        "folder": folder,
        "email_verified": True,
        "created_at": new_user["created_at"],
        "last_login": new_user["last_login"],
        "is_active": True
    }
    
    with open(user_dir / "profile.json", 'w', encoding='utf-8') as f:
        json.dump(profile, f, ensure_ascii=False, indent=2)
    
    # 创建空的游戏文件
    for subdir in ["drafts", "published"]:
        game_file = user_dir / subdir / "game.json"
        with open(game_file, 'w', encoding='utf-8') as f:
            json.dump({"posts": []}, f, ensure_ascii=False, indent=2)
    
    return new_user


def update_last_login(user_id: str):
    """更新最后登录时间"""
    users = load_users()
    for user in users:
        if user['id'] == user_id:
            user['last_login'] = datetime.now().isoformat()
            break
    save_users(users)


def update_user_password(email: str, new_password: str):
    """更新用户密码"""
    users = load_users()
    
    # 检查是否是管理员
    admin_email = get_admin_email()
    if email == admin_email:
        raise ValueError("管理员不能设置密码，只能使用验证码登录")
    
    for user in users:
        if user['email'] == email:
            user['password_hash'] = hash_password(new_password)
            break
    
    save_users(users)


# === 注册验证码管理 ===

def load_pending_registrations() -> List[Dict]:
    """加载待验证注册"""
    if not PENDING_REG_FILE.exists():
        return []
    with open(PENDING_REG_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data.get('registrations', [])


def save_pending_registrations(registrations: List[Dict]):
    """保存待验证注册"""
    PENDING_REG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(PENDING_REG_FILE, 'w', encoding='utf-8') as f:
        json.dump({'registrations': registrations}, f, ensure_ascii=False, indent=2)


def add_pending_registration(email: str, code: str):
    """添加待验证注册"""
    registrations = load_pending_registrations()
    
    # 删除该邮箱的旧验证码
    registrations = [r for r in registrations if r['email'] != email]
    
    # 添加新验证码（5分钟有效）
    registrations.append({
        "email": email,
        "code": code,
        "created_at": datetime.now().isoformat(),
        "expires_at": (datetime.now() + timedelta(minutes=5)).isoformat(),
        "attempts": 0
    })
    
    save_pending_registrations(registrations)


def verify_registration_code(email: str, code: str) -> bool:
    """验证注册验证码"""
    registrations = load_pending_registrations()
    
    for reg in registrations:
        if reg['email'] == email:
            # 检查是否过期
            if datetime.fromisoformat(reg['expires_at']) < datetime.now():
                return False
            
            # 检查尝试次数
            if reg['attempts'] >= 3:
                return False
            
            # 验证验证码
            if reg['code'] == code:
                # 验证成功，删除该记录
                registrations = [r for r in registrations if r['email'] != email]
                save_pending_registrations(registrations)
                return True
            else:
                # 验证失败，增加尝试次数
                reg['attempts'] += 1
                save_pending_registrations(registrations)
                return False
    
    return False


# === 登录验证码管理 ===

def load_login_codes() -> List[Dict]:
    """加载登录验证码"""
    if not LOGIN_CODES_FILE.exists():
        return []
    with open(LOGIN_CODES_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data.get('codes', [])


def save_login_codes(codes: List[Dict]):
    """保存登录验证码"""
    LOGIN_CODES_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(LOGIN_CODES_FILE, 'w', encoding='utf-8') as f:
        json.dump({'codes': codes}, f, ensure_ascii=False, indent=2)


def add_login_code(email: str, code: str):
    """添加登录验证码"""
    codes = load_login_codes()
    
    # 删除该邮箱的旧验证码
    codes = [c for c in codes if c['email'] != email]
    
    # 添加新验证码
    codes.append({
        "email": email,
        "code": code,
        "created_at": datetime.now().isoformat(),
        "expires_at": (datetime.now() + timedelta(minutes=5)).isoformat(),
        "attempts": 0
    })
    
    save_login_codes(codes)


def verify_login_code(email: str, code: str) -> bool:
    """验证登录验证码"""
    codes = load_login_codes()
    
    for login_code in codes:
        if login_code['email'] == email:
            # 检查是否过期
            if datetime.fromisoformat(login_code['expires_at']) < datetime.now():
                return False
            
            # 检查尝试次数
            if login_code['attempts'] >= 3:
                return False
            
            # 验证验证码
            if login_code['code'] == code:
                # 验证成功，删除该记录
                codes = [c for c in codes if c['email'] != email]
                save_login_codes(codes)
                return True
            else:
                # 验证失败，增加尝试次数
                login_code['attempts'] += 1
                save_login_codes(codes)
                return False
    
    return False


# === 限流管理 ===

def load_rate_limits() -> List[Dict]:
    """加载限流记录"""
    if not RATE_LIMITS_FILE.exists():
        return []
    with open(RATE_LIMITS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data.get('limits', [])


def save_rate_limits(limits: List[Dict]):
    """保存限流记录"""
    RATE_LIMITS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(RATE_LIMITS_FILE, 'w', encoding='utf-8') as f:
        json.dump({'limits': limits}, f, ensure_ascii=False, indent=2)


def check_rate_limit(key: str, max_attempts: int, window_minutes: int) -> bool:
    """
    检查限流
    
    Args:
        key: 限流键（如邮箱或IP）
        max_attempts: 最大尝试次数
        window_minutes: 时间窗口（分钟）
    
    Returns:
        bool: True表示未超限，False表示已超限
    """
    limits = load_rate_limits()
    
    # 清理过期记录
    now = datetime.now()
    limits = [
        l for l in limits
        if datetime.fromisoformat(l['expires_at']) > now
    ]
    
    # 查找该键的记录
    for limit in limits:
        if limit['key'] == key:
            if limit['count'] >= max_attempts:
                return False
            else:
                # 增加计数
                limit['count'] += 1
                save_rate_limits(limits)
                return True
    
    # 新建记录
    limits.append({
        "key": key,
        "count": 1,
        "expires_at": (now + timedelta(minutes=window_minutes)).isoformat()
    })
    save_rate_limits(limits)
    return True


def check_email_rate_limit(email: str) -> tuple[bool, str]:
    """
    检查邮件发送限流（多层防护）
    
    层1：每分钟最多1次（防止快速点击）
    层2：每小时最多3次（防止短期滥用）
    层3：每天最多10次（防止长期滥用）
    层4：全局每天最多200封（保护邮箱服务）
    
    Args:
        email: 邮箱地址
    
    Returns:
        tuple[bool, str]: (是否通过, 错误信息)
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # 层1：每分钟频率限制
    if not check_rate_limit(f"email_1min:{email}", 1, 1):
        logger.warning(f"邮件发送被限流（1分钟）: {email}")
        return False, "发送过于频繁，请1分钟后再试"
    
    # 层2：每小时限制
    if not check_rate_limit(f"email_1h:{email}", 3, 60):
        logger.warning(f"邮件发送被限流（1小时）: {email}")
        return False, "发送次数过多，请1小时后再试"
    
    # 层3：每天限制
    if not check_rate_limit(f"email_1d:{email}", 10, 1440):
        logger.warning(f"邮件发送被限流（1天）: {email}")
        return False, "今日发送次数已达上限，请明天再试"
    
    # 层4：全局每日限制
    if not check_rate_limit("email_global_1d", 200, 1440):
        logger.error(f"系统邮件发送量达到每日上限，请求来自: {email}")
        return False, "系统邮件发送量已达今日上限，请明天再试"
    
    return True, ""


def update_username(user_id: str, new_username: str):
    """更新用户昵称"""
    users = load_users()
    
    for user in users:
        if user['id'] == user_id:
            user['username'] = new_username
            break
    
    save_users(users)


def delete_user_account(user_id: str):
    """
    删除用户账户及所有相关数据
    包括：用户记录、游戏文件、图片文件、用户文件夹
    """
    import shutil
    
    users = load_users()
    
    # 查找用户
    user_to_delete = None
    for user in users:
        if user['id'] == user_id:
            user_to_delete = user
            break
    
    if not user_to_delete:
        return
    
    # 删除用户文件夹（包含所有游戏和图片）
    user_folder = user_to_delete.get('folder')
    if user_folder:
        user_dir = USERS_DIR / user_folder
        if user_dir.exists():
            shutil.rmtree(user_dir)
    
    # 从用户列表中删除
    users = [u for u in users if u['id'] != user_id]
    save_users(users)


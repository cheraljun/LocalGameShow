"""
邮件发送服务
"""
import json
import random
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from typing import Optional
import logging

logger = logging.getLogger(__name__)

CONFIG_PATH = Path(__file__).parent.parent.parent / "config.json"


def load_email_config() -> dict:
    """加载邮件配置"""
    if not CONFIG_PATH.exists():
        raise FileNotFoundError(f"配置文件不存在: {CONFIG_PATH}")
    
    with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
        config = json.load(f)
    
    # 返回邮件相关配置
    return {
        "smtp_host": config.get("smtp_host", "smtp.qq.com"),
        "smtp_port": config.get("smtp_port", 465),
        "smtp_user": config.get("admin_email", ""),
        "smtp_password": config.get("smtp_password", ""),
        "smtp_use_ssl": config.get("smtp_use_ssl", True),
        "from_email": config.get("admin_email", ""),
        "from_name": "游戏展示平台"
    }


def generate_verification_code() -> str:
    """生成6位验证码"""
    return str(random.randint(100000, 999999))


async def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """
    发送邮件
    
    Args:
        to_email: 收件人邮箱
        subject: 邮件主题
        html_content: 邮件内容（HTML格式）
    
    Returns:
        bool: 发送成功返回 True，失败返回 False
    """
    try:
        config = load_email_config()
        
        # 创建邮件对象
        message = MIMEMultipart()
        # QQ邮箱要求 From 必须与 smtp_user 完全一致
        message['From'] = config['from_email']
        message['To'] = to_email
        message['Subject'] = subject
        
        # 添加HTML内容
        message.attach(MIMEText(html_content, 'html', 'utf-8'))
        
        # 发送邮件
        if config.get('smtp_use_ssl', True):
            # 使用SSL连接
            await aiosmtplib.send(
                message,
                hostname=config['smtp_host'],
                port=config['smtp_port'],
                username=config['smtp_user'],
                password=config['smtp_password'],
                use_tls=True
            )
        else:
            # 使用STARTTLS连接
            await aiosmtplib.send(
                message,
                hostname=config['smtp_host'],
                port=config['smtp_port'],
                username=config['smtp_user'],
                password=config['smtp_password'],
                start_tls=True
            )
        
        logger.info(f"邮件发送成功: {to_email}")
        return True
    
    except Exception as e:
        logger.error(f"邮件发送失败: {to_email}, 错误: {str(e)}")
        return False


async def send_registration_code(email: str, code: str) -> bool:
    """发送注册验证码"""
    subject = "【游戏平台】邮箱验证码"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c4a5c;">邮箱验证</h2>
        <p>您的验证码是：</p>
        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px;">
            {code}
        </div>
        <p style="color: #666; margin-top: 20px;">
            此验证码5分钟内有效，请勿泄露给他人。
        </p>
        <p style="color: #999; font-size: 12px;">
            如非本人操作，请忽略此邮件。
        </p>
    </div>
    """
    return await send_email(email, subject, html_content)


async def send_login_code(email: str, code: str) -> bool:
    """发送登录验证码"""
    subject = "【游戏平台】登录验证码"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c4a5c;">登录验证</h2>
        <p>您的登录验证码是：</p>
        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px;">
            {code}
        </div>
        <p style="color: #666; margin-top: 20px;">
            此验证码5分钟内有效，请勿泄露给他人。
        </p>
        <p style="color: #999; font-size: 12px;">
            如非本人操作，请立即修改密码。
        </p>
    </div>
    """
    return await send_email(email, subject, html_content)


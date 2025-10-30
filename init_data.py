"""
初始化 data 目录结构
开发模式：先运行"提交git前运行.py"清空数据，再运行此脚本重建空结构
"""
import json
from pathlib import Path

print('\n开始初始化 data 目录...')
print('')

# 根目录
ROOT_DIR = Path(__file__).parent
DATA_DIR = ROOT_DIR / "data"

# 1. 创建主目录结构
print('[1] 创建目录结构...')
DATA_DIR.mkdir(exist_ok=True)
(DATA_DIR / "system").mkdir(exist_ok=True)
(DATA_DIR / "chat").mkdir(exist_ok=True)
(DATA_DIR / "users").mkdir(exist_ok=True)
print('    OK data/system/')
print('    OK data/chat/')
print('    OK data/users/')

# 2. 创建系统配置文件
print('\n[2] 初始化系统文件...')

system_files = {
    "users.json": {"users": []},
    "pending_registrations.json": {"registrations": []},
    "login_codes.json": {"codes": []},
    "rate_limits.json": {"limits": []},
    "announcement_drafts.json": {"posts": []},
    "announcement_published.json": {"posts": []},
    "bulletin_drafts.json": {"posts": []},
    "bulletin_published.json": {"posts": []}
}

for filename, content in system_files.items():
    filepath = DATA_DIR / "system" / filename
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(content, f, ensure_ascii=False, indent=2)
    print(f'    OK {filename}')

# 3. 创建聊天消息文件
print('\n[3] 初始化聊天文件...')
chat_file = DATA_DIR / "chat" / "messages.json"
with open(chat_file, 'w', encoding='utf-8') as f:
    json.dump({"messages": []}, f, ensure_ascii=False, indent=2)
print('    OK messages.json')

# 4. 读取配置文件获取管理员邮箱
print('\n[4] 检查配置文件...')
config_file = ROOT_DIR / "config.json"
if config_file.exists():
    with open(config_file, 'r', encoding='utf-8') as f:
        config = json.load(f)
    admin_email = config.get('admin_email', '')
    smtp_password = config.get('smtp_password', '')
    
    print(f'    OK 管理员邮箱: {admin_email}')
    if smtp_password:
        print('    OK SMTP授权码已配置')
    else:
        print('    WARNING SMTP授权码未配置，请编辑 config.json')
else:
    print('    ERROR config.json 不存在！')

print('\n初始化完成！')
print('\n注意事项：')
print(f'1. config.json 中的 admin_email: {admin_email}')
print('2. 该邮箱注册/登录时会自动获得管理员权限')
print('3. 管理员只能用验证码登录，不能用密码')
print('4. 修改 admin_email 可以更换管理员')
print('5. 普通用户注册时会自动创建用户文件夹')
if smtp_password:
    print('6. OK SMTP 授权码已配置')
else:
    print('6. WARNING 请在 config.json 中配置 smtp_password')
print('\n下一步：运行 python backend/main.py 启动服务器')
print('')


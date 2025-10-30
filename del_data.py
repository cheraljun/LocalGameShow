import shutil
from pathlib import Path

print('开始清理所有用户数据...')

# 1. 删除 data 目录（包含所有用户数据）
data_dir = Path('data')
if data_dir.exists():
    shutil.rmtree(data_dir)
    print('✅ 已删除 data 目录')

# 2. 删除 user_data 目录（旧的聊天数据）
user_data_dir = Path('user_data')
if user_data_dir.exists():
    shutil.rmtree(user_data_dir)
    print('✅ 已删除 user_data 目录')

# 3. 清理 Python 缓存
for pycache in Path('.').rglob('__pycache__'):
    shutil.rmtree(pycache)
    print(f'✅ 已删除 {pycache}')

for pyc in Path('.').rglob('*.pyc'):
    pyc.unlink()

print('\n清理完成！')
print('')
print('✅ book 目录已保留')
print('✅ config.json 已保留')
print('\n下一步：')
print('1. 运行 python init_data.py 初始化空的 data 目录')
print('2. 运行 python backend/main.py 启动服务器')
print('')

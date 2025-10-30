/**
 * 管理后台 - 统一管理系统
 * 管理公告、通告、游戏、留言
 */

import { toast } from '../components/Toast.js';

class Admin {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.currentType = 'announcement';  // announcement(公告) | bulletin(通告) | game | chat
        this.data = [];
        this.editingItem = null;
        
        if (!this.token) {
            window.location.href = '/admin/login.html';
            return;
        }
        
        this.init();
    }
    
    async init() {
        // 验证管理员权限
        const isValid = await this.verifyAdmin();
        if (!isValid) {
            window.location.href = '/admin/login.html';
            return;
        }
        
        this.bindEvents();
        this.loadContent();
    }
    
    /**
     * 验证管理员权限
     */
    async verifyAdmin() {
        try {
            const res = await fetch('/api/auth/verify', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (!res.ok) return false;
            
            const data = await res.json();
            
            if (data.user.role !== 'admin') {
                toast.error('您不是管理员');
                return false;
            }
            
            return true;
        } catch (err) {
            console.error('验证失败:', err);
            return false;
        }
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 导航切换
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                if (!type) return;
                
                // 更新激活状态
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.currentType = type;
                this.loadContent();
            });
        });
        
        // 退出登录
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });
        
        // 新建按钮
        document.getElementById('new-btn').addEventListener('click', () => {
            if (this.currentType === 'chat') {
                toast.info('留言由用户发送，不能手动创建');
                return;
            }
            if (this.currentType === 'game') {
                toast.info('游戏由用户上传，请前往前台管理');
                return;
            }
            this.openEditor();
        });
        
        // 编辑器按钮
        document.getElementById('cancel-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.closeEditor();
        });
        
        document.getElementById('save-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.saveItem();
        });
        
        // 列表操作（事件委托）
        document.getElementById('content-list').addEventListener('click', (e) => {
            const link = e.target.closest('.action-link');
            if (!link) return;
            
            e.preventDefault();
            
            const action = link.dataset.action;
            const id = link.dataset.id;
            const isConfirm = link.dataset.confirm === 'true';
            
            if (!action || !id) return;
            
            // 需要二次确认的操作
            if ((action === 'publish' || action === 'unpublish' || action === 'delete') && !isConfirm) {
                link.dataset.confirm = 'true';
                link.dataset.originalText = link.textContent;
                link.textContent = action === 'delete' ? '确认删除' : '确认操作';
                
                setTimeout(() => {
                    if (link.dataset.confirm === 'true') {
                        link.dataset.confirm = 'false';
                        link.textContent = link.dataset.originalText;
                    }
                }, 3000);
                return;
            }
            
            // 第二次点击：执行操作
            if (isConfirm) {
                link.dataset.confirm = 'false';
                link.textContent = link.dataset.originalText;
            }
            
            switch (action) {
                case 'edit':
                    this.editItem(id);
                    break;
                case 'publish':
                    this.publishItem(id);
                    break;
                case 'unpublish':
                    this.unpublishItem(id);
                    break;
                case 'delete':
                    this.deleteItem(id);
                    break;
            }
        });
    }
    
    /**
     * 加载内容
     */
    async loadContent() {
        // 更新页面标题和新建按钮
        const pageTitle = document.getElementById('page-title');
        const newBtn = document.getElementById('new-btn');
        
        const titles = {
            'announcement': '公告列表',
            'bulletin': '通告列表',
            'game': '游戏列表',
            'chat': '留言列表'
        };
        
        const btnTexts = {
            'announcement': '+ 新建公告',
            'bulletin': '+ 新建通告',
            'game': '',
            'chat': ''
        };
        
        pageTitle.textContent = titles[this.currentType] || '列表';
        newBtn.textContent = btnTexts[this.currentType] || '';
        newBtn.style.display = (this.currentType === 'game' || this.currentType === 'chat') ? 'none' : 'block';
        
        try {
            let url;
            if (this.currentType === 'announcement') {
                url = '/api/announcement/admin/list';
            } else if (this.currentType === 'bulletin') {
                url = '/api/bulletin/admin/list';
            } else if (this.currentType === 'game') {
                url = '/api/game/list';
            } else if (this.currentType === 'chat') {
                url = '/api/chat/messages?limit=500';
            }
            
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (!res.ok) throw new Error('加载失败');
            
            const data = await res.json();
            
            if (this.currentType === 'announcement') {
                this.data = data.announcements || [];
            } else if (this.currentType === 'bulletin') {
                this.data = data.bulletins || [];
            } else if (this.currentType === 'game') {
                this.data = data.games || [];
            } else if (this.currentType === 'chat') {
                this.data = data.messages || [];
            }
            
            this.renderList();
        } catch (err) {
            console.error(err);
            toast.error('加载失败');
        }
    }
    
    /**
     * 渲染列表
     */
    renderList() {
        const list = document.getElementById('content-list');
        
        if (this.data.length === 0) {
            list.innerHTML = '<div class="empty">暂无内容</div>';
            return;
        }
        
        // 留言类型特殊渲染
        if (this.currentType === 'chat') {
            list.innerHTML = this.data.map(msg => `
                <div class="post-item">
                    <div class="post-info">
                        <div class="post-title">${this.escape(msg.username || '匿名用户')}</div>
                        <div class="post-meta">
                            <span class="date">${this.formatDate(msg.timestamp)}</span>
                        </div>
                        <div class="post-content">${this.escape(msg.text || '')}</div>
                    </div>
                    <div class="post-actions">
                        <a href="#" class="action-link danger" data-action="delete" data-id="${msg.id}">删除</a>
                    </div>
                </div>
            `).join('');
            return;
        }
        
        // 游戏类型特殊渲染
        if (this.currentType === 'game') {
            list.innerHTML = this.data.map(game => {
                const content = game.content || '';
                const preview = content.length > 100 ? content.substring(0, 100) + '...' : content;
                
                return `
                    <div class="post-item">
                        <div class="post-info">
                            <div class="post-title">${this.escape(game.title || '(无标题)')}</div>
                            <div class="post-meta">
                                <span class="date">作者: ${this.escape(game.author_name)}</span>
                                <span class="date">${this.formatDate(game.published_at)}</span>
                            </div>
                            ${preview ? `<div class="post-content">${this.escape(preview)}</div>` : ''}
                        </div>
                        <div class="post-actions">
                            <a href="${game.game_file}" target="_blank" class="action-link">查看</a>
                            <a href="#" class="action-link danger" data-action="delete" data-id="${game.id}">删除</a>
                        </div>
                    </div>
                `;
            }).join('');
            return;
        }
        
        // 公告/通告类型渲染
        list.innerHTML = this.data.map(post => {
            const content = post.content || '';
            const preview = content.length > 100 ? content.substring(0, 100) + '...' : content;
            const statusText = post.status === 'published' ? '已发布' : '草稿';
            const statusClass = post.status === 'published' ? 'published' : 'draft';
            
            return `
                <div class="post-item">
                    <div class="post-info">
                        <div class="post-title">${this.escape(post.title || '(无标题)')}</div>
                        <div class="post-meta">
                            <span class="status ${statusClass}">${statusText}</span>
                            <span class="date">${this.formatDate(post.created_at)}</span>
                        </div>
                        <div class="post-content">${this.escape(preview)}</div>
                    </div>
                    <div class="post-actions">
                        <a href="#" class="action-link" data-action="edit" data-id="${post.id}">编辑</a>
                        ${post.status === 'draft' 
                            ? `<a href="#" class="action-link" data-action="publish" data-id="${post.id}">发布</a>` 
                            : `<a href="#" class="action-link" data-action="unpublish" data-id="${post.id}">撤回</a>`
                        }
                        <a href="#" class="action-link danger" data-action="delete" data-id="${post.id}">删除</a>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    /**
     * 打开编辑器
     */
    openEditor(item = null) {
        if (this.currentType === 'chat' || this.currentType === 'game') {
            return;
        }
        
        this.editingItem = item;
        
        const overlay = document.getElementById('editor-overlay');
        const title = document.getElementById('editor-title');
        const content = document.getElementById('editor-content');
        const headerText = document.getElementById('editor-title-text');
        
        const typeName = this.currentType === 'announcement' ? '公告' : '通告';
        headerText.textContent = item ? `编辑${typeName}` : `新建${typeName}`;
        title.value = item ? (item.title || '') : '';
        content.value = item ? (item.content || '') : '';
        
        overlay.classList.add('show');
    }
    
    /**
     * 关闭编辑器
     */
    closeEditor() {
        document.getElementById('editor-overlay').classList.remove('show');
        this.editingItem = null;
    }
    
    /**
     * 保存项目
     */
    async saveItem() {
        if (this.currentType !== 'announcement' && this.currentType !== 'bulletin') return;
        
        const title = document.getElementById('editor-title').value.trim();
        const content = document.getElementById('editor-content').value.trim();
        
        if (!title) {
            toast.error('请输入标题');
            return;
        }
        
        if (!content) {
            toast.error('请输入内容');
            return;
        }
        
        try {
            let res;
            const apiPath = this.currentType === 'announcement' ? 'announcement' : 'bulletin';
            
            if (this.editingItem) {
                // 更新
                res = await fetch(`/api/${apiPath}/admin/${this.editingItem.id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ title, content })
                });
            } else {
                // 创建
                res = await fetch(`/api/${apiPath}/admin/create`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ title, content })
                });
            }
            
            if (!res.ok) throw new Error('保存失败');
            
            toast.success('保存成功');
            this.closeEditor();
            this.loadContent();
        } catch (err) {
            console.error(err);
            toast.error('保存失败');
        }
    }
    
    /**
     * 编辑项目
     */
    async editItem(id) {
        if (this.currentType !== 'announcement' && this.currentType !== 'bulletin') return;
        
        const item = this.data.find(a => a.id === id);
        if (item) {
            this.openEditor(item);
        }
    }
    
    /**
     * 发布项目
     */
    async publishItem(id) {
        if (this.currentType !== 'announcement' && this.currentType !== 'bulletin') return;
        
        try {
            const apiPath = this.currentType === 'announcement' ? 'announcement' : 'bulletin';
            const res = await fetch(`/api/${apiPath}/admin/${id}/publish`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (!res.ok) throw new Error('发布失败');
            
            toast.success('发布成功');
            this.loadContent();
        } catch (err) {
            console.error(err);
            toast.error('发布失败');
        }
    }
    
    /**
     * 撤回项目
     */
    async unpublishItem(id) {
        if (this.currentType !== 'announcement' && this.currentType !== 'bulletin') return;
        
        try {
            const apiPath = this.currentType === 'announcement' ? 'announcement' : 'bulletin';
            const res = await fetch(`/api/${apiPath}/admin/${id}/unpublish`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (!res.ok) throw new Error('撤回失败');
            
            toast.success('撤回成功');
            this.loadContent();
        } catch (err) {
            console.error(err);
            toast.error('撤回失败');
        }
    }
    
    /**
     * 删除项目
     */
    async deleteItem(id) {
        try {
            let url;
            if (this.currentType === 'announcement') {
                url = `/api/announcement/admin/${id}`;
            } else if (this.currentType === 'bulletin') {
                url = `/api/bulletin/admin/${id}`;
            } else if (this.currentType === 'game') {
                url = `/api/game/${id}`;
            } else if (this.currentType === 'chat') {
                url = `/api/chat/messages/${id}`;
            }
            
            const res = await fetch(url, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (!res.ok) throw new Error('删除失败');
            
            toast.success('删除成功');
            this.loadContent();
        } catch (err) {
            console.error(err);
            toast.error('删除失败');
        }
    }
    
    /**
     * 退出登录
     */
    logout() {
        localStorage.removeItem('authToken');
        window.location.href = '/admin/login.html';
    }
    
    /**
     * HTML 转义
     */
    escape(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }
    
    /**
     * 格式化日期
     */
    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new Admin();
});

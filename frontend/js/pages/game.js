/**
 * 游戏页面组件
 * - 4399 风格的游戏网格展示
 * - iframe 沙箱运行游戏
 * - 用户上传、编辑、删除游戏
 */

import { toast } from '/js/components/Toast.js';

class GamePage {
    constructor(stateManager) {
        this.stateManager = stateManager;
        
        this.currentUser = null;  // 当前登录用户
        this.currentGame = null;  // 当前查看的游戏
        this.games = [];          // 游戏列表
        this.myGames = [];        // 我的游戏列表
        this.container = null;    // 容器元素
        
        // 检查登录状态
        this.checkLoginStatus();
    }

    /**
     * 渲染入口（根据 state.view 分发）
     */
    async render(state) {
        if (!this.container) return;

        switch (state.view) {
            case 'list':
                await this.renderList();
                break;
            case 'detail':
                await this.renderDetail(state.itemId);
                break;
            case 'my':
                await this.renderMyGames();
                break;
            case 'upload':
                this.renderUploadForm();
                break;
            default:
                await this.renderList();
        }
    }

    /**
     * 检查登录状态
     */
    async checkLoginStatus() {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const response = await fetch('/api/auth/verify', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.currentUser = data.user;
                }
            } catch (error) {
                console.error('验证登录失败:', error);
            }
        }
    }

    /**
     * 渲染列表页
     */
    async renderList() {
        try {
            // 获取已发布的游戏列表
            const response = await fetch('/api/game/list');
            const data = await response.json();
            this.games = data.games || [];

            // 渲染HTML
            let html = '';

            // 上传按钮（仅登录用户可见）
            if (this.currentUser) {
                html += `
                    <div class="game-header">
                        <a href="#" class="action-link" id="upload-game-btn">+ 上传游戏</a>
                    </div>
                `;
            }

            if (this.games.length === 0) {
                html += `
                    <div class="empty-state">
                        <p>暂无游戏</p>
                    </div>
                `;
            } else {
                // 4399 风格网格布局（一行15个）
                html += '<div class="game-grid">';
                
                this.games.forEach(game => {
                    // 截取简介（最多50字）
                    const shortDesc = game.content ? 
                        (game.content.length > 50 ? game.content.substring(0, 50) + '...' : game.content) : 
                        '';
                    
                    html += `
                        <div class="game-card" data-game-id="${game.id}">
                            <div class="game-thumbnail">
                                <img src="${game.thumbnail}" alt="${game.title}">
                            </div>
                            <div class="game-info">
                                <div class="game-title">${this.escapeHtml(game.title)}</div>
                                <div class="game-author">${this.escapeHtml(game.author_name)}</div>
                                ${shortDesc ? `<div class="game-desc">${this.escapeHtml(shortDesc)}</div>` : ''}
                            </div>
                        </div>
                    `;
                });
                
                html += '</div>';
            }

            this.container.innerHTML = html;

            // 绑定事件
            this.bindListEvents();

        } catch (error) {
            console.error('加载游戏列表失败:', error);
            toast.error('加载失败，请刷新重试');
        }
    }

    /**
     * 绑定列表页事件
     */
    bindListEvents() {
        // 上传游戏按钮
        const uploadBtn = document.getElementById('upload-game-btn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.stateManager.showSpecial('game', 'upload');
            });
        }

        // 游戏卡片点击 - 直接打开游戏
        const gameCards = this.container.querySelectorAll('.game-card');
        gameCards.forEach(card => {
            card.addEventListener('click', () => {
                const gameId = card.dataset.gameId;
                const game = this.games.find(g => g.id === gameId);
                if (game) {
                    // 直接在新标签页打开游戏
                    window.open(game.game_file, '_blank');
                }
            });
        });
    }

    /**
     * 渲染详情页
     */
    async renderDetail(gameId) {
        try {
            // 获取游戏详情
            const response = await fetch(`/api/game/${gameId}`);
            
            if (!response.ok) {
                throw new Error('游戏不存在');
            }

            const data = await response.json();
            this.currentGame = data.game;

            // 检查是否是作者（管理员在前台没有特权）
            const isAuthor = this.currentUser && this.currentUser.id === this.currentGame.author_id;

            // 渲染HTML
            let html = `
                <div class="game-detail">
                    <div class="game-detail-header">
                        <h2>${this.escapeHtml(this.currentGame.title)}</h2>
                        <div class="game-meta">
                            <span>作者: ${this.escapeHtml(this.currentGame.author_name)}</span>
                            <span>发布时间: ${this.formatDate(this.currentGame.published_at)}</span>
                        </div>
                    </div>

                    ${this.currentGame.content ? `
                        <div class="game-description">
                            ${this.escapeHtml(this.currentGame.content)}
                        </div>
                    ` : ''}

                    <div class="game-preview">
                        <img src="${this.currentGame.thumbnail}" alt="${this.escapeHtml(this.currentGame.title)}" class="game-preview-image">
                        <a href="${this.currentGame.game_file}" target="_blank" class="play-game-btn">
                            ▶ 开始游戏（新窗口）
                        </a>
                    </div>

                    <div class="game-actions">
                        <a href="#" class="action-link" id="back-to-list">返回列表</a>
                        ${isAuthor ? `
                            <a href="#" class="action-link danger" id="delete-game">删除</a>
                        ` : ''}
                    </div>
                </div>
            `;

            this.container.innerHTML = html;

            // 绑定事件
            this.bindDetailEvents();

        } catch (error) {
            console.error('加载游戏详情失败:', error);
            toast.error('游戏不存在或已下架');
            this.stateManager.showList('game');
        }
    }

    /**
     * 绑定详情页事件
     */
    bindDetailEvents() {
        // 返回列表
        const backBtn = document.getElementById('back-to-list');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.stateManager.showList('game');
            });
        }

        // 删除游戏
        const deleteBtn = document.getElementById('delete-game');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleConfirmDelete(deleteBtn, () => {
                    this.deleteGameAction(this.currentGame.id);
                });
            });
        }
    }

    /**
     * 渲染"我的游戏"管理页面
     */
    async renderMyGames() {
        if (!this.currentUser) {
            toast.error('请先登录');
            this.stateManager.showList('game');
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/game/my-games', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('加载失败');
            }

            const data = await response.json();
            this.myGames = data.games || [];

            // 渲染HTML
            let html = `
                <div class="my-games-page">
                    <h2>我的游戏</h2>
                    
                    <div class="page-actions">
                        <a href="#" class="action-link" id="upload-new-game">+ 上传新游戏</a>
                        <a href="#" class="action-link" id="back-to-game-list">返回游戏列表</a>
                    </div>
            `;

            if (this.myGames.length === 0) {
                html += '<p class="empty-hint">您还没有上传任何游戏</p>';
            } else {
                html += '<div class="my-games-list">';
                
                this.myGames.forEach(game => {
                    const statusText = game.status === 'published' ? '已发布' : '草稿';
                    const statusClass = game.status === 'published' ? 'published' : 'draft';
                    
                    html += `
                        <div class="my-game-item">
                            <div class="game-info">
                                <h3>${this.escapeHtml(game.title)}</h3>
                                <p>状态: <span class="status ${statusClass}">${statusText}</span></p>
                                <p>创建时间: ${this.formatDate(game.created_at)}</p>
                            </div>
                            <div class="game-actions">
                                ${game.status === 'draft' ? 
                                    `<a href="#" class="action-link" data-action="publish" data-game-id="${game.id}">发布</a>` : ''
                                }
                                <a href="#" class="action-link danger" data-action="delete" data-game-id="${game.id}">删除</a>
                            </div>
                        </div>
                    `;
                });
                
                html += '</div>';
            }

            html += '</div>';
            this.container.innerHTML = html;

            // 绑定事件
            this.bindMyGamesEvents();

        } catch (error) {
            console.error('加载我的游戏失败:', error);
            toast.error('加载失败，请重试');
        }
    }

    /**
     * 绑定"我的游戏"页面事件
     */
    bindMyGamesEvents() {
        // 上传新游戏
        const uploadBtn = document.getElementById('upload-new-game');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.stateManager.showSpecial('game', 'upload');
            });
        }

        // 返回游戏列表
        const backBtn = document.getElementById('back-to-game-list');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.stateManager.showList('game');
            });
        }

        // 游戏操作
        const actionLinks = this.container.querySelectorAll('[data-action]');
        actionLinks.forEach(link => {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                const action = link.dataset.action;
                const gameId = link.dataset.gameId;

                switch (action) {
                    case 'publish':
                        await this.publishGameAction(gameId);
                        break;
                    case 'delete':
                        this.handleConfirmDelete(link, () => this.deleteGameAction(gameId));
                        break;
                }
            });
        });
    }

    /**
     * 显示上传表单
     */
    renderUploadForm() {
        const html = `
            <div class="game-form">
                <h2>上传游戏</h2>
                
                <div class="form-group">
                    <label>游戏名称*</label>
                    <input type="text" id="game-title" maxlength="100" required>
                </div>

                <div class="form-group">
                    <label>游戏介绍（可选）</label>
                    <textarea id="game-description" maxlength="500"></textarea>
                </div>

                <div class="form-group">
                    <label>游戏文件（HTML）*</label>
                    <input type="file" id="game-file" accept=".html" required>
                </div>

                <div class="form-group">
                    <label>缩略图（PNG/JPG/GIF）*</label>
                    <input type="file" id="game-thumbnail" accept="image/*" required>
                </div>

                <div class="form-actions">
                    <a href="#" class="action-link" id="cancel-upload">取消</a>
                    <a href="#" class="action-link" id="submit-upload">上传</a>
                </div>

                <p class="form-note">* 游戏上传后将保存为草稿状态，请到"我的游戏"页面发布</p>
            </div>
        `;

        this.container.innerHTML = html;

        // 绑定事件
        document.getElementById('cancel-upload').addEventListener('click', (e) => {
            e.preventDefault();
            this.stateManager.showSpecial('game', 'my');
        });

        document.getElementById('submit-upload').addEventListener('click', (e) => {
            e.preventDefault();
            this.uploadGameAction();
        });
    }

    /**
     * 上传游戏操作
     */
    async uploadGameAction() {
        const title = document.getElementById('game-title').value.trim();
        const description = document.getElementById('game-description').value.trim();
        const gameFile = document.getElementById('game-file').files[0];
        const thumbnail = document.getElementById('game-thumbnail').files[0];

        // 验证
        if (!title) {
            toast.error('请输入游戏名称');
            return;
        }

        if (!gameFile) {
            toast.error('请选择游戏文件');
            return;
        }

        if (!thumbnail) {
            toast.error('请选择缩略图');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', description);
            formData.append('game_file', gameFile);
            formData.append('thumbnail', thumbnail);

            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/game/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || '上传失败');
            }

            const data = await response.json();
            toast.success('游戏上传成功');
            
            // 返回我的游戏
            this.stateManager.showSpecial('game', 'my');

        } catch (error) {
            console.error('上传游戏失败:', error);
            toast.error(error.message || '上传失败，请重试');
        }
    }

    /**
     * 发布游戏
     */
    async publishGameAction(gameId) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/game/${gameId}/publish`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('发布失败');
            }

            toast.success('游戏已发布');
            this.stateManager.showSpecial('game', 'my');

        } catch (error) {
            console.error('发布失败:', error);
            toast.error(error.message);
        }
    }

    /**
     * 删除游戏操作
     */
    async deleteGameAction(gameId) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/game/${gameId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || '删除失败');
            }

            toast.success('游戏已删除');
            
            // 刷新我的游戏列表
            this.stateManager.showSpecial('game', 'my');

        } catch (error) {
            console.error('删除游戏失败:', error);
            toast.error(error.message || '删除失败，请重试');
        }
    }

    /**
     * 处理确认删除交互（复用现有交互模式）
     */
    handleConfirmDelete(element, callback) {
        let isConfirming = element.dataset.confirming === 'true';

        if (!isConfirming) {
            // 第一次点击：变为确认状态
            element.textContent = '确认删除';
            element.classList.add('confirming');
            element.dataset.confirming = 'true';

            // 3秒后自动恢复
            setTimeout(() => {
                if (element.dataset.confirming === 'true') {
                    element.textContent = '删除';
                    element.classList.remove('confirming');
                    element.dataset.confirming = 'false';
                }
            }, 3000);
        } else {
            // 第二次点击：执行删除
            element.textContent = '删除';
            element.classList.remove('confirming');
            element.dataset.confirming = 'false';
            
            // 执行回调
            callback();
        }
    }

    /**
     * HTML转义
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 格式化日期
     */
    formatDate(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleDateString('zh-CN');
    }
}

// 导出
export { GamePage };


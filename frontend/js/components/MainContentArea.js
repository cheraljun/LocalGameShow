/**
 * 主内容区组件
 * 根据StateManager状态渲染右侧内容
 */
import { api } from '../utils/apiClient.js';
import { ContentCard } from './ContentCard.js';
import { EmptyState } from './EmptyState.js';
import { HtmlHelpers } from '../utils/htmlHelpers.js';
import { toast } from './Toast.js';
import { GamePage } from '../pages/game.js';

export class MainContentArea {
    constructor(container, stateManager) {
        this.container = container;
        this.stateManager = stateManager;
        this.posts = [];
        this.currentPost = null;
        this.currentType = null;
        
        // 初始化游戏页面组件
        this.gamePage = new GamePage(stateManager);

        // 订阅状态变化
        this.stateManager.subscribe((state, type) => {
            this.currentType = type;
            this.render(state, type);
        });

        // 事件委托：卡片点击进入详情
        this.container.addEventListener('click', (e) => {
            // 处理返回列表按钮
            if (e.target.closest('.back-to-list')) {
                e.preventDefault();
                if (window.app && typeof window.app.backToList === 'function') {
                    window.app.backToList();
                }
                return;
            }

            // 处理分享按钮点击
            if (e.target.closest('.share-btn')) {
                e.stopPropagation();
                this.handleShare();
                return;
            }

            // 处理卡片点击
            const wrapper = e.target.closest('[data-post-id]');
            if (wrapper && this.currentType) {
                const id = wrapper.getAttribute('data-post-id');
                if (id && window.app && typeof window.app.showDetail === 'function') {
                    window.app.showDetail(this.currentType, id);
                }
            }
        });
    }

    /**
     * 根据状态渲染内容
     */
    async render(state, type) {
        if (state.view === 'empty') {
            this.container.style.display = 'none';
            return;
        }

        this.container.style.display = 'block';

        // 游戏页面的所有视图都由 GamePage 组件处理
        if (type === 'game') {
            this.gamePage.container = this.container;
            await this.gamePage.render(state);
            return;
        }

        // 其他类型的页面
        switch (state.view) {
            case 'list':
                await this.renderList(type);
                break;
            case 'detail':
                await this.renderDetail(type, state.itemId);
                break;
            case 'chat':
                this.renderChat();
                break;
            default:
                this.renderEmpty();
        }
    }

    /**
     * 渲染列表页
     */
    async renderList(type) {
        // 如果是游戏页面，使用游戏页面组件
        if (type === 'game') {
            this.gamePage.container = this.container;
            await this.gamePage.render({ view: 'list', itemId: null });
            return;
        }

        this.container.innerHTML = EmptyState.loading().render();

        try {
            // 根据类型选择正确的 API
            let apiUrl;
            if (type === 'announcement') {
                apiUrl = '/announcement/list';
            } else {
                apiUrl = `/content/${type}`;
            }
            
            const response = await api.get(apiUrl);
            
            // 处理不同的响应格式
            if (type === 'announcement') {
                this.posts = response.announcements || [];
            } else {
                this.posts = response;
            }
            
            if (this.posts.length === 0) {
                this.container.innerHTML = new EmptyState({
                    icon: this.getTypeIcon(type),
                    title: '暂无内容',
                    message: ''
                }).render();
                return;
            }

            const html = `
                <div style="padding: var(--content-padding);">
                    ${this.posts.map(post => {
                        return `<div data-post-id="${post.id}">${new ContentCard(post).renderSimple()}</div>`;
                    }).join('')}
                </div>
            `;
            this.container.innerHTML = html;
        } catch (error) {
            console.error('加载失败:', error);
            this.container.innerHTML = EmptyState.error().render();
        }
    }

    /**
     * 渲染详情页
     */
    async renderDetail(type, itemId) {
        // 如果是游戏页面，使用游戏页面组件
        if (type === 'game') {
            this.gamePage.container = this.container;
            await this.gamePage.render({ view: 'detail', itemId: itemId });
            return;
        }

        this.container.innerHTML = EmptyState.loading().render();

        try {
            // 如果已经加载了列表，直接从中查找
            if (this.posts.length > 0) {
                this.currentPost = this.posts.find(p => p.id === itemId);
            }

            // 如果没找到，重新加载列表
            if (!this.currentPost) {
                this.posts = await api.get(`/content/${type}`);
                this.currentPost = this.posts.find(p => p.id === itemId);
            }

            if (!this.currentPost) {
                this.container.innerHTML = EmptyState.error().render();
                return;
            }

            const html = `
                <div style="padding: var(--content-padding);">
                    <div style="margin-bottom: var(--section-gap); display: flex; justify-content: space-between; align-items: center;">
                        <a href="#" class="back-to-list">
                            ← 返回列表
                        </a>
                        <button class="share-btn btn btn-sm" title="分享此文章">
                            分享
                        </button>
                    </div>
                    ${new ContentCard(this.currentPost).renderDetail()}
                </div>
            `;
            this.container.innerHTML = html;
        } catch (error) {
            console.error('加载详情失败:', error);
            this.container.innerHTML = EmptyState.error().render();
        }
    }

    /**
     * 渲染聊天页
     */
    renderChat() {
        const html = `
            <iframe src="/pages/chat.html" style="width: 100%; height: 100%; border: none;"></iframe>
        `;
        this.container.innerHTML = html;
    }

    /**
     * 渲染空状态
     */
    renderEmpty() {
        this.container.style.display = 'none';
    }

    /**
     * 获取类型图标
     */
    getTypeIcon(type) {
        return '';
    }

    /**
     * 处理分享：复制当前URL到剪贴板
     */
    async handleShare() {
        try {
            const shareUrl = this.stateManager.getShareUrl();
            
            // 使用 Clipboard API 复制链接
            await navigator.clipboard.writeText(shareUrl);
            
            // 显示成功提示
            toast.success('分享链接已复制');
            
        } catch (error) {
            console.error('复制失败:', error);
            
            // 如果 Clipboard API 不可用，使用传统方法
            try {
                const textarea = document.createElement('textarea');
                textarea.value = this.stateManager.getShareUrl();
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                
                toast.success('分享链接已复制');
            } catch (fallbackError) {
                console.error('复制失败（fallback）:', fallbackError);
                toast.error('复制失败，请手动复制URL');
            }
        }
    }
}


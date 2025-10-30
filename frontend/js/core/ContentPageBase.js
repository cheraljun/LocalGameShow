/**
 * 内容页面基类
 * 所有用户端内容页面（research, media, activity, shop）的基类
 */
import { api } from '../utils/apiClient.js';
import { ContentCard } from '../components/ContentCard.js';
import { EmptyState } from '../components/EmptyState.js';

export class ContentPageBase {
    constructor(config) {
        this.config = config;
        this.container = document.getElementById(config.containerId);
        this.posts = [];
        
        if (!this.container) {
            console.error(`Container #${config.containerId} not found`);
            return;
        }

        this.init();
    }

    async init() {
        await this.loadContent();
    }

    /**
     * 加载内容
     */
    async loadContent() {
        try {
            this.showLoading();
            this.posts = await api.get(`/content/${this.config.type}`);
            this.render();
        } catch (error) {
            console.error('加载内容失败:', error);
            this.showError();
        }
    }

    /**
     * 渲染内容
     */
    render() {
        if (this.posts.length === 0) {
            this.showEmpty();
            return;
        }

        const html = this.posts
            .map(post => this.renderPost(post))
            .join('');
        
        this.container.innerHTML = this.wrapContent(html);
    }

    /**
     * 渲染单个文章
     * 子类可以覆盖此方法自定义渲染
     */
    renderPost(post) {
        const card = new ContentCard(post);
        return card.renderSimple();
    }

    /**
     * 包装内容（添加容器）
     */
    wrapContent(html) {
        return `<div style="padding: 20px;">${html}</div>`;
    }

    /**
     * 显示加载状态
     */
    showLoading() {
        this.container.innerHTML = EmptyState.loading().render();
    }

    /**
     * 显示空状态
     */
    showEmpty() {
        const emptyState = new EmptyState({
            icon: this.config.emptyIcon || '📝',
            title: this.config.emptyTitle || '暂无内容',
            message: this.config.emptyMessage || ''
        });
        this.container.innerHTML = emptyState.render();
    }

    /**
     * 显示错误状态
     */
    showError() {
        this.container.innerHTML = EmptyState.error().render();
    }
}


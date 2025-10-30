/**
 * 公告弹窗组件
 */
import { api } from '../utils/apiClient.js';
import { HtmlHelpers } from '../utils/htmlHelpers.js';

export class AnnouncementModal {
    constructor() {
        this.createModal();
        this.bindEvents();
    }

    /**
     * 创建弹窗DOM
     */
    createModal() {
        const modal = document.createElement('div');
        modal.id = 'announcement-modal';
        modal.className = 'announcement-modal';
        modal.innerHTML = `
            <div class="announcement-modal-overlay"></div>
            <div class="announcement-modal-content">
                <button class="announcement-modal-close">×</button>
                <div class="announcement-modal-body" id="announcement-modal-body">
                    加载中...
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        this.modal = modal;
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        const closeBtn = this.modal.querySelector('.announcement-modal-close');
        const overlay = this.modal.querySelector('.announcement-modal-overlay');

        closeBtn.addEventListener('click', () => this.hide());
        overlay.addEventListener('click', () => this.hide());
    }

    /**
     * 显示弹窗
     */
    async show() {
        this.modal.classList.add('show');
        await this.loadContent();
    }

    /**
     * 隐藏弹窗
     */
    hide() {
        this.modal.classList.remove('show');
    }

    /**
     * 加载公告内容
     */
    async loadContent() {
        const body = document.getElementById('announcement-modal-body');
        
        try {
            const data = await api.get('/announcement/latest');
            
            if (!data.success || !data.announcement) {
                body.innerHTML = '<p style="text-align: center; color: #666;">暂无公告</p>';
                return;
            }

            const announcement = data.announcement;
            
            // 渲染标题和内容
            let html = '';
            
            if (announcement.title) {
                html += `<h2 style="margin-bottom: 1rem; font-size: 1.5rem; font-weight: bold;">${HtmlHelpers.formatContent(announcement.title)}</h2>`;
            }
            
            if (announcement.content) {
                html += `<div style="line-height: 1.8; word-wrap: break-word; white-space: pre-wrap;">${HtmlHelpers.formatContent(announcement.content)}</div>`;
            }
            
            if (announcement.published_at) {
                const date = new Date(announcement.published_at);
                html += `<p style="margin-top: 1rem; color: #999; font-size: 0.9rem;">发布时间: ${date.toLocaleString('zh-CN')}</p>`;
            }

            body.innerHTML = html;
        } catch (error) {
            console.error('加载公告失败:', error);
            body.innerHTML = '<p style="text-align: center; color: #f44;">加载失败</p>';
        }
    }
}


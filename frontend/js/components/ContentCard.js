/**
 * 内容卡片组件
 */
import { HtmlHelpers } from '../utils/htmlHelpers.js';

export class ContentCard {
    constructor(post, options = {}) {
        this.post = post;
        this.options = {
            showActions: false,
            truncate: false,
            ...options
        };
    }

    /**
     * 渲染卡片
     */
    render() {
        const { post, options } = this;
        
        let content = HtmlHelpers.formatContent(post.content);
        if (options.truncate) {
            content = HtmlHelpers.truncate(content, 200);
        }

        return `
            <div class="content-item" data-id="${post.id}">
                ${this.renderHeader()}
                <div class="content-item-body">
                    ${post.title ? `<h3 class="content-item-title">${HtmlHelpers.escapeHtml(post.title)}</h3>` : ''}
                    <div class="content-item-text">${content}</div>
                    ${this.renderImages()}
                </div>
            </div>
        `;
    }

    /**
     * 渲染图片
     */
    renderImages() {
        const { post } = this;
        
        if (!post.images || post.images.length === 0) {
            return '';
        }

        return `
            <div class="content-images">
                ${post.images.map(img => `
                    <img src="${img}" alt="图片" class="content-image">
                `).join('')}
            </div>
        `;
    }

    /**
     * 渲染头部（包含元信息和操作按钮）
     */
    renderHeader() {
        const { post, options } = this;
        
        return `
            <div class="content-item-header">
                <div class="content-item-meta">
                    ${HtmlHelpers.formatDate(post.created_at)}
                    ${post.status === 'draft' ? ' · <span style="color: orange;">草稿</span>' : ''}
                </div>
                ${options.showActions ? this.renderActions() : ''}
            </div>
        `;
    }

    /**
     * 渲染操作按钮
     * 注意：使用 data-action 和 data-id 属性，通过事件委托处理点击
     */
    renderActions() {
        return `
            <div class="content-item-actions">
                <button class="btn btn-sm action-btn" data-action="edit" data-id="${this.post.id}">
                    编辑
                </button>
                <button class="btn btn-sm action-btn" data-action="delete" data-id="${this.post.id}" 
                        style="background: #c00; color: white;">
                    删除
                </button>
            </div>
        `;
    }

    /**
     * 渲染简单样式（用于用户端列表页 - 紧凑单行模式）
     */
    renderSimple() {
        const { post } = this;
        
        // 截断内容为摘要
        const contentPreview = HtmlHelpers.truncate(post.content, 100);
        
        // 获取第一张缩略图
        const thumbnail = post.images && post.images.length > 0 ? post.images[0] : null;
        
        return `
            <div class="post-list-item">
                ${thumbnail ? `
                    <div class="post-thumbnail">
                        <img src="${thumbnail}" alt="缩略图">
                    </div>
                ` : ''}
                <div class="post-list-content">
                    <h3 class="post-list-title">
                        ${post.title || '(无标题)'}
                    </h3>
                    <div class="post-list-meta">
                        ${HtmlHelpers.formatDate(post.created_at)}
                    </div>
                    <div class="post-list-excerpt">
                        ${HtmlHelpers.escapeHtml(contentPreview)}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染详情样式（用于用户端详情页 - 完整模式）
     */
    renderDetail() {
        const { post } = this;
        
        return `
            <div class="post">
                <div class="post-content">
                    ${post.title ? `<h3 style="margin: 0 0 var(--content-gap) 0; font-weight: bold; font-size: 1.5rem;">${HtmlHelpers.escapeHtml(post.title)}</h3>` : ''}
                    <div class="post-date" style="margin: 0 0 var(--section-gap) 0; color: #666; font-size: 0.86rem;">
                        ${HtmlHelpers.formatDate(post.created_at)}
                    </div>
                    <div class="post-full-content" style="color: #333; line-height: 1.8; font-size: 1.05rem;">
                        ${HtmlHelpers.formatContent(post.content)}
                    </div>
                    ${this.renderImagesGrid(false)}
                </div>
            </div>
        `;
    }

    /**
     * 渲染图片网格（4列布局，支持点击查看大图）
     */
    renderImagesGrid(isPreview = false) {
        const { post } = this;
        
        if (!post.images || post.images.length === 0) {
            return '';
        }

        // 预览模式只显示前4张图片
        const imagesToShow = isPreview ? post.images.slice(0, 4) : post.images;
        const imageCount = imagesToShow.length;
        
        // 根据图片数量选择网格类型
        let gridClass = 'grid-4';
        if (imageCount === 1) gridClass = 'grid-1';
        else if (imageCount === 2) gridClass = 'grid-2';
        else if (imageCount === 3) gridClass = 'grid-3';

        return `
            <div class="post-images-grid ${gridClass}">
                ${imagesToShow.map((img, index) => `
                    <div class="post-image-item">
                        <img src="${img}" 
                             alt="图片 ${index + 1}" 
                             onload="this.style.opacity=1"
                             style="cursor: pointer;"
                             title="点击查看大图">
                    </div>
                `).join('')}
                ${isPreview && post.images.length > 4 ? `
                    <div class="post-image-item" style="display: flex; align-items: center; justify-content: center; background: #f0f0f0; color: #666; font-size: 0.9rem;">
                        +${post.images.length - 4} 张
                    </div>
                ` : ''}
            </div>
        `;
    }
}


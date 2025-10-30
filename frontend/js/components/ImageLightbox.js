/**
 * 图片灯箱组件 - 点击放大图片
 */

export class ImageLightbox {
    constructor() {
        this.overlay = null;
        this.init();
    }

    init() {
        // 创建灯箱容器
        this.overlay = document.createElement('div');
        this.overlay.id = 'image-lightbox';
        this.overlay.className = 'image-lightbox';
        this.overlay.style.display = 'none';
        
        this.overlay.innerHTML = `
            <img src="" alt="" class="lightbox-image">
        `;
        
        document.body.appendChild(this.overlay);
        
        // 点击关闭
        this.overlay.addEventListener('click', () => {
            this.close();
        });
    }

    /**
     * 打开灯箱显示图片
     * @param {string} imageSrc - 图片URL
     */
    open(imageSrc) {
        const img = this.overlay.querySelector('.lightbox-image');
        img.src = imageSrc;
        this.overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    /**
     * 关闭灯箱
     */
    close() {
        this.overlay.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// 创建全局单例
export const imageLightbox = new ImageLightbox();

// 自动绑定所有图片点击事件（使用事件委托）
document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', (e) => {
        // 检查是否点击了 img 标签
        if (e.target.tagName === 'IMG') {
            // 检查是否在文章图片容器内
            const container = e.target.closest('.post-image-item, .detail-image');
            if (container) {
                e.preventDefault();
                e.stopPropagation();
                imageLightbox.open(e.target.src);
            }
        }
    });
});


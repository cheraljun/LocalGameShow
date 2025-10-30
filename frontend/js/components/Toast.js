/**
 * Toast 提示组件 - 静默弹窗
 * 用于显示临时提示信息（3秒后自动消失）
 */

export class Toast {
    constructor() {
        this.container = null;
        this.init();
    }

    /**
     * 初始化Toast容器
     */
    init() {
        // 检查是否已存在容器
        this.container = document.getElementById('toast-container');
        
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }

    /**
     * 显示提示信息
     * @param {string} message - 提示文本
     * @param {number} duration - 显示时长（毫秒）
     */
    show(message, duration = 2000) {
        // 创建Toast元素
        const toast = document.createElement('div');
        toast.className = 'toast show';
        toast.textContent = message;
        
        // 添加到容器
        this.container.appendChild(toast);
        
        // 自动移除
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 200);
        }, duration);
    }

    /**
     * 成功提示
     */
    success(message, duration = 2000) {
        this.show(message, duration);
    }

    /**
     * 错误提示
     */
    error(message, duration = 2000) {
        this.show(message, duration);
    }

    /**
     * 信息提示
     */
    info(message, duration = 2000) {
        this.show(message, duration);
    }
}

// 创建全局单例
export const toast = new Toast();


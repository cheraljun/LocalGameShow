/**
 * HTML 工具函数
 */

export const HtmlHelpers = {
    /**
     * 转义 HTML 特殊字符
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * 格式化日期
     */
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * 格式化内容（自动识别链接）
     */
    formatContent(content) {
        if (!content) return '';
        
        // 转义 HTML
        let text = this.escapeHtml(content);
        
        // 自动识别链接并转换
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        text = text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: blue; text-decoration: underline;">$1</a>');
        
        // 保留换行
        text = text.replace(/\n/g, '<br>');
        
        return text;
    },

    /**
     * 截断文本
     */
    truncate(text, length = 200) {
        if (!text || text.length <= length) return text;
        return text.substring(0, length) + '...';
    }
};

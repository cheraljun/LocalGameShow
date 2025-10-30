/**
 * 状态管理器 - SPA核心
 * 管理所有页面状态，驱动MainContentArea渲染
 * 支持Hash路由，实现URL分享功能
 */

class StateManager {
    constructor() {
        // 当前激活的内容类型
        this.currentType = null;
        
        // 各个类型的状态（独立保存）
        this.states = {
            announcement: null,
            game: null,
            chat: null
        };
        
        // 监听器列表
        this.listeners = [];
        
        // 是否正在从URL同步（避免循环更新）
        this.syncing = false;
        
        // 监听浏览器前进后退
        window.addEventListener('hashchange', () => {
            this.syncFromUrl();
        });
    }

    /**
     * 显示列表页
     */
    showList(type) {
        this.currentType = type;
        this.states[type] = {
            view: 'list',
            itemId: null
        };
        this.updateUrl(type, 'list', null);
        this.notify();
    }

    /**
     * 显示详情页
     */
    showDetail(type, itemId) {
        this.currentType = type;
        this.states[type] = {
            view: 'detail',
            itemId: itemId
        };
        this.updateUrl(type, 'detail', itemId);
        this.notify();
    }

    /**
     * 显示聊天页
     */
    showChat() {
        this.currentType = 'chat';
        this.states.chat = {
            view: 'chat',
            itemId: null
        };
        this.updateUrl('chat', 'chat', null);
        this.notify();
    }

    /**
     * 显示特殊视图（如"我的游戏"）
     */
    showSpecial(type, specialView) {
        this.currentType = type;
        this.states[type] = {
            view: specialView,
            itemId: null
        };
        this.updateUrl(type, specialView, null);
        this.notify();
    }

    /**
     * 返回列表页（从详情页）
     */
    backToList() {
        if (this.currentType && this.states[this.currentType]) {
            this.states[this.currentType].view = 'list';
            this.states[this.currentType].itemId = null;
            this.notify();
        }
    }

    /**
     * 关闭当前内容区
     */
    close() {
        if (this.currentType) {
            this.states[this.currentType] = null;
        }
        this.currentType = null;
        this.notify();
    }

    /**
     * 获取当前状态
     */
    getCurrentState() {
        if (!this.currentType) {
            return { view: 'empty' };
        }
        return this.states[this.currentType] || { view: 'empty' };
    }

    /**
     * 获取当前类型
     */
    getCurrentType() {
        return this.currentType;
    }

    /**
     * 订阅状态变化
     */
    subscribe(listener) {
        this.listeners.push(listener);
    }

    /**
     * 通知所有监听器
     */
    notify() {
        const state = this.getCurrentState();
        const type = this.getCurrentType();
        this.listeners.forEach(listener => listener(state, type));
    }

    /**
     * 更新URL（Hash路由）
     * @param {string} type - 内容类型
     * @param {string} view - 视图类型 (list/detail/chat)
     * @param {string|null} itemId - 内容ID（详情页专用）
     */
    updateUrl(type, view, itemId) {
        // 如果正在从URL同步，跳过更新（避免循环）
        if (this.syncing) {
            return;
        }

        let hash = '';
        
        if (view === 'list') {
            hash = `#/${type}/list`;
        } else if (view === 'detail' && itemId) {
            hash = `#/${type}/detail/${itemId}`;
        } else if (view === 'chat') {
            hash = `#/chat`;
        } else if (view === 'my' || view === 'upload' || view === 'edit') {
            // 特殊视图
            hash = `#/${type}/${view}`;
            if (itemId) hash += `/${itemId}`;
        } else {
            hash = '#/';
        }

        // 只在URL不同时才更新（避免重复历史记录）
        if (window.location.hash !== hash) {
            window.location.hash = hash;
        }
    }

    /**
     * 从URL同步状态（浏览器前进后退、直接访问链接）
     */
    syncFromUrl() {
        // 标记正在同步，避免循环更新
        this.syncing = true;

        const hash = window.location.hash.slice(1); // 移除开头的 #
        
        if (!hash || hash === '/') {
            // 空白页
            this.close();
            this.syncing = false;
            return;
        }

        // 解析hash: /type/view 或 /type/detail/id
        const parts = hash.split('/').filter(p => p);
        
        if (parts.length === 0) {
            this.close();
            this.syncing = false;
            return;
        }

        const type = parts[0];
        const view = parts[1] || 'list';
        const itemId = parts[2] || null;

        // 验证类型
        if (!['announcement', 'game', 'chat'].includes(type)) {
            console.warn('无效的内容类型:', type);
            this.syncing = false;
            return;
        }

        // 更新状态（不再更新URL，因为URL已经是正确的）
        this.currentType = type;
        
        if (type === 'chat') {
            this.states.chat = { view: 'chat', itemId: null };
        } else if (view === 'detail' && itemId) {
            this.states[type] = { view: 'detail', itemId: itemId };
        } else if (view === 'my' || view === 'upload' || view === 'edit') {
            // 特殊视图
            this.states[type] = { view: view, itemId: itemId };
        } else {
            this.states[type] = { view: 'list', itemId: null };
        }

        this.notify();
        this.syncing = false;
    }

    /**
     * 初始化：从URL恢复状态
     */
    initFromUrl() {
        this.syncFromUrl();
    }

    /**
     * 获取当前页面的分享链接
     */
    getShareUrl() {
        const baseUrl = window.location.origin + window.location.pathname;
        const hash = window.location.hash;
        return baseUrl + hash;
    }
}

// 创建全局单例
export const stateManager = new StateManager();


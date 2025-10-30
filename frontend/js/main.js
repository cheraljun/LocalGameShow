/**
 * 主入口文件
 * 初始化全局功能和状态管理系统
 */

import { RadioPlayer } from './components/RadioPlayer.js';
import { stateManager } from './core/StateManager.js';
import { MainContentArea } from './components/MainContentArea.js';
import { AnnouncementModal } from './components/AnnouncementModal.js';
import { authUI } from './components/AuthUI.js';

// 全局应用实例
class App {
    constructor() {
        this.stateManager = stateManager;
        this.mainContentArea = null;
        this.radioPlayer = null;
        this.announcementModal = null;
    }

    /**
     * 初始化应用
     */
    async init() {
        // 初始化主内容区
        const container = document.getElementById('main-content-area');
        if (container) {
            this.mainContentArea = new MainContentArea(container, this.stateManager);
        }

        // 初始化音频播放器（从API获取配置）
        if (document.getElementById('radio-player')) {
            await this.initRadioPlayer();
        }

        // 初始化公告模态框
        this.announcementModal = new AnnouncementModal();
        
        // 绑定Doge点击事件
        const dogeTrigger = document.getElementById('doge-announcement-trigger');
        if (dogeTrigger) {
            dogeTrigger.addEventListener('click', () => {
                this.showAnnouncement();
            });
            console.log('Doge公告触发器已绑定');
        }

        // 初始化用户认证UI
        authUI.initUserNav();

        // 绑定导航点击事件
        this.bindNavigation();

        // 从URL恢复状态（支持直接访问链接）
        this.stateManager.initFromUrl();

        console.log('游戏展示平台已就绪！');
    }

    /**
     * 初始化音频播放器（从API获取配置）
     */
    async initRadioPlayer() {
        try {
            const response = await fetch('/api/config/stream');
            const config = await response.json();
            
            this.radioPlayer = new RadioPlayer({
                streamUrl: config.url || 'https://n10as.radiocult.fm/stream'
            });
            console.log(`音频播放器已初始化 - ${config.name || '电台'}: ${config.url}`);
        } catch (error) {
            console.error('加载电台配置失败，使用默认配置:', error);
            // 失败时使用默认配置
            this.radioPlayer = new RadioPlayer({
                streamUrl: 'https://n10as.radiocult.fm/stream'
            });
            console.log('音频播放器已初始化（默认配置）');
        }
    }

    /**
     * 绑定导航
     */
    bindNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.nav;
                if (type === 'chat') {
                    this.showChat();
                } else {
                    this.showList(type);
                }
            });
        });
    }

    /**
     * 显示公告
     */
    showAnnouncement() {
        if (this.announcementModal) {
            this.announcementModal.show();
        }
    }

    /**
     * 显示列表页
     */
    showList(type) {
        // 清空搜索框
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // 隐藏搜索结果
        const searchContainer = document.getElementById('search-results-container');
        if (searchContainer) {
            searchContainer.style.display = 'none';
        }

        // 显示列表页
        this.stateManager.showList(type);
    }

    /**
     * 显示详情页
     */
    showDetail(type, itemId) {
        this.stateManager.showDetail(type, itemId);
    }

    /**
     * 显示聊天页
     */
    showChat() {
        // 清空搜索框
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // 隐藏搜索结果
        const searchContainer = document.getElementById('search-results-container');
        if (searchContainer) {
            searchContainer.style.display = 'none';
        }

        // 显示聊天页
        this.stateManager.showChat();
    }

    /**
     * 返回列表页
     */
    backToList() {
        this.stateManager.backToList();
    }

    /**
     * 关闭内容区
     */
    closeContent() {
        this.stateManager.close();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
    const app = new App();
    await app.init();
    
    // 挂载到全局，供HTML内联事件使用
    window.app = app;
});

export { App };

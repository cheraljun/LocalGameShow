/**
 * 音频播放器组件
 * 控制电台播放/暂停
 */

import { toast } from './Toast.js';

export class RadioPlayer {
    constructor(config = {}) {
        this.audioElement = null;
        this.playBtn = null;
        this.pauseBtn = null;
        this.streamUrl = config.streamUrl || 'https://n10as.radiocult.fm/stream';
        
        this.init();
    }

    /**
     * 初始化播放器
     */
    init() {
        // 获取DOM元素
        this.audioElement = document.getElementById('radio-player');
        this.playBtn = document.getElementById('play-btn');
        this.pauseBtn = document.getElementById('pause-btn');

        if (!this.audioElement || !this.playBtn || !this.pauseBtn) {
            console.error('播放器元素未找到');
            return;
        }

        // 设置音频源
        this.audioElement.src = this.streamUrl;
        console.log('音频源已设置:', this.streamUrl);

        // 绑定事件
        this.bindEvents();
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 播放按钮
        this.playBtn.addEventListener('click', () => this.play());
        
        // 暂停按钮
        this.pauseBtn.addEventListener('click', () => this.pause());
        
        // 监听播放错误
        this.audioElement.addEventListener('error', (e) => this.handleError(e));
    }

    /**
     * 播放音频
     */
    async play() {
        try {
            await this.audioElement.play();
            this.playBtn.style.display = 'none';
            this.pauseBtn.style.display = 'flex';
            console.log('电台播放中...');
        } catch (error) {
            console.error('播放失败:', error);
            toast.error('播放失败，请检查网络连接');
        }
    }

    /**
     * 暂停音频
     */
    pause() {
        this.audioElement.pause();
        this.pauseBtn.style.display = 'none';
        this.playBtn.style.display = 'flex';
        console.log('电台已暂停');
    }

    /**
     * 处理播放错误
     */
    handleError(e) {
        console.error('音频加载错误:', e);
        this.pauseBtn.style.display = 'none';
        this.playBtn.style.display = 'flex';
    }

    /**
     * 获取播放状态
     */
    isPlaying() {
        return !this.audioElement.paused;
    }
}


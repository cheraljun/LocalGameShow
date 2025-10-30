/**
 * 留言板
 * - 需要登录才能发送留言
 * - 自动从登录状态获取昵称
 */

import { toast } from '/js/components/Toast.js';
import { authUI } from '/js/components/AuthUI.js';

class ChatApp {
    constructor() {
        this.messages = [];
        this.userColors = new Map();
        this.colorIndex = 1;
        this.maxColors = 6;
        this.pollInterval = null;
        
        this.initElements();
        this.bindEvents();
        this.loadMessages();
        this.startPolling();
    }

    initElements() {
        this.messagesContainer = document.getElementById('messages');
        this.messageInput = document.getElementById('message-input');
        this.sendBtn = document.getElementById('send-btn');
    }

    bindEvents() {
        this.sendBtn.addEventListener('click', () => {
            this.sendMessage();
        });

        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    async sendMessage() {
        const text = this.messageInput.value.trim();
        
        if (!text) {
            toast.info('请输入留言内容');
            this.messageInput.focus();
            return;
        }

        const token = authUI.getToken();
        const currentUser = authUI.getCurrentUser();

        if (!token || !currentUser) {
            toast.error('请先登录');
            return;
        }

        try {
            const response = await fetch('/api/chat/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ text })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || '发送失败');
            }

            this.messageInput.value = '';
            this.messageInput.focus();
            
            await this.loadMessages();
        } catch (error) {
            console.error('发送消息失败:', error);
            toast.error(error.message || '发送失败，请重试');
        }
    }

    renderMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.className = 'message';
        
        const time = this.formatTime(message.timestamp);
        const username = message.username || message.user || '匿名';
        const color = this.getUserColor(username);
        
        messageEl.innerHTML = `
            <span class="message-time">[${time}]</span>
            <span class="message-user color-${color}">&lt;${this.escapeHtml(username)}&gt;</span>
            <span class="message-text">${this.escapeHtml(message.text)}</span>
        `;
        
        this.messagesContainer.appendChild(messageEl);
    }

    getUserColor(username) {
        if (!this.userColors.has(username)) {
            this.userColors.set(username, this.colorIndex);
            this.colorIndex = (this.colorIndex % this.maxColors) + 1;
        }
        return this.userColors.get(username);
    }

    formatTime(date) {
        const d = new Date(date);
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    async loadMessages() {
        try {
            const response = await fetch('/api/chat/messages');
            const data = await response.json();
            
            const serverMessages = data.messages || [];
            
            // 只在消息数量变化时重新渲染
            if (serverMessages.length !== this.messages.length) {
                this.messages = serverMessages;
                
                // 清空并重新渲染所有消息
                this.messagesContainer.innerHTML = '';
                this.messages.forEach(msg => {
                    this.renderMessage(msg);
                });
                
                this.scrollToBottom();
            }
        } catch (e) {
            console.error('加载消息失败:', e);
        }
    }

    startPolling() {
        // 每3秒自动刷新消息
        this.pollInterval = setInterval(() => {
            this.loadMessages();
        }, 3000);
    }

    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }
}

// 初始化留言板
document.addEventListener('DOMContentLoaded', () => {
    const app = new ChatApp();
    
    // 页面卸载时停止轮询
    window.addEventListener('beforeunload', () => {
        app.stopPolling();
    });
});

export default ChatApp;

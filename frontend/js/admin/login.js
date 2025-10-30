/**
 * 管理员登录页面
 * 使用验证码登录（管理员专用）
 */

class AdminLogin {
    constructor() {
        this.init();
    }
    
    init() {
        this.bindEvents();
        
        // 检查是否已登录
        this.checkExistingLogin();
    }
    
    /**
     * 检查是否已登录
     */
    async checkExistingLogin() {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        
        try {
            const res = await fetch('/api/auth/verify', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data.user.role === 'admin') {
                    window.location.href = '/admin/index.html';
                }
            }
        } catch (err) {
            console.error('验证失败:', err);
        }
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        const form = document.getElementById('login-form');
        const sendCodeBtn = document.getElementById('send-code-btn');
        const loginBtn = document.getElementById('login-btn');
        
        // 发送验证码
        sendCodeBtn.addEventListener('click', () => {
            this.sendCode();
        });
        
        // 登录
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });
        
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.login();
        });
        
        // Enter 键快捷登录
        document.getElementById('code').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.login();
            }
        });
    }
    
    /**
     * 发送验证码
     */
    async sendCode() {
        const email = document.getElementById('email').value.trim();
        const sendCodeBtn = document.getElementById('send-code-btn');
        
        if (!email) {
            this.showError('请输入邮箱地址');
            return;
        }
        
        // 禁用按钮
        sendCodeBtn.disabled = true;
        sendCodeBtn.textContent = '发送中...';
        
        try {
            const res = await fetch('/api/auth/login/send-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.detail || '发送失败');
            }
            
            const data = await res.json();
            this.showSuccess(data.message || '验证码已发送');
            
            // 显示验证码输入框和登录按钮
            document.getElementById('code').style.display = 'block';
            document.getElementById('login-btn').style.display = 'block';
            
            // 聚焦到验证码输入框
            document.getElementById('code').focus();
            
            // 启动60秒倒计时
            this.startCountdown(sendCodeBtn, 60);
            
        } catch (err) {
            console.error('发送验证码失败:', err);
            this.showError(err.message || '发送失败，请重试');
            
            // 恢复按钮
            sendCodeBtn.disabled = false;
            sendCodeBtn.textContent = '发送验证码';
        }
    }
    
    /**
     * 倒计时功能
     */
    startCountdown(btn, seconds) {
        let remaining = seconds;
        
        const timer = setInterval(() => {
            remaining--;
            btn.textContent = `${remaining}秒后重发`;
            
            if (remaining <= 0) {
                clearInterval(timer);
                btn.textContent = '重新发送';
                btn.disabled = false;
                btn.style.display = 'block';
            }
        }, 1000);
    }
    
    /**
     * 登录
     */
    async login() {
        const email = document.getElementById('email').value.trim();
        const code = document.getElementById('code').value.trim();
        const loginBtn = document.getElementById('login-btn');
        
        if (!code) {
            this.showError('请输入验证码');
            return;
        }
        
        // 禁用按钮
        loginBtn.disabled = true;
        loginBtn.textContent = '登录中...';
        
        try {
            const res = await fetch('/api/auth/login/code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, code })
            });
            
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.detail || '登录失败');
            }
            
            const data = await res.json();
            
            // 检查是否是管理员
            if (data.user.role !== 'admin') {
                throw new Error('您不是管理员');
            }
            
            // 保存 Token
            localStorage.setItem('authToken', data.access_token);
            
            this.showSuccess(`欢迎回来，${data.user.username}`);
            
            // 跳转到管理后台
            setTimeout(() => {
                window.location.href = '/admin/index.html';
            }, 500);
            
        } catch (err) {
            console.error('登录失败:', err);
            this.showError(err.message || '登录失败，请重试');
            
            // 恢复按钮
            loginBtn.disabled = false;
            loginBtn.textContent = '登录';
        }
    }
    
    /**
     * 显示错误消息
     */
    showError(message) {
        const errorMsg = document.getElementById('error-message');
        const successMsg = document.getElementById('success-message');
        
        successMsg.classList.remove('show');
        errorMsg.textContent = message;
        errorMsg.classList.add('show');
        
        setTimeout(() => {
            errorMsg.classList.remove('show');
        }, 3000);
    }
    
    /**
     * 显示成功消息
     */
    showSuccess(message) {
        const errorMsg = document.getElementById('error-message');
        const successMsg = document.getElementById('success-message');
        
        errorMsg.classList.remove('show');
        successMsg.textContent = message;
        successMsg.classList.add('show');
        
        setTimeout(() => {
            successMsg.classList.remove('show');
        }, 3000);
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new AdminLogin();
});


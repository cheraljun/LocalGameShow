/**
 * 用户认证 UI 组件
 * - 登录/注册
 * - 邮箱验证码
 * - 极简设计，无弹窗
 */

import { toast } from '/js/components/Toast.js';

class AuthUI {
    constructor() {
        this.currentUser = null;
        this.container = null;
        
        // 检查登录状态
        this.checkLoginStatus();
    }

    /**
     * 初始化用户导航
     */
    initUserNav() {
        const userNav = document.getElementById('user-nav');
        const loginLink = document.getElementById('login-link');
        
        if (this.currentUser) {
            // 已登录：显示用户名
            loginLink.textContent = this.currentUser.username;
            loginLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showUserMenu();
            });
        } else {
            // 未登录：显示登录链接
            loginLink.textContent = '登录';
            loginLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginForm();
            });
        }
    }

    /**
     * 检查登录状态
     */
    async checkLoginStatus() {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            return;
        }

        try {
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
            } else {
                // Token 无效，清除
                localStorage.removeItem('authToken');
            }
        } catch (error) {
            console.error('验证登录失败:', error);
        }
    }

    /**
     * 显示登录表单
     */
    showLoginForm() {
        const mainContent = document.getElementById('main-content-area');
        mainContent.style.display = 'block';

        mainContent.innerHTML = `
            <div class="auth-container">
                <div class="auth-tabs">
                    <a href="#" class="auth-tab active" id="tab-login">登录</a> | 
                    <a href="#" class="auth-tab" id="tab-register">注册</a>
                </div>

                <div class="auth-form" id="login-form">
                    <h2>登录</h2>
                    
                    <div class="form-group">
                        <label>邮箱</label>
                        <input type="email" id="login-email" placeholder="your@email.com">
                    </div>

                    <div class="form-group">
                        <label>密码</label>
                        <input type="password" id="login-password" placeholder="输入密码">
                    </div>

                    <div class="form-actions">
                        <a href="#" class="action-link" id="login-submit">登录</a>
                        <a href="#" class="action-link" id="login-with-code">验证码登录</a>
                    </div>
                </div>

                <div class="auth-form" id="register-form" style="display: none;">
                    <h2>注册</h2>
                    
                    <div class="form-group">
                        <label>邮箱</label>
                        <input type="email" id="register-email" placeholder="your@email.com">
                    </div>

                <div class="form-actions" id="send-code-section">
                    <a href="#" class="action-link" id="send-code">发送验证码</a>
                </div>

                <div id="verify-section" style="display: none;">
                    <div class="form-group">
                        <label>验证码（邮件已发送）</label>
                        <input type="text" id="register-code" placeholder="输入6位验证码" maxlength="6">
                        <a href="#" class="action-link" id="resend-code" style="margin-top: 0.5rem; font-size: 0.85rem;">重新发送</a>
                    </div>

                    <div class="form-group">
                        <label>密码（至少8位）</label>
                        <input type="password" id="register-password" placeholder="设置密码" minlength="8">
                    </div>

                    <div class="form-group">
                        <label>昵称（可选）</label>
                        <input type="text" id="register-username" placeholder="留空自动生成">
                    </div>

                    <div class="form-actions">
                        <a href="#" class="action-link" id="register-submit">注册</a>
                    </div>
                </div>
                </div>
            </div>
        `;

        this.bindAuthEvents();
    }

    /**
     * 绑定认证表单事件
     */
    bindAuthEvents() {
        // 切换标签
        document.getElementById('tab-login').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-form').style.display = 'block';
            document.getElementById('register-form').style.display = 'none';
            document.getElementById('tab-login').classList.add('active');
            document.getElementById('tab-register').classList.remove('active');
        });

        document.getElementById('tab-register').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('register-form').style.display = 'block';
            document.getElementById('tab-login').classList.remove('active');
            document.getElementById('tab-register').classList.add('active');
        });

        // 登录
        document.getElementById('login-submit').addEventListener('click', (e) => {
            e.preventDefault();
            this.login();
        });

        // 验证码登录
        document.getElementById('login-with-code').addEventListener('click', (e) => {
            e.preventDefault();
            this.loginWithCode();
        });

        // 发送注册验证码
        document.getElementById('send-code').addEventListener('click', (e) => {
            e.preventDefault();
            this.sendRegistrationCode();
        });

        // 注册
        document.getElementById('register-submit').addEventListener('click', (e) => {
            e.preventDefault();
            this.register();
        });
        
        // 重新发送验证码
        setTimeout(() => {
            const resendBtn = document.getElementById('resend-code');
            if (resendBtn) {
                resendBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.sendRegistrationCode();
                });
            }
        }, 100);

        // Enter键提交
        document.getElementById('login-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.login();
            }
        });
    }

    /**
     * 邮箱+密码登录
     */
    async login() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            toast.error('请输入邮箱和密码');
            return;
        }

        try {
            const response = await fetch('/api/auth/login/password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || '登录失败');
            }

            const data = await response.json();
            
            // 保存 Token
            localStorage.setItem('authToken', data.access_token);
            this.currentUser = data.user;

            toast.success(`欢迎回来，${data.user.username}`);
            
            // 关闭表单，刷新页面
            this.closeAuthForm();
            window.location.reload();

        } catch (error) {
            console.error('登录失败:', error);
            // 如果是管理员邮箱，提示使用验证码
            if (error.message.includes('管理员')) {
                toast.error('管理员请使用验证码登录');
            } else {
                toast.error(error.message || '登录失败，请重试');
            }
        }
    }

    /**
     * 验证码登录（显示表单）
     */
    async loginWithCode() {
        const mainContent = document.getElementById('main-content-area');
        mainContent.innerHTML = `
            <div class="auth-container">
                <h2>验证码登录</h2>
                
                <div class="form-group">
                    <label>邮箱</label>
                    <input type="email" id="code-login-email" placeholder="your@email.com">
                </div>

                <div class="form-actions" id="send-login-code-section">
                    <a href="#" class="action-link" id="send-login-code-btn">发送验证码</a>
                    <a href="#" class="action-link" id="back-to-password-login">返回</a>
                </div>

                <div id="login-code-section" style="display: none;">
                    <div class="form-group">
                        <label>验证码（邮件已发送）</label>
                        <input type="text" id="code-login-code" placeholder="输入6位验证码" maxlength="6">
                    </div>

                    <div class="form-actions">
                        <a href="#" class="action-link" id="code-login-submit">登录</a>
                    </div>
                </div>
            </div>
        `;

        // 绑定事件
        document.getElementById('send-login-code-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.sendLoginCode();
        });

        document.getElementById('back-to-password-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });

        document.getElementById('code-login-submit').addEventListener('click', (e) => {
            e.preventDefault();
            this.loginWithCodeSubmit();
        });
    }

    /**
     * 发送登录验证码
     */
    async sendLoginCode() {
        const email = document.getElementById('code-login-email').value.trim();

        if (!email) {
            toast.error('请输入邮箱地址');
            return;
        }

        try {
            const response = await fetch('/api/auth/login/send-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || '发送失败');
            }

            const data = await response.json();
            toast.success(data.message);

            // 显示验证码输入部分
            document.getElementById('send-login-code-section').style.display = 'none';
            document.getElementById('login-code-section').style.display = 'block';

        } catch (error) {
            console.error('发送验证码失败:', error);
            toast.error(error.message || '发送失败，请重试');
        }
    }

    /**
     * 验证码登录提交
     */
    async loginWithCodeSubmit() {
        const email = document.getElementById('code-login-email').value.trim();
        const code = document.getElementById('code-login-code').value.trim();

        if (!code) {
            toast.error('请输入验证码');
            return;
        }

        try {
            const response = await fetch('/api/auth/login/code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, code })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || '登录失败');
            }

            const data = await response.json();
            
            // 保存 Token
            localStorage.setItem('authToken', data.access_token);
            this.currentUser = data.user;

            toast.success(`欢迎回来，${data.user.username}`);
            
            // 关闭表单，刷新页面
            this.closeAuthForm();
            window.location.reload();

        } catch (error) {
            console.error('登录失败:', error);
            toast.error(error.message || '登录失败，请重试');
        }
    }

    /**
     * 发送注册验证码
     */
    async sendRegistrationCode() {
        const email = document.getElementById('register-email').value.trim();
        
        // 确定使用哪个按钮（首次发送 or 重新发送）
        let sendBtn = document.getElementById('resend-code');
        if (!sendBtn || sendBtn.style.display === 'none') {
            sendBtn = document.getElementById('send-code');
        }

        if (!email) {
            toast.error('请输入邮箱地址');
            return;
        }

        // 禁用按钮
        sendBtn.style.pointerEvents = 'none';
        sendBtn.style.opacity = '0.5';
        const originalText = sendBtn.textContent;
        sendBtn.textContent = '发送中...';

        try {
            const response = await fetch('/api/auth/register/send-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || '发送失败');
            }

            const data = await response.json();
            toast.success(data.message);

            // 显示验证部分
            const sendSection = document.getElementById('send-code-section');
            const verifySection = document.getElementById('verify-section');
            
            // 第一次发送：隐藏发送按钮，显示验证部分
            if (sendSection && sendSection.style.display !== 'none') {
                sendSection.style.display = 'none';
                verifySection.style.display = 'block';
            }
            
            // 找到重新发送按钮并启动倒计时
            const resendBtn = document.getElementById('resend-code');
            if (resendBtn) {
                this.startResendCountdown(resendBtn, 60);
            } else {
                this.startCountdown(sendBtn, 60);
            }

        } catch (error) {
            console.error('发送验证码失败:', error);
            toast.error(error.message || '发送失败，请重试');
            
            // 恢复按钮
            sendBtn.style.pointerEvents = '';
            sendBtn.style.opacity = '';
            sendBtn.textContent = originalText;
        }
    }
    
    /**
     * 倒计时功能（用于"重新发送"按钮）
     */
    startCountdown(btn, seconds) {
        let remaining = seconds;
        btn.style.pointerEvents = 'none';
        btn.style.opacity = '0.5';
        
        const timer = setInterval(() => {
            remaining--;
            btn.textContent = `${remaining}秒后重发`;
            
            if (remaining <= 0) {
                clearInterval(timer);
                btn.textContent = '重新发送';
                btn.style.pointerEvents = '';
                btn.style.opacity = '';
            }
        }, 1000);
    }
    
    /**
     * 重新发送倒计时（针对 resend-code 按钮）
     */
    startResendCountdown(btn, seconds) {
        let remaining = seconds;
        const originalText = btn.textContent;
        btn.style.pointerEvents = 'none';
        btn.style.opacity = '0.5';
        
        const timer = setInterval(() => {
            remaining--;
            btn.textContent = `${remaining}秒后重发`;
            
            if (remaining <= 0) {
                clearInterval(timer);
                btn.textContent = '重新发送';
                btn.style.pointerEvents = '';
                btn.style.opacity = '';
            }
        }, 1000);
    }

    /**
     * 注册
     */
    async register() {
        const email = document.getElementById('register-email').value.trim();
        const code = document.getElementById('register-code').value.trim();
        const password = document.getElementById('register-password').value;
        const username = document.getElementById('register-username').value.trim();

        if (!code || !password) {
            toast.error('请填写验证码和密码');
            return;
        }

        if (password.length < 8) {
            toast.error('密码至少需要8位字符');
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    code,
                    password,
                    username: username || null
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || '注册失败');
            }

            const data = await response.json();
            
            // 保存 Token（注册成功自动登录）
            localStorage.setItem('authToken', data.access_token);
            this.currentUser = data.user;

            toast.success(`注册成功，欢迎 ${data.user.username}`);
            
            // 关闭表单，刷新页面
            this.closeAuthForm();
            window.location.reload();

        } catch (error) {
            console.error('注册失败:', error);
            toast.error(error.message || '注册失败，请重试');
        }
    }

    /**
     * 显示用户菜单
     */
    showUserMenu() {
        const mainContent = document.getElementById('main-content-area');
        mainContent.style.display = 'block';

        const isAdmin = this.currentUser.role === 'admin';

        mainContent.innerHTML = `
            <div class="user-menu">
                <h2>${this.currentUser.username}</h2>
                <p>邮箱: ${this.currentUser.email}</p>
                
                <div class="user-actions">
                    ${isAdmin ? `
                        <a href="/admin/index.html" class="action-link">管理后台</a>
                    ` : ''}
                    <a href="#" class="action-link" id="my-games">我的游戏</a>
                    <a href="#" class="action-link" id="change-username">修改昵称</a>
                    <a href="#" class="action-link danger" id="logout-btn">退出登录</a>
                    <a href="#" class="action-link danger" id="delete-account-btn">删除账户</a>
                </div>
            </div>
        `;

        // 绑定事件
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });

        const myGamesBtn = document.getElementById('my-games');
        if (myGamesBtn) {
            myGamesBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // 关闭用户菜单，跳转到"我的游戏"页面
                this.closeAuthForm();
                window.location.hash = '#/game/my';
            });
        }

        const changeUsernameBtn = document.getElementById('change-username');
        if (changeUsernameBtn) {
            changeUsernameBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showChangeUsernameForm();
            });
        }

        const deleteAccountBtn = document.getElementById('delete-account-btn');
        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleDeleteAccount(deleteAccountBtn);
            });
        }
    }

    /**
     * 显示修改昵称表单
     */
    showChangeUsernameForm() {
        const mainContent = document.getElementById('main-content-area');
        mainContent.innerHTML = `
            <div class="user-menu">
                <h2>修改昵称</h2>
                
                <div class="form-group">
                    <label>新昵称</label>
                    <input type="text" id="new-username" placeholder="输入新昵称" value="${this.currentUser.username}">
                </div>
                
                <div class="user-actions">
                    <a href="#" class="action-link" id="submit-change-username">确认修改</a>
                    <a href="#" class="action-link" id="cancel-change-username">取消</a>
                </div>
            </div>
        `;
        
        document.getElementById('submit-change-username').addEventListener('click', (e) => {
            e.preventDefault();
            this.changeUsername();
        });
        
        document.getElementById('cancel-change-username').addEventListener('click', (e) => {
            e.preventDefault();
            this.showUserMenu();
        });
    }

    /**
     * 修改昵称
     */
    async changeUsername() {
        const newUsername = document.getElementById('new-username').value.trim();
        
        if (!newUsername) {
            toast.error('请输入新昵称');
            return;
        }
        
        if (newUsername.length < 2) {
            toast.error('昵称至少需要2个字符');
            return;
        }
        
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/auth/change-username', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: newUsername })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || '修改失败');
            }
            
            const data = await response.json();
            this.currentUser.username = data.user.username;
            
            toast.success('昵称修改成功');
            this.showUserMenu();
            
        } catch (error) {
            console.error('修改昵称失败:', error);
            toast.error(error.message || '修改失败，请重试');
        }
    }

    /**
     * 处理删除账户（二次确认）
     */
    handleDeleteAccount(btn) {
        const isConfirming = btn.dataset.confirming === 'true';
        
        if (!isConfirming) {
            // 第一次点击：变红色，文字变成"确认删除"
            btn.dataset.confirming = 'true';
            btn.dataset.originalText = btn.textContent;
            btn.textContent = '确认删除';
            btn.style.color = '#c00';
            
            // 3秒后自动恢复
            setTimeout(() => {
                if (btn.dataset.confirming === 'true') {
                    btn.dataset.confirming = 'false';
                    btn.textContent = btn.dataset.originalText;
                    btn.style.color = '';
                }
            }, 3000);
        } else {
            // 第二次点击：执行删除
            btn.dataset.confirming = 'false';
            btn.textContent = btn.dataset.originalText;
            btn.style.color = '';
            
            this.deleteAccount();
        }
    }

    /**
     * 删除账户
     */
    async deleteAccount() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/auth/delete-account', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || '删除失败');
            }
            
            toast.success('账户已删除');
            
            // 清除登录信息，刷新页面
            localStorage.removeItem('authToken');
            this.currentUser = null;
            
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
        } catch (error) {
            console.error('删除账户失败:', error);
            toast.error(error.message || '删除失败，请重试');
        }
    }

    /**
     * 退出登录
     */
    logout() {
        localStorage.removeItem('authToken');
        this.currentUser = null;
        toast.info('已退出登录');
        window.location.reload();
    }

    /**
     * 关闭认证表单
     */
    closeAuthForm() {
        const mainContent = document.getElementById('main-content-area');
        mainContent.style.display = 'none';
        mainContent.innerHTML = '';
    }

    /**
     * 获取当前用户
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * 获取Token
     */
    getToken() {
        return localStorage.getItem('authToken');
    }
}

// 创建全局实例
const authUI = new AuthUI();

export { authUI };


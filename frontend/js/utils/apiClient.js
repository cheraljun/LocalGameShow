/**
 * 统一的 API 客户端
 */

export class ApiClient {
    constructor(baseUrl = '/api') {
        this.baseUrl = baseUrl;
        this.token = null;
    }

    /**
     * 设置认证 Token
     */
    setToken(token) {
        this.token = token;
    }

    /**
     * 获取请求头
     */
    getHeaders(includeAuth = false) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    /**
     * GET 请求
     */
    async get(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'GET',
                headers: this.getHeaders(options.auth),
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('GET 请求失败:', error);
            throw error;
        }
    }

    /**
     * POST 请求
     */
    async post(endpoint, data, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: this.getHeaders(options.auth),
                body: JSON.stringify(data),
                ...options
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('POST 请求失败:', error);
            throw error;
        }
    }

    /**
     * PUT 请求
     */
    async put(endpoint, data, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'PUT',
                headers: this.getHeaders(options.auth),
                body: JSON.stringify(data),
                ...options
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('PUT 请求失败:', error);
            throw error;
        }
    }

    /**
     * DELETE 请求
     */
    async delete(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'DELETE',
                headers: this.getHeaders(options.auth),
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('DELETE 请求失败:', error);
            throw error;
        }
    }

    /**
     * 文件上传请求
     */
    async upload(endpoint, formData, options = {}) {
        try {
            const headers = {};
            
            // 添加认证头
            if (options.auth && this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }
            
            // 注意：不要设置 Content-Type，让浏览器自动设置（包含boundary）
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: headers,
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('文件上传失败:', error);
            throw error;
        }
    }
}

// 创建全局实例
export const api = new ApiClient();

/**
 * 导航图标智能加载器
 * 支持多种格式（GIF、PNG等），自动检测并加载可用的图标
 */

import { NAV_ICON_CONFIG } from '../config/pageConfigs.js';

/**
 * 检查图片是否存在
 * @param {string} url - 图片URL
 * @returns {Promise<boolean>}
 */
async function checkImageExists(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
}

/**
 * 获取可用的图标URL
 * @param {string} iconName - 图标名称（如 'research'）
 * @returns {Promise<string>} - 返回可用的图标URL
 */
async function getAvailableIconUrl(iconName) {
    const config = NAV_ICON_CONFIG[iconName];
    
    if (!config) {
        console.warn(`未找到图标配置: ${iconName}`);
        return null;
    }

    // 按优先级检查各种格式
    for (const format of config.formats) {
        const url = `/images/${config.name}.${format}`;
        const exists = await checkImageExists(url);
        if (exists) {
            return url;
        }
    }

    console.warn(`未找到可用的图标: ${iconName}`);
    return null;
}

/**
 * 初始化所有导航图标
 * 自动检测并加载最佳格式的图标
 */
export async function initNavIcons() {
    // 支持新旧两种HTML结构
    const navButtons = document.querySelectorAll('button[data-nav], .nav-link a[data-window]');
    
    for (const button of navButtons) {
        const windowType = button.getAttribute('data-nav') || button.getAttribute('data-window');
        const imgElement = button.querySelector('.nav-icon');
        
        if (!imgElement) continue;

        // 获取可用的图标URL
        const iconUrl = await getAvailableIconUrl(windowType);
        
        if (iconUrl) {
            imgElement.src = iconUrl;
            
            // 如果是GIF，添加特殊标记
            if (iconUrl.endsWith('.gif')) {
                imgElement.classList.add('animated-icon');
            }
        }
    }
}

/**
 * 预加载所有导航图标
 * 提升用户体验
 */
export async function preloadNavIcons() {
    const preloadPromises = Object.keys(NAV_ICON_CONFIG).map(async (iconName) => {
        const iconUrl = await getAvailableIconUrl(iconName);
        if (iconUrl) {
            const img = new Image();
            img.src = iconUrl;
        }
    });
    
    await Promise.all(preloadPromises);
}


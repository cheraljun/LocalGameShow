/**
 * 页面配置
 * 统一管理所有页面的配置信息
 */

/**
 * 用户端页面配置
 */
export const USER_PAGE_CONFIGS = {
    announcement: {
        type: 'announcement',
        containerId: 'announcement-container',
        emptyIcon: '',
        emptyTitle: '暂无通告',
        emptyMessage: ''
    },
    game: {
        type: 'game',
        containerId: 'game-container',
        emptyIcon: '',
        emptyTitle: '暂无游戏',
        emptyMessage: ''
    },
    chat: {
        type: 'chat',
        containerId: 'chat-container',
        emptyIcon: '',
        emptyTitle: '暂无留言',
        emptyMessage: ''
    }
};

/**
 * 管理后台页面配置
 */
export const ADMIN_PAGE_CONFIG = {
    defaultType: 'announcement',
    types: {
        announcement: {
            title: '通告管理',
            subtitle: '发布系统通知和公告',
            icon: ''
        },
        game: {
            title: '游戏管理',
            subtitle: '管理已上传的游戏',
            icon: ''
        }
    }
};

/**
 * 导航图标配置
 * 支持多种格式，优先级：gif > png
 */
export const NAV_ICON_CONFIG = {
    announcement: {
        name: 'nav-announcement',
        alt: '通告',
        formats: ['gif', 'png']
    },
    game: {
        name: 'nav-game',
        alt: '游戏',
        formats: ['gif', 'png']
    },
    chat: {
        name: 'nav-chat',
        alt: '留言',
        formats: ['gif', 'png']
    }
};

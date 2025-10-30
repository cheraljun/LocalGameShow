/**
 * 图片上传组件
 */
import { api } from '../utils/apiClient.js';
import { toast } from './Toast.js';

export class ImageUploader {
    constructor(options = {}) {
        this.options = {
            multiple: true,          // 是否允许多选
            maxFiles: 16,            // 最大文件数（4x4网格）
            accept: 'image/*',       // 接受的文件类型
            compactMode: false,      // 紧凑模式（加号在网格内）
            onUploadStart: null,     // 开始上传回调
            onUploadProgress: null,  // 上传进度回调
            onUploadSuccess: null,   // 上传成功回调
            onUploadError: null,     // 上传失败回调
            ...options
        };
        
        this.uploadedImages = [];
        this.createElements();
    }

    /**
     * 创建上传组件 DOM
     */
    createElements() {
        this.container = document.createElement('div');
        this.container.className = this.options.compactMode ? 'image-uploader compact-mode' : 'image-uploader';
        
        if (this.options.compactMode) {
            // 紧凑模式：只有预览网格和进度条
        this.container.innerHTML = `
                <input type="file" 
                       id="file-input" 
                       accept="${this.options.accept}"
                       ${this.options.multiple ? 'multiple' : ''}
                       style="display: none;">
                <div class="uploader-preview-grid" id="preview"></div>
                <div class="uploader-progress" id="progress" style="display: none;">
                    <div class="progress-bar"></div>
                    <div class="progress-text">上传中...</div>
                </div>
            `;
        } else {
            // 标准模式：拖拽区 + 预览 + 进度条
            this.container.innerHTML = `
                <div class="uploader-dropzone" id="dropzone">
                <input type="file" 
                       id="file-input" 
                       accept="${this.options.accept}"
                       ${this.options.multiple ? 'multiple' : ''}
                       style="display: none;">
                <div class="uploader-hint">
                    <p style="font-size: 32px; margin: 0;">📷</p>
                    <p style="font-weight: bold; margin: 10px 0;">点击或拖拽图片到这里上传</p>
                    <p style="font-size: 12px; color: #666; margin: 0;">
                        支持 JPG、PNG、GIF、BMP 等格式，自动转换为 WebP
                    </p>
                </div>
            </div>
            <div class="uploader-preview" id="preview"></div>
            <div class="uploader-progress" id="progress" style="display: none;">
                <div class="progress-bar"></div>
                <div class="progress-text">上传中...</div>
            </div>
        `;
        }
        
        this.fileInput = this.container.querySelector('#file-input');
        this.dropzone = this.container.querySelector('#dropzone');
        this.preview = this.container.querySelector('#preview');
        this.progressEl = this.container.querySelector('#progress');
        
        this.bindEvents();
        
        // 紧凑模式下初始渲染加号按钮
        if (this.options.compactMode) {
            this.renderCompactGrid();
        }
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 文件选择
        this.fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        if (this.options.compactMode) {
            // 紧凑模式：使用事件委托处理动态生成的元素
            this.preview.addEventListener('click', (e) => {
                const addBtn = e.target.closest('.uploader-add-btn');
                if (addBtn) {
                    this.fileInput.click();
                }
            });

            // 拖拽事件（事件委托）
            this.preview.addEventListener('dragover', (e) => {
                const addBtn = e.target.closest('.uploader-add-btn');
                if (addBtn) {
                    e.preventDefault();
                    addBtn.classList.add('dragover');
                }
            });

            this.preview.addEventListener('dragleave', (e) => {
                const addBtn = e.target.closest('.uploader-add-btn');
                if (addBtn) {
                    addBtn.classList.remove('dragover');
                }
            });

            this.preview.addEventListener('drop', (e) => {
                const addBtn = e.target.closest('.uploader-add-btn');
                if (addBtn) {
                    e.preventDefault();
                    addBtn.classList.remove('dragover');
                    this.handleFiles(e.dataTransfer.files);
                }
            });

            // 删除按钮事件委托
            this.preview.addEventListener('click', (e) => {
                const removeBtn = e.target.closest('.remove-btn');
                if (removeBtn) {
                    e.stopPropagation();
                    const index = parseInt(removeBtn.dataset.index);
                    if (!isNaN(index)) {
                        this.removeImageByIndex(index);
                    }
                }
            });
        } else {
            // 标准模式：拖拽区事件
            this.dropzone.addEventListener('click', () => {
                this.fileInput.click();
            });

        this.dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropzone.classList.add('dragover');
        });

        this.dropzone.addEventListener('dragleave', () => {
            this.dropzone.classList.remove('dragover');
        });

        this.dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropzone.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });
        }
    }

    /**
     * 处理选中的文件
     */
    async handleFiles(files) {
        const fileArray = Array.from(files);
        
        // 检查当前已有图片数量
        const remainingSlots = this.options.maxFiles - this.uploadedImages.length;
        if (fileArray.length > remainingSlots) {
            toast.info(`最多上传 ${this.options.maxFiles} 张图片，当前还可以上传 ${remainingSlots} 张`);
            return;
        }

        // 验证文件
        const validFiles = fileArray.filter(file => {
            // 检查类型
            if (!file.type.startsWith('image/')) {
                toast.info(`${file.name} 不是图片文件`);
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        await this.uploadFiles(validFiles);
    }

    /**
     * 上传文件
     */
    async uploadFiles(files) {
        this.showProgress(true);
        
        if (this.options.onUploadStart) {
            this.options.onUploadStart(files);
        }

        try {
            const formData = new FormData();
            
            if (files.length === 1) {
                // 单文件上传
                formData.append('file', files[0]);
                const response = await this.uploadSingle(formData);
                this.addUploadedImage(response);
            } else {
                // 多文件上传
                files.forEach(file => {
                    formData.append('files', file);
                });
                const response = await this.uploadMultiple(formData);
                response.uploaded.forEach(img => this.addUploadedImage(img));
                
                // 显示上传统计
                if (response.uploaded.length > 0) {
                    const totalOriginal = response.uploaded.reduce((sum, img) => sum + img.original_size, 0);
                    const totalCompressed = response.uploaded.reduce((sum, img) => sum + img.compressed_size, 0);
                    const avgCompression = ((1 - totalCompressed / totalOriginal) * 100).toFixed(1);
                    console.log(`上传成功 ${response.uploaded.length} 张图片，平均压缩率: ${avgCompression}%`);
                }
                
                // 显示错误
                if (response.errors.length > 0) {
                    const errors = response.errors.map(e => 
                        `${e.filename}: ${e.error}`
                    ).join(', ');
                    toast.error('部分文件上传失败: ' + errors);
                }
            }

            if (this.options.onUploadSuccess) {
                this.options.onUploadSuccess(this.uploadedImages);
            }

        } catch (error) {
            console.error('上传失败:', error);
            toast.error('上传失败: ' + error.message);
            
            if (this.options.onUploadError) {
                this.options.onUploadError(error);
            }
        } finally {
            this.showProgress(false);
            this.fileInput.value = ''; // 清空文件选择
        }
    }

    /**
     * 上传单个文件
     */
    async uploadSingle(formData) {
        return await api.upload('/upload/image', formData, { auth: true });
    }

    /**
     * 上传多个文件
     */
    async uploadMultiple(formData) {
        return await api.upload('/upload/images', formData, { auth: true });
    }

    /**
     * 添加已上传的图片到预览
     */
    addUploadedImage(imageData) {
        this.uploadedImages.push(imageData.url);
        
        if (this.options.compactMode) {
            // 紧凑模式：重新渲染整个网格
            this.renderCompactGrid();
        } else {
            // 标准模式：追加卡片
            const imageCard = document.createElement('div');
            imageCard.className = 'image-preview-card';
            imageCard.innerHTML = `
                <img src="${imageData.url}" alt="上传的图片">
                <button class="remove-btn">×</button>
            `;
            
            // 删除按钮
            const removeBtn = imageCard.querySelector('.remove-btn');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeImage(imageData.url, imageCard);
            });
            
            this.preview.appendChild(imageCard);
        }
    }
    
    /**
     * 渲染紧凑模式的网格（包括图片和加号按钮）
     */
    renderCompactGrid() {
        let html = '';
        
        // 渲染已上传的图片
        this.uploadedImages.forEach((url, index) => {
            html += `
                <div class="uploader-grid-item has-image">
                    <img src="${url}" alt="图片 ${index + 1}">
                    <button class="remove-btn" data-index="${index}">×</button>
                </div>
            `;
        });
        
        // 如果未达到上限，显示加号按钮
        if (this.uploadedImages.length < this.options.maxFiles) {
            html += `
                <div class="uploader-grid-item uploader-add-btn">
                    <span>+</span>
                </div>
            `;
        }
        
        this.preview.innerHTML = html;
    }

    /**
     * 移除图片（标准模式使用）
     */
    removeImage(url, element) {
        const index = this.uploadedImages.indexOf(url);
        if (index > -1) {
            this.uploadedImages.splice(index, 1);
        }
        element.remove();
    }
    
    /**
     * 根据索引移除图片（紧凑模式使用）
     */
    removeImageByIndex(index) {
        if (index >= 0 && index < this.uploadedImages.length) {
            this.uploadedImages.splice(index, 1);
            this.renderCompactGrid();
        }
    }

    /**
     * 显示/隐藏进度条
     */
    showProgress(show) {
        this.progressEl.style.display = show ? 'block' : 'none';
    }

    /**
     * 获取已上传的图片 URL 列表
     */
    getUploadedImages() {
        return this.uploadedImages;
    }

    /**
     * 设置已有图片（编辑时使用）
     */
    setImages(images) {
        this.uploadedImages = [...images];
        
        if (this.options.compactMode) {
            this.renderCompactGrid();
        } else {
            // 标准模式：直接渲染，避免重复 push
            this.preview.innerHTML = '';
            images.forEach((url, index) => {
                const imageCard = document.createElement('div');
                imageCard.className = 'image-preview-card';
                imageCard.innerHTML = `
                    <img src="${url}" alt="上传的图片">
                    <button class="remove-btn">×</button>
                `;
                
                // 删除按钮
                const removeBtn = imageCard.querySelector('.remove-btn');
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removeImage(url, imageCard);
                });
                
                this.preview.appendChild(imageCard);
            });
        }
    }

    /**
     * 清空上传的图片
     */
    clear() {
        this.uploadedImages = [];
        
        if (this.options.compactMode) {
            this.renderCompactGrid();
        } else {
            this.preview.innerHTML = '';
        }
    }

    /**
     * 渲染组件
     */
    render() {
        return this.container;
    }
}

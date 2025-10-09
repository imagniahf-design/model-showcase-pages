// Admin Panel JavaScript
class ModelShowcase {
    constructor() {
        // Multiple password options for easier access
        this.adminPasswords = ['My birthday1.', 'admin', 'password', '123', ''];
        this.models = JSON.parse(localStorage.getItem('models')) || [];
        this.folders = JSON.parse(localStorage.getItem('folders')) || [
            { id: 'default', name: 'All Models', color: '#3b82f6', type: 'model' },
            { id: 'favorites', name: 'Favorites', color: '#f59e0b', type: 'model' },
            { id: 'pages', name: 'Model Pages', color: '#8b5cf6', type: 'page' }
        ];
        this.currentFolder = localStorage.getItem('currentFolder') || 'default';
        this.publishing = JSON.parse(localStorage.getItem('publishing')) || {
            // GitHub Pages compatible storage
            storageType: 'github', // 'github', 'cloudflare', 'local'
            githubToken: '',
            githubRepo: '',
            githubUsername: '',
            // Cloudflare R2 (backup option)
            accessKey: '5d73ffa0d1686a2d1ae6d342a9f1aea1',
            secretKey: 'a3fcecaff178fe966f9c0a34ce7466709815f9fe641c00ca7185b977cf0aaca6',
            accountId: '3e1268bf3af1ebe8d31efa35cf6832e2',
            publicUrl: 'https://pub-80de14f69b6048d6b5ca9266a1aa6d1e.r2.dev',
            keepLocal: true,
            publishOnUpload: true
        };
        this.init();
        // Internal guards
        this.eventsBound = false;
        this.isUploading = false;
        this.isPublishing = false;
    }

    init() {
        this.setupEventListeners();
        this.renderFolders();
        this.loadModels();
        
        // Auto-login for easier access
        if (window.location.search.includes('auto=true')) {
            setTimeout(() => {
                document.getElementById('login-screen').classList.add('hidden');
                document.getElementById('admin-panel').classList.remove('hidden');
                this.renderFolders();
                this.loadModels();
            }, 100);
        }
    }

    setupEventListeners() {
        if (this.eventsBound) return; // prevent duplicate bindings
        // Login form
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // File upload
        const fileInput = document.getElementById('file-input');
        const uploadArea = document.getElementById('upload-area');

        fileInput.addEventListener('change', (e) => {
            console.log('File input changed, files:', e.target.files);
            this.handleFileUpload(e.target.files);
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFileUpload(e.dataTransfer.files);
        });

        // Click to upload
        uploadArea.addEventListener('click', () => {
            console.log('Upload area clicked');
            fileInput.click();
        });

        // Publishing settings
        const cfAccessKey = document.getElementById('cf-access-key');
        const cfSecretKey = document.getElementById('cf-secret-key');
        const cfAccountId = document.getElementById('cf-account-id');
        const cfPublicUrl = document.getElementById('cf-public-url');
        const savePublishing = document.getElementById('save-publishing');
        const testConnection = document.getElementById('test-connection');
        const clearPublishing = document.getElementById('clear-publishing');
        const publishingStatus = document.getElementById('publishing-status');
        const publishAllBtn = document.getElementById('publish-all');
        const refreshCloudBtn = document.getElementById('refresh-cloud');
        const modelsHint = document.getElementById('models-hint');
        const keepLocalToggle = document.getElementById('cf-keep-local');
        const publishOnUploadToggle = document.getElementById('cf-publish-on-upload');
        const addSampleBtn = document.getElementById('add-sample-model');
        // GitHub inputs
        const githubToken = document.getElementById('github-token');
        const githubUsername = document.getElementById('github-username');
        const githubRepo = document.getElementById('github-repo');

        if (cfAccessKey && cfSecretKey && cfAccountId && cfPublicUrl) {
            cfAccessKey.value = this.publishing.accessKey || '';
            cfSecretKey.value = this.publishing.secretKey || '';
            cfAccountId.value = this.publishing.accountId || '';
            cfPublicUrl.value = this.publishing.publicUrl || '';
            if (keepLocalToggle) keepLocalToggle.checked = this.publishing.keepLocal !== false;
            if (publishOnUploadToggle) publishOnUploadToggle.checked = this.publishing.publishOnUpload === true;
            // Prefill GitHub inputs from saved publishing
            if (githubToken) githubToken.value = this.publishing.githubToken || '';
            if (githubUsername) githubUsername.value = this.publishing.githubUsername || 'imagniahf-design';
            if (githubRepo) githubRepo.value = this.publishing.githubRepo || 'model-showcase-pages';

            savePublishing?.addEventListener('click', () => {
                this.publishing = {
                    storageType: (document.getElementById('storage-type')?.value) || 'github',
                    githubToken: githubToken.value.trim(),
                    githubUsername: githubUsername.value.trim(),
                    githubRepo: githubRepo.value.trim(),
                    accessKey: cfAccessKey.value.trim(),
                    secretKey: cfSecretKey.value.trim(),
                    accountId: cfAccountId.value.trim(),
                    publicUrl: cfPublicUrl.value.trim(),
                    keepLocal: keepLocalToggle?.checked !== false,
                    publishOnUpload: publishOnUploadToggle?.checked === true
                };
                localStorage.setItem('publishing', JSON.stringify(this.publishing));
                publishingStatus.textContent = '✅ Settings saved successfully!';
                publishingStatus.style.color = '#22c55e';
                setTimeout(() => {
                    publishingStatus.textContent = '';
                    publishingStatus.style.color = '#718096';
                }, 3000);
            });

            testConnection?.addEventListener('click', async () => {
                if (this.publishing.storageType === 'github') {
                    if (!this.publishing.githubToken || !this.publishing.githubUsername || !this.publishing.githubRepo) {
                        publishingStatus.textContent = '❌ Please fill in all GitHub settings first!';
                        publishingStatus.style.color = '#ef4444';
                        return;
                    }

                    publishingStatus.textContent = '🔗 Testing connection to GitHub repository...';
                    publishingStatus.style.color = '#3b82f6';
                    
                    try {
                        const response = await this.testGitHubConnection();
                        publishingStatus.textContent = '✅ Connection successful! GitHub repository is ready.';
                        publishingStatus.style.color = '#22c55e';
                        setTimeout(()=> {
                            publishingStatus.textContent = '';
                            publishingStatus.style.color = '#718096';
                        }, 5000);
                    } catch (error) {
                        publishingStatus.textContent = `❌ Connection failed: ${error.message}`;
                        publishingStatus.style.color = '#ef4444';
                        setTimeout(()=> {
                            publishingStatus.textContent = '';
                            publishingStatus.style.color = '#718096';
                        }, 5000);
                    }
                } else if (this.publishing.storageType === 'cloudflare') {
                    if (!this.publishing.accessKey || !this.publishing.secretKey || !this.publishing.accountId || !this.publishing.publicUrl) {
                        publishingStatus.textContent = '❌ Please fill in all Cloudflare settings first!';
                        publishingStatus.style.color = '#ef4444';
                        return;
                    }

                    publishingStatus.textContent = '🔗 Testing connection to Cloudflare R2...';
                    publishingStatus.style.color = '#3b82f6';
                    
                    try {
                        const testData = new TextEncoder().encode('test');
                        const response = await this.testCloudflareConnection(testData);
                        publishingStatus.textContent = '✅ Connection successful! Cloudflare R2 is ready.';
                        publishingStatus.style.color = '#22c55e';
                        setTimeout(()=> {
                            publishingStatus.textContent = '';
                            publishingStatus.style.color = '#718096';
                        }, 5000);
                    } catch (error) {
                        publishingStatus.textContent = `❌ Connection failed: ${error.message}`;
                        publishingStatus.style.color = '#ef4444';
                        setTimeout(()=> {
                            publishingStatus.textContent = '';
                            publishingStatus.style.color = '#718096';
                        }, 5000);
                    }
                } else {
                    publishingStatus.textContent = '✅ Local storage mode - no connection test needed.';
                    publishingStatus.style.color = '#22c55e';
                    setTimeout(()=> {
                        publishingStatus.textContent = '';
                        publishingStatus.style.color = '#718096';
                    }, 3000);
                }
            });

            clearPublishing?.addEventListener('click', () => {
                cfAccessKey.value = '';
                cfSecretKey.value = '';
                cfAccountId.value = '';
                cfPublicUrl.value = '';
                this.publishing = { keepLocal: true, publishOnUpload: false };
                localStorage.removeItem('publishing');
                publishingStatus.textContent = '🗑️ Settings cleared!';
                publishingStatus.style.color = '#f59e0b';
                setTimeout(() => {
                    publishingStatus.textContent = '';
                    publishingStatus.style.color = '#718096';
                }, 3000);
            });

            publishAllBtn?.addEventListener('click', async () => {
                if (!this.publishing.accessKey || !this.publishing.secretKey || !this.publishing.accountId || !this.publishing.publicUrl) {
                    alert('Please fill Publishing Settings first.');
                    return;
                }
                publishingStatus.textContent = 'Publishing all models...';
                try {
                    for (const model of this.models) {
                        await this.publishModelIfConfigured(model);
                    }
                    publishingStatus.textContent = 'All models published successfully.';
                } catch (e) {
                    console.error(e);
                    publishingStatus.textContent = 'Error while publishing some models. Check console.';
                } finally {
                    setTimeout(()=> publishingStatus.textContent = '', 4000);
                }
            });

            refreshCloudBtn?.addEventListener('click', async () => {
                modelsHint.textContent = 'Refreshing...';
                try {
                    await this.loadModels();
                } finally {
                    modelsHint.textContent = '';
                }
            });

            addSampleBtn?.addEventListener('click', async () => {
                const sampleModel = {
                    id: this.generateModelId(),
                    name: 'Sample Model',
                    previewImage: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjdmYWZjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2EwYWVjMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPjNEIE1vZGVsIFByZXZpZXc8L3RleHQ+PC9zdmc+',
                    createdAt: new Date().toISOString(),
                    folderId: this.currentFolder,
                    isFavorite: false
                };
                this.models.push(sampleModel);
                this.saveModels();
                this.loadModels();
                try {
                    await this.publishModelIfConfigured(sampleModel);
                    alert('Sample model added and published.');
                } catch (_) {
                    alert('Sample model added locally. Configure publishing to upload.');
                }
            });

            // Folder management
            const createFolderBtn = document.getElementById('create-folder');
            const newFolderName = document.getElementById('new-folder-name');

            createFolderBtn?.addEventListener('click', () => {
                const name = newFolderName.value.trim();
                if (name) {
                    this.createFolder(name);
                    newFolderName.value = '';
                } else {
                    alert('Please enter a folder name');
                }
            });

            newFolderName?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    createFolderBtn.click();
                }
            });

            // Enhanced folder management
            const createModelPageFolderBtn = document.getElementById('create-model-page-folder');
            const generatePagesBtn = document.getElementById('generate-pages');

            createModelPageFolderBtn?.addEventListener('click', () => {
                const name = prompt('Enter folder name for model pages:');
                if (name) {
                    this.createFolder(name, '#8b5cf6', 'page');
                }
            });

            generatePagesBtn?.addEventListener('click', async () => {
                if (confirm('Generate individual HTML pages for all models? This will create separate pages for each model.')) {
                    await this.generateModelPages();
                }
            });

            // Storage type change handler
            const storageTypeSelect = document.getElementById('storage-type');
            const githubSettings = document.getElementById('github-settings');
            const cloudflareSettings = document.getElementById('cloudflare-settings');

            storageTypeSelect?.addEventListener('change', (e) => {
                const storageType = e.target.value;
                if (storageType === 'github') {
                    githubSettings.style.display = 'grid';
                    cloudflareSettings.style.display = 'none';
                } else if (storageType === 'cloudflare') {
                    githubSettings.style.display = 'none';
                    cloudflareSettings.style.display = 'grid';
                } else {
                    githubSettings.style.display = 'none';
                    cloudflareSettings.style.display = 'none';
                }
            });

            // Initialize storage type display
            const currentStorageType = this.publishing.storageType || 'github';
            storageTypeSelect.value = currentStorageType;
            storageTypeSelect.dispatchEvent(new Event('change'));
            
            // Pre-fill GitHub settings if not already set
            if (this.publishing.storageType === 'github') {
                if (!this.publishing.githubUsername) {
                    this.publishing.githubUsername = 'imagniahf-design';
                }
                if (!this.publishing.githubRepo) {
                    this.publishing.githubRepo = 'model-showcase-pages';
                }
                this.savePublishing();
                // Reflect into inputs
                if (githubUsername) githubUsername.value = this.publishing.githubUsername;
                if (githubRepo) githubRepo.value = this.publishing.githubRepo;
            }
        }
        this.eventsBound = true;
    }

    handleLogin() {
        const password = document.getElementById('password').value.trim();
        const errorMessage = document.getElementById('error-message');

        console.log('Entered password:', password);
        console.log('Valid passwords:', this.adminPasswords);
        console.log('Match:', this.adminPasswords.includes(password));

        if (this.adminPasswords.includes(password) || password === '') {
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('admin-panel').classList.remove('hidden');
            this.loadModels();
        } else {
            errorMessage.textContent = 'Invalid password. Try: My birthday1., admin, password, 123, or leave empty';
        }
    }

    logout() {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('admin-panel').classList.add('hidden');
        document.getElementById('password').value = '';
    }

    async handleFileUpload(files) {
        if (this.isUploading) {
            console.warn('Upload already in progress; ignoring new request');
            return;
        }
        this.isUploading = true;
        console.log('Files received:', files);
        console.log('Files array length:', files.length);
        
        // Check if files is valid
        if (!files || files.length === 0) {
            alert('No files selected. Please choose .glb and .usdz files.');
            return;
        }
        
        const glbFile = Array.from(files).find(file => file.name.toLowerCase().endsWith('.glb'));
        const usdzFile = Array.from(files).find(file => file.name.toLowerCase().endsWith('.usdz'));

        console.log('GLB file found:', glbFile);
        console.log('USDZ file found:', usdzFile);

        if (!glbFile) {
            alert('Please upload a .glb file. Make sure the file extension is .glb');
            return;
        }

        if (!usdzFile) {
            alert('Please upload a .usdz file. Make sure the file extension is .usdz');
            return;
        }

        this.showUploadProgress();
        const uploadContainer = document.getElementById('upload-area');
        if (uploadContainer) uploadContainer.style.pointerEvents = 'none';

        try {
            const modelId = this.generateModelId();
            const modelName = glbFile.name.replace('.glb', '');

            // Create preview image from GLB file
            const previewImage = await this.createPreviewImage(glbFile);

            // Create model metadata (no large file storage)
            const modelMetadata = {
                id: modelId,
                name: modelName,
                previewImage: previewImage,
                createdAt: new Date().toISOString(),
                uploaded: true,
                readyToPublish: true,
                folderId: this.currentFolder,
                isFavorite: false
            };
            
            // Always store metadata locally (it's small)
            this.models.push(modelMetadata);
            this.saveModels();
            this.loadModels();
            
            // Create model for publishing (with full file data)
            const modelForPublishing = {
                ...modelMetadata,
                glbFile: await this.fileToBase64(glbFile),
                usdzFile: await this.fileToBase64(usdzFile)
            };
            
            // Auto-publish if configured
            if (this.publishing.publishOnUpload && this.publishing.storageType === 'github') {
                try {
                    if (this.isPublishing) throw new Error('A publish is already in progress');
                    this.isPublishing = true;
                    console.log('Auto-publishing model to GitHub...', {
                        storageType: this.publishing.storageType,
                        hasToken: !!this.publishing.githubToken,
                        hasUsername: !!this.publishing.githubUsername,
                        hasRepo: !!this.publishing.githubRepo
                    });
                    await this.publishModelIfConfigured(modelForPublishing);
                    console.log('Model auto-published successfully to GitHub');
                    alert('✅ Model uploaded and published to GitHub successfully!');
                } catch (error) {
                    console.error('Auto-publish failed:', error);
                    alert(`❌ Auto-publish failed: ${error.message}. You can publish manually later.`);
                } finally {
                    this.isPublishing = false;
                }
            } else {
                console.log('Auto-publish skipped:', {
                    publishOnUpload: this.publishing.publishOnUpload,
                    storageType: this.publishing.storageType
                });
                // Show manual publish option
                alert('📤 Model uploaded locally. Click "Publish" button to upload to GitHub.');
            }

            // Model uploaded successfully - ready for manual publishing
            console.log('Model uploaded successfully:', modelMetadata.id);
            this.hideUploadProgress();

            alert('Model uploaded successfully!');
        } catch (error) {
            console.error('Upload error:', error);
            console.error('Error details:', error.message);
            console.error('Error stack:', error.stack);
            alert(`Error uploading files: ${error.message}. Please check the console for details.`);
            this.hideUploadProgress();
        } finally {
            this.isUploading = false;
            if (uploadContainer) uploadContainer.style.pointerEvents = '';
        }
    }

    async publishModelIfConfigured(model) {
        console.log('Publishing settings:', this.publishing);
        
        if (this.publishing.storageType === 'github') {
            return await this.publishToGitHub(model);
        } else if (this.publishing.storageType === 'cloudflare') {
            return await this.publishToCloudflare(model);
        } else {
            console.log('Local storage only - no publishing');
            return;
        }
    }

    async publishToGitHub(model) {
        const { githubToken, githubUsername, githubRepo } = this.publishing;
        if (!githubToken || !githubUsername || !githubRepo) {
            throw new Error('Please configure GitHub credentials in Storage Settings');
        }

        try {
            // Upload model files to GitHub
            const glbUrl = await this.uploadToGitHub(`models/${model.id}/model.glb`, model.glbFile);
            const usdzUrl = await this.uploadToGitHub(`models/${model.id}/model.usdz`, model.usdzFile);
            const posterUrl = await this.uploadToGitHub(`models/${model.id}/poster.jpg`, model.previewImage);

            // Create manifest
            const manifest = {
                id: model.id,
                name: model.name,
                description: model.description,
                glbFile: glbUrl,
                usdzFile: usdzUrl,
                previewImage: posterUrl,
                createdAt: model.createdAt,
                theme: model.theme || {}
            };

            // Upload manifest
            const manifestUrl = await this.uploadToGitHub(`models/${model.id}.json`, JSON.stringify(manifest, null, 2));

            // Auto-generate a standalone HTML page for this model and upload it
            const pageHtml = this.buildStandaloneModelPage({
                name: model.name,
                description: model.description || '',
                glbUrl,
                usdzUrl,
                previewImage: posterUrl
            });
            await this.uploadToGitHub(`models/${model.id}/index.html`, pageHtml);

            // Update index
            await this.updateGitHubIndex(model.id);

            console.log('Model published successfully to GitHub');
            // Mark as uploaded in local list
            const local = this.models.find(m => m.id === model.id);
            if (local) {
                local.uploaded = true;
                this.saveModels();
                this.loadModels();
            }
        } catch (error) {
            console.error('Failed to publish model to GitHub:', error);
            throw error;
        }
    }

    async uploadToGitHub(path, content) {
        const { githubToken, githubUsername, githubRepo } = this.publishing;
        const apiUrl = `https://api.github.com/repos/${githubUsername}/${githubRepo}/contents/${path}`;
        // Convert content to base64 if it's not already
        let base64Content;
        if (typeof content === 'string' && content.startsWith('data:')) {
            base64Content = content.split(',')[1];
        } else if (typeof content === 'string') {
            base64Content = btoa(unescape(encodeURIComponent(content)));
        } else {
            // Unsupported type; require data URL or string
            throw new Error('Invalid content type for upload');
        }

        // Check if file exists to include sha for updates (avoid 422)
        let existingSha = undefined;
        try {
            const headRes = await fetch(apiUrl, {
                headers: { 'Authorization': `token ${githubToken}` }
            });
            if (headRes.ok) {
                const json = await headRes.json();
                existingSha = json.sha;
            }
        } catch (_) {
            // ignore
        }

        const putBody = {
            message: `${existingSha ? 'Update' : 'Add'} ${path}`,
            content: base64Content,
            sha: existingSha
        };

        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(putBody)
        });

        if (!response.ok) {
            // Handle 409 conflict (sha mismatch) by fetching latest sha and retrying once
            if (response.status === 409) {
                try {
                    const latestRes = await fetch(apiUrl, {
                        headers: { 'Authorization': `token ${githubToken}` }
                    });
                    if (latestRes.ok) {
                        const latestJson = await latestRes.json();
                        const retryBody = {
                            message: `Update ${path}`,
                            content: base64Content,
                            sha: latestJson.sha
                        };
                        const retry = await fetch(apiUrl, {
                            method: 'PUT',
                            headers: {
                                'Authorization': `token ${githubToken}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(retryBody)
                        });
                        if (!retry.ok) {
                            const retryErr = await retry.text();
                            throw new Error(`GitHub upload failed after retry: ${retry.status} - ${retryErr}`);
                        }
                        const retryResult = await retry.json();
                        return retryResult.content.download_url;
                    }
                } catch (e) {
                    const msg = await response.text().catch(()=> '');
                    throw new Error(`GitHub upload failed: 409 - ${msg}`);
                }
            }
            const error = await response.text();
            throw new Error(`GitHub upload failed: ${response.status} - ${error}`);
        }

        const result = await response.json();
        return result.content.download_url;
    }

    async updateGitHubIndex(modelId) {
        const { githubToken, githubUsername, githubRepo } = this.publishing;
        
        // Get existing index
        let index = [];
        try {
            const indexResponse = await fetch(`https://api.github.com/repos/${githubUsername}/${githubRepo}/contents/models/index.json`, {
                headers: { 'Authorization': `token ${githubToken}` }
            });
            if (indexResponse.ok) {
                const indexData = await indexResponse.json();
                index = JSON.parse(atob(indexData.content));
            }
        } catch (e) {
            // Index doesn't exist yet
        }

        // Add model ID if not already present
        if (!index.includes(modelId)) {
            index.push(modelId);
            
            // Upload updated index
            await this.uploadToGitHub('models/index.json', JSON.stringify(index, null, 2));
        }
    }

    async publishToCloudflare(model) {
        const { accessKey, secretKey, accountId, publicUrl } = this.publishing;
        if (!accessKey || !secretKey || !accountId || !publicUrl) {
            throw new Error('Please configure Cloudflare R2 credentials in Storage Settings');
        }

        try {
            // Upload GLB file to Cloudflare R2
            const glbUrl = await this.uploadToCloudflareR2(
                `models/${model.id}/model.glb`,
                this.base64ToArrayBuffer(model.glbFile.split(',')[1]),
                'application/octet-stream',
                accessKey,
                secretKey,
                accountId,
                publicUrl
            );

            // Upload USDZ file to Cloudflare R2
            const usdzUrl = await this.uploadToCloudflareR2(
                `models/${model.id}/model.usdz`,
                this.base64ToArrayBuffer(model.usdzFile.split(',')[1]),
                'application/octet-stream',
                accessKey,
                secretKey,
                accountId,
                publicUrl
            );

            // Upload poster image to Cloudflare R2
            const posterUrl = await this.uploadToCloudflareR2(
                `models/${model.id}/poster.jpg`,
                this.base64ToArrayBuffer(model.previewImage.split(',')[1]),
                'image/jpeg',
                accessKey,
                secretKey,
                accountId,
                publicUrl
            );

            // Create manifest with Cloudflare R2 URLs
            const manifest = {
                id: model.id,
                name: model.name,
                description: model.description,
                glbFile: glbUrl,
                usdzFile: usdzUrl,
                previewImage: posterUrl,
                createdAt: model.createdAt,
                theme: model.theme || {}
            };

            // Upload manifest to Cloudflare R2
            const manifestUrl = await this.uploadToCloudflareR2(
                `models/${model.id}.json`,
                new TextEncoder().encode(JSON.stringify(manifest, null, 2)),
                'application/json',
                accessKey,
                secretKey,
                accountId,
                publicUrl
            );

            // Update index in Cloudflare R2
            await this.updateCloudflareIndex(model.id, accessKey, secretKey, accountId, publicUrl);

            console.log('Model published successfully to Cloudflare R2');
        } catch (error) {
            console.error('Failed to publish model:', error);
            throw error;
        }
    }

    async uploadToCloudflareR2(key, data, contentType, accessKey, secretKey, accountId, publicUrl) {
        // Try multiple upload methods to handle CORS issues
        const uploadMethods = [
            // Method 1: Direct R2 S3-compatible endpoint
            () => this.uploadDirectR2(key, data, contentType, accessKey, secretKey, accountId, publicUrl),
            // Method 2: Using Cloudflare API with proper headers
            () => this.uploadViaAPI(key, data, contentType, accessKey, secretKey, accountId, publicUrl),
            // Method 3: Using public URL with CORS headers
            () => this.uploadViaPublicUrl(key, data, contentType, publicUrl)
        ];
        
        for (let i = 0; i < uploadMethods.length; i++) {
            try {
                console.log(`Trying upload method ${i + 1} for ${key}`);
                const result = await uploadMethods[i]();
                console.log(`Upload method ${i + 1} successful for ${key}`);
                return result;
            } catch (error) {
                console.warn(`Upload method ${i + 1} failed for ${key}:`, error.message);
                if (i === uploadMethods.length - 1) {
                    throw new Error(`All upload methods failed. Last error: ${error.message}. This is likely a CORS configuration issue on your R2 bucket.`);
                }
            }
        }
    }
    
    async uploadDirectR2(key, data, contentType, accessKey, secretKey, accountId, publicUrl) {
        const endpoint = `https://${accountId}.r2.cloudflarestorage.com/model-showcase-storage/${key}`;
        
        const response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': contentType,
                'x-amz-acl': 'public-read'
            },
            body: data
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Direct R2 upload failed: ${response.status} - ${errorText}`);
        }

        return `${publicUrl}/${key}`;
    }
    
    async uploadViaAPI(key, data, contentType, accessKey, secretKey, accountId, publicUrl) {
        const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/model-showcase-storage/objects/${encodeURIComponent(key)}`;
        
        const response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessKey}`,
                'Content-Type': contentType
            },
            body: data
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API upload failed: ${response.status} - ${errorText}`);
        }

        return `${publicUrl}/${key}`;
    }
    
    async uploadViaPublicUrl(key, data, contentType, publicUrl) {
        // This method won't work without proper CORS, but let's try it
        const endpoint = `${publicUrl}/${key}`;
        
        const response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': contentType
            },
            body: data
        });

        if (!response.ok) {
            throw new Error(`Public URL upload failed: ${response.status}`);
        }

        return endpoint;
    }

    async testGitHubConnection() {
        const { githubToken, githubUsername, githubRepo } = this.publishing;
        if (!githubToken || !githubUsername || !githubRepo) {
            throw new Error('GitHub settings not configured');
        }

        console.log('Testing GitHub connection with:', { 
            username: githubUsername,
            repo: githubRepo,
            token: githubToken.substring(0, 8) + '...'
        });

        // Test by checking if we can access the repository
        const apiUrl = `https://api.github.com/repos/${githubUsername}/${githubRepo}`;
        
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Repository not found. Please check the repository name and username.');
            } else if (response.status === 401) {
                throw new Error('Invalid GitHub token. Please check your token permissions.');
            } else {
                throw new Error(`GitHub API error: ${response.status} - ${response.statusText}`);
            }
        }

        const repoData = await response.json();
        console.log('GitHub connection test successful:', repoData.full_name);
        return true;
    }

    async testCloudflareConnection(testData) {
        const { accessKey, secretKey, accountId, publicUrl } = this.publishing;
        if (!accessKey || !secretKey || !accountId || !publicUrl) {
            throw new Error('Cloudflare settings not configured');
        }

        console.log('Testing Cloudflare connection with:', { 
            accessKey: accessKey.substring(0, 8) + '...', 
            accountId, 
            publicUrl,
            secretKey: secretKey.substring(0, 8) + '...'
        });

        // Validate credential formats
        if (accessKey.length < 10) {
            throw new Error('Access Key appears to be too short');
        }
        if (secretKey.length < 10) {
            throw new Error('Secret Key appears to be too short');
        }
        if (!accountId.match(/^[a-f0-9]{32}$/)) {
            throw new Error('Account ID format appears invalid (should be 32 hex characters)');
        }
        if (!publicUrl.startsWith('https://')) {
            throw new Error('Public URL should start with https://');
        }

        // Test using the same multiple upload methods as the main upload function
        try {
            const testKey = `test/connection-test-${Date.now()}.txt`;
            const testData = new TextEncoder().encode('test connection');
            
            console.log('Testing connection with multiple upload methods...');
            
            // Use the same upload function that handles CORS issues
            const result = await this.uploadToCloudflareR2(
                testKey,
                testData,
                'text/plain',
                accessKey,
                secretKey,
                accountId,
                publicUrl
            );
            
            console.log('Connection test successful:', result);
            return true;
        } catch (error) {
            console.error('Connection test failed:', error);
            throw new Error(`Connection test failed: ${error.message}`);
        }
    }

    async updateCloudflareIndex(modelId, accessKey, secretKey, accountId, publicUrl) {
        // Get existing index
        let index = [];
        try {
            const indexResponse = await fetch(`${publicUrl}/models/index.json`);
            if (indexResponse.ok) {
                index = await indexResponse.json();
            }
        } catch (e) {
            // Index doesn't exist yet
        }

        // Add model ID if not already present
        if (!index.includes(modelId)) {
            index.push(modelId);
            
            // Upload updated index
            await this.uploadToCloudflareR2(
                'models/index.json',
                new TextEncoder().encode(JSON.stringify(index, null, 2)),
                'application/json',
                accessKey,
                secretKey,
                accountId,
                publicUrl
            );
        }
    }

    base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    async createPreviewImage(glbFile) {
        // For now, return a placeholder. In a real implementation,
        // you would use Three.js or similar to render the model
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjdmYWZjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2EwYWVjMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPjNEIE1vZGVsIFByZXZpZXc8L3RleHQ+PC9zdmc+';
    }

    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    generateModelId() {
        return 'model_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    showUploadProgress() {
        document.getElementById('upload-progress').classList.remove('hidden');
    }

    hideUploadProgress() {
        document.getElementById('upload-progress').classList.add('hidden');
    }

    saveModels() {
        localStorage.setItem('models', JSON.stringify(this.models));
    }

    savePublishing() {
        try {
            localStorage.setItem('publishing', JSON.stringify(this.publishing));
        } catch (_) {
            // ignore storage quota issues
        }
    }

    saveFolders() {
        localStorage.setItem('folders', JSON.stringify(this.folders));
        localStorage.setItem('currentFolder', this.currentFolder);
    }

    createFolder(name, color = '#3b82f6', type = 'model') {
        const folder = {
            id: 'folder_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: name,
            color: color,
            type: type
        };
        this.folders.push(folder);
        this.saveFolders();
        this.renderFolders();
    }

    async generateModelPages() {
        const models = this.models.filter(m => m.uploaded);
        if (models.length === 0) {
            alert('No uploaded models found. Please upload some models first.');
            return;
        }

        try {
            for (const model of models) {
                await this.createModelPage(model);
            }
            alert(`Generated ${models.length} model pages successfully!`);
        } catch (error) {
            console.error('Error generating model pages:', error);
            alert(`Error generating pages: ${error.message}`);
        }
    }

    async createModelPage(model) {
        const pageContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${model.name} - 3D Model</title>
    <link rel="stylesheet" href="../styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎯</text></svg>">
</head>
<body>
    <div style="background: #0f172a; color: white; font-family: Inter, sans-serif; min-height: 100vh;">
        <header style="padding: 1rem; text-align: center; border-bottom: 1px solid #1e293b;">
            <h1 style="margin: 0; font-size: 1.5rem;">🎯 ${model.name}</h1>
            <p style="margin: 0.5rem 0 0 0; color: #94a3b8;">3D Model Viewer</p>
        </header>
        
        <main style="padding: 2rem; max-width: 1200px; margin: 0 auto;">
            <div style="background: #1e293b; border-radius: 1rem; padding: 1rem; margin-bottom: 2rem;">
                <model-viewer 
                    src="${model.glbUrl || '#'}" 
                    ios-src="${model.usdzUrl || '#'}"
                    alt="${model.name}"
                    ar 
                    ar-modes="scene-viewer quick-look webxr" 
                    camera-controls 
                    auto-rotate 
                    autoplay
                    environment-image="neutral" 
                    poster="${model.previewImage}"
                    ar-placement="floor"
                    ar-scale="auto"
                    interaction-policy="allow-when-focused"
                    style="width: 100%; height: 500px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
                    
                    <button slot="ar-button" style="
                        position: absolute;
                        bottom: 16px;
                        left: 50%;
                        transform: translateX(-50%);
                        padding: 12px 24px;
                        font-size: 16px;
                        font-weight: bold;
                        background: #000;
                        color: #fff;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    ">
                        START AR
                    </button>
                </model-viewer>
            </div>
            
            <div style="text-align: center;">
                <p style="color: #94a3b8; margin-bottom: 1rem;">Share this model with others</p>
                <button onclick="navigator.clipboard.writeText(window.location.href); alert('Link copied!');" style="
                    padding: 0.75rem 1.5rem;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    font-weight: 600;
                ">
                    📋 Copy Share Link
                </button>
            </div>
        </main>
    </div>
    
    <script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script>
</body>
</html>`;

        // Store the page content for later upload
        model.pageContent = pageContent;
        model.pageGenerated = true;
        this.saveModels();
    }

    buildStandaloneModelPage({ name, description, glbUrl, usdzUrl, previewImage }) {
        // Convert GitHub API URLs to raw content URLs for direct access
        const rawGlbUrl = glbUrl.replace('api.github.com/repos/', 'raw.githubusercontent.com/').replace('/contents/', '/').replace('?ref=main', '');
        const rawUsdzUrl = usdzUrl.replace('api.github.com/repos/', 'raw.githubusercontent.com/').replace('/contents/', '/').replace('?ref=main', '');
        const rawPosterUrl = previewImage.replace('api.github.com/repos/', 'raw.githubusercontent.com/').replace('/contents/', '/').replace('?ref=main', '');
        
        // Add iOS-specific parameters to USDZ URL for better compatibility
        const iosUsdzUrl = `${rawUsdzUrl}#allowsContentScaling=1&filename=${encodeURIComponent(name)}.usdz`;
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name} - 3D Model</title>
    <link rel="stylesheet" href="../../styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎯</text></svg>">
    <style>
        .ar-button {
            position: absolute;
            bottom: 16px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            font-size: 16px;
            font-weight: bold;
            background: #000;
            color: #fff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 10;
        }
        .ios-ar-link {
            display: none;
            position: absolute;
            bottom: 16px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            font-size: 16px;
            font-weight: bold;
            background: #007AFF;
            color: #fff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            text-decoration: none;
            z-index: 10;
        }
        @media (max-width: 768px) {
            .ar-button, .ios-ar-link {
                bottom: 8px;
                padding: 10px 20px;
                font-size: 14px;
            }
        }
    </style>
</head>
<body>
    <div style="background: #0f172a; color: white; font-family: Inter, sans-serif; min-height: 100vh;">
        <header style="padding: 1rem; text-align: center; border-bottom: 1px solid #1e293b;">
            <h1 style="margin: 0; font-size: 1.5rem;">🎯 ${name}</h1>
            ${description ? `<p style="margin: 0.5rem 0 0 0; color: #94a3b8;">${description}</p>` : ''}
        </header>
        <main style="padding: 2rem; max-width: 1200px; margin: 0 auto;">
            <div style="background: #1e293b; border-radius: 1rem; padding: 1rem; margin-bottom: 2rem; position: relative;">
                <model-viewer 
                    src="${rawGlbUrl}" 
                    ios-src="${iosUsdzUrl}"
                    alt="${name}"
                    ar 
                    ar-modes="scene-viewer quick-look webxr" 
                    camera-controls 
                    auto-rotate 
                    autoplay
                    environment-image="neutral" 
                    poster="${rawPosterUrl}"
                    ar-placement="floor"
                    ar-scale="auto"
                    interaction-policy="allow-when-focused"
                    style="width: 100%; height: 500px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
                    <button slot="ar-button" class="ar-button">START AR</button>
                </model-viewer>
                
                <!-- iOS Quick Look fallback button -->
                <button onclick="openInAR('${iosUsdzUrl}')" class="ios-ar-link" id="ios-ar-link">
                    📱 Start AR (iOS)
                </button>
            </div>
            
            <!-- Debug info (remove in production) -->
            <div style="background: #1e293b; border-radius: 0.5rem; padding: 1rem; margin-top: 1rem; font-size: 0.8rem; color: #94a3b8;">
                <details>
                    <summary>🔧 Debug Info</summary>
                    <p><strong>GLB URL:</strong> <a href="${rawGlbUrl}" target="_blank" style="color: #60a5fa;">${rawGlbUrl}</a></p>
                    <p><strong>USDZ URL:</strong> <a href="${rawUsdzUrl}" target="_blank" style="color: #60a5fa;">${rawUsdzUrl}</a></p>
                    <p><strong>iOS USDZ:</strong> <a href="${iosUsdzUrl}" target="_blank" style="color: #60a5fa;">${iosUsdzUrl}</a></p>
                    <p><strong>Poster:</strong> <a href="${rawPosterUrl}" target="_blank" style="color: #60a5fa;">${rawPosterUrl}</a></p>
                </details>
            </div>
        </main>
    </div>
    <script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script>
    <script>
        // iOS capability detection and AR button management
        document.addEventListener('DOMContentLoaded', function() {
            const modelViewer = document.querySelector('model-viewer');
            const arButton = document.querySelector('.ar-button');
            const iosArLink = document.querySelector('#ios-ar-link');
            
            // Check if device supports iOS Quick Look
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const supportsQuickLook = isIOS && 'ontouchstart' in window;
            
            if (supportsQuickLook) {
                // Hide model-viewer AR button, show native iOS AR link
                if (arButton) arButton.style.display = 'none';
                if (iosArLink) iosArLink.style.display = 'block';
            } else {
                // Show model-viewer AR button, hide iOS link
                if (arButton) arButton.style.display = 'block';
                if (iosArLink) iosArLink.style.display = 'none';
            }
            
            // Test USDZ accessibility
            fetch('${rawUsdzUrl}', { method: 'HEAD' })
                .then(response => {
                    console.log('USDZ accessibility test:', response.status, response.headers.get('content-type'));
                    if (response.status !== 200) {
                        console.warn('USDZ file may not be accessible:', response.status);
                    }
                })
                .catch(error => {
                    console.error('USDZ accessibility test failed:', error);
                });
        });
    </script>
</body>
</html>`;
    }

    deleteFolder(folderId) {
        if (folderId === 'default' || folderId === 'favorites') {
            alert('Cannot delete default folders');
            return;
        }
        
        if (confirm('Are you sure you want to delete this folder? Models will be moved to "All Models".')) {
            // Move models to default folder
            this.models.forEach(model => {
                if (model.folderId === folderId) {
                    model.folderId = 'default';
                }
            });
            
            this.folders = this.folders.filter(f => f.id !== folderId);
            if (this.currentFolder === folderId) {
                this.currentFolder = 'default';
            }
            this.saveFolders();
            this.saveModels();
            this.renderFolders();
            this.loadModels();
        }
    }

    showUsdzConverter() {
        const converterModal = document.createElement('div');
        converterModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;
        
        converterModal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1e293b, #334155);
                border: 1px solid #475569;
                border-radius: 16px;
                padding: 2rem;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="margin: 0; color: #f1f5f9; font-size: 1.5rem;">🔄 Convert GLB to USDZ</h2>
                    <button onclick="this.closest('.converter-modal').remove()" style="
                        background: none;
                        border: none;
                        color: #94a3b8;
                        font-size: 1.5rem;
                        cursor: pointer;
                        padding: 0.5rem;
                    ">✕</button>
                </div>
                
                <div style="color: #cbd5e1; line-height: 1.6;">
                    <p style="margin-bottom: 1rem;">To fix iOS AR issues, you need to convert your GLB file to USDZ format. Here are the best methods:</p>
                    
                    <div style="background: #0f172a; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                        <h3 style="color: #60a5fa; margin-top: 0;">🍎 Method 1: Apple Reality Converter (Recommended)</h3>
                        <ol style="margin: 0.5rem 0; padding-left: 1.5rem;">
                            <li>Download <a href="https://developer.apple.com/augmented-reality/tools/" target="_blank" style="color: #60a5fa;">Reality Converter</a> (free from Apple)</li>
                            <li>Open your GLB file in Reality Converter</li>
                            <li>Export as USDZ with these settings:
                                <ul style="margin: 0.5rem 0; padding-left: 1rem;">
                                    <li>✅ Embed textures</li>
                                    <li>✅ Use relative paths</li>
                                    <li>✅ Optimize for AR</li>
                                </ul>
                            </li>
                        </ol>
                    </div>
                    
                    <div style="background: #0f172a; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                        <h3 style="color: #60a5fa; margin-top: 0;">🌐 Method 2: Online Converters</h3>
                        <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                            <li><a href="https://products.aspose.app/3d/conversion/glb-to-usdz" target="_blank" style="color: #60a5fa;">Aspose 3D Converter</a></li>
                            <li><a href="https://convertio.co/glb-usdz/" target="_blank" style="color: #60a5fa;">Convertio</a></li>
                            <li><a href="https://www.anyconv.com/glb-to-usdz-converter/" target="_blank" style="color: #60a5fa;">AnyConv</a></li>
                        </ul>
                    </div>
                    
                    <div style="background: #0f172a; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                        <h3 style="color: #60a5fa; margin-top: 0;">⚙️ Method 3: Command Line (Advanced)</h3>
                        <pre style="background: #000; padding: 0.5rem; border-radius: 4px; font-size: 0.8rem; overflow-x: auto; margin: 0.5rem 0;">
# Install usdz-converter (requires macOS)
pip install usdz-converter
usdz-converter input.glb output.usdz</pre>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #059669, #10b981); border-radius: 8px; padding: 1rem; margin-top: 1rem;">
                        <h4 style="color: white; margin-top: 0;">💡 Pro Tips for iOS AR Success:</h4>
                        <ul style="margin: 0.5rem 0; padding-left: 1.5rem; color: white;">
                            <li>Keep file size under 200MB</li>
                            <li>Use simple materials and textures</li>
                            <li>Test with Apple's sample USDZ first</li>
                            <li>Ensure textures are embedded, not external</li>
                        </ul>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 1.5rem;">
                    <button onclick="this.closest('.converter-modal').remove()" style="
                        flex: 1;
                        padding: 0.75rem;
                        background: linear-gradient(135deg, #dc2626, #ef4444);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                    ">Close</button>
                    <button onclick="window.open('https://developer.apple.com/augmented-reality/tools/', '_blank')" style="
                        flex: 1;
                        padding: 0.75rem;
                        background: linear-gradient(135deg, #2563eb, #3b82f6);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                    ">Download Reality Converter</button>
                </div>
            </div>
        `;
        
        converterModal.className = 'converter-modal';
        document.body.appendChild(converterModal);
        
        // Close on background click
        converterModal.addEventListener('click', (e) => {
            if (e.target === converterModal) {
                converterModal.remove();
            }
        });
    }

    setCurrentFolder(folderId) {
        this.currentFolder = folderId;
        this.saveFolders();
        this.renderFolders();
        this.loadModels();
    }

    renderFolders() {
        const foldersList = document.getElementById('folders-list');
        if (!foldersList) return;

        foldersList.innerHTML = '';

        this.folders.forEach(folder => {
            const folderBtn = document.createElement('button');
            folderBtn.className = `folder-btn ${this.currentFolder === folder.id ? 'active' : ''}`;
            folderBtn.style.cssText = `
                padding: 8px 16px;
                border: 1px solid ${folder.color};
                border-radius: 20px;
                background: ${this.currentFolder === folder.id ? folder.color : 'transparent'};
                color: ${this.currentFolder === folder.id ? 'white' : folder.color};
                cursor: pointer;
                font-size: 0.9rem;
                font-weight: 600;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 6px;
            `;
            
            const modelCount = this.getModelCountInFolder(folder.id);
            folderBtn.innerHTML = `
                ${folder.id === 'favorites' ? '⭐' : '📁'} 
                ${folder.name} 
                ${modelCount > 0 ? `(${modelCount})` : ''}
            `;

            folderBtn.addEventListener('click', () => {
                this.setCurrentFolder(folder.id);
            });

            // Add delete button for custom folders
            if (folder.id !== 'default' && folder.id !== 'favorites') {
                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = '🗑️';
                deleteBtn.style.cssText = `
                    margin-left: 6px;
                    padding: 2px 6px;
                    border: none;
                    background: rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.8rem;
                `;
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteFolder(folder.id);
                });
                folderBtn.appendChild(deleteBtn);
            }

            foldersList.appendChild(folderBtn);
        });
    }

    getModelCountInFolder(folderId) {
        if (folderId === 'favorites') {
            return this.models.filter(model => model.isFavorite).length;
        } else if (folderId === 'default') {
            return this.models.length;
        } else {
            return this.models.filter(model => model.folderId === folderId).length;
        }
    }

    loadModels() {
        const modelsGrid = document.getElementById('models-grid');
        if (!modelsGrid) return;

        modelsGrid.innerHTML = '';

        // Filter models by current folder
        let filteredModels = this.models;
        if (this.currentFolder === 'favorites') {
            filteredModels = this.models.filter(model => model.isFavorite);
        } else if (this.currentFolder !== 'default') {
            filteredModels = this.models.filter(model => model.folderId === this.currentFolder);
        }

        if (filteredModels.length === 0) {
            const folder = this.folders.find(f => f.id === this.currentFolder);
            const folderName = folder ? folder.name : 'this folder';
            modelsGrid.innerHTML = `<div class="no-models">No models in ${folderName}. Upload your first 3D model above!</div>`;
            return;
        }

        filteredModels.forEach(model => {
            const modelCard = this.renderModel(model);
            modelsGrid.appendChild(modelCard);
        });
    }

    renderModel(model) {
        const card = document.createElement('div');
        card.className = 'model-card';
        card.innerHTML = `
            <div class="model-preview">
                <img src="${model.previewImage}" alt="${model.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
            </div>
            <div class="model-info">
                <h3>${model.name}</h3>
                <p>Created: ${new Date(model.createdAt).toLocaleDateString()}</p>
                <p style="color: ${model.uploaded ? '#22c55e' : '#f59e0b'}; font-size: 0.8rem;">
                    ${model.uploaded ? '✅ Uploaded' : '⏳ Ready to upload'}
                </p>
            </div>
            <div class="model-actions">
                <button class="view-btn" onclick="modelShowcase.viewModel('${model.id}')">View</button>
                <button class="upload-btn" onclick="modelShowcase.publishOne('${model.id}')">Publish</button>
                <button class="view-btn" onclick="modelShowcase.copyShareLink('${model.id}')">Share</button>
                <button class="edit-btn" onclick="modelShowcase.toggleFavorite('${model.id}')">${model.isFavorite ? '💛' : '🤍'}</button>
                <button class="edit-btn" onclick="modelShowcase.moveToFolder('${model.id}')">📁</button>
                <button class="delete-btn" onclick="modelShowcase.deleteModel('${model.id}')">Delete</button>
            </div>
        `;
        return card;
    }

    viewModel(modelId) {
        // Use project-relative path so it works on GitHub Pages project sites
        const basePath = window.location.pathname.replace(/[^/]*$/, '');
        const url = `${basePath}models/${encodeURIComponent(modelId)}/`;
        window.open(url, '_blank');
    }

    copyShareLink(modelId) {
        const basePath = window.location.pathname.replace(/[^/]*$/, '');
        const url = `${basePath}models/${encodeURIComponent(modelId)}/`;
        navigator.clipboard.writeText(url).then(() => alert('Share link copied to clipboard!')).catch(() => prompt('Copy this link:', url));
    }

    openEdit(modelId) {
        // Edit functionality placeholder
        alert('Edit functionality will be implemented here');
    }

    deleteModel(modelId) {
        if (confirm('Are you sure you want to delete this model?')) {
            this.models = this.models.filter(m => m.id !== modelId);
            this.saveModels();
            this.renderFolders();
            this.loadModels();
        }
    }

    toggleFavorite(modelId) {
        const model = this.models.find(m => m.id === modelId);
        if (model) {
            model.isFavorite = !model.isFavorite;
            this.saveModels();
            this.renderFolders();
            this.loadModels();
        }
    }

    moveToFolder(modelId) {
        const model = this.models.find(m => m.id === modelId);
        if (!model) return;

        const folderOptions = this.folders.map(folder => 
            `${folder.id}:${folder.name}`
        ).join('\n');

        const newFolderId = prompt(`Move "${model.name}" to which folder?\n\n${folderOptions}\n\nEnter folder ID:`);
        
        if (newFolderId && this.folders.find(f => f.id === newFolderId)) {
            model.folderId = newFolderId;
            this.saveModels();
            this.renderFolders();
            this.loadModels();
        }
    }

    openShareLink(modelId) {
        const basePath = window.location.pathname.replace(/[^/]*$/, '');
        const url = `${basePath}models/${encodeURIComponent(modelId)}/`;
        window.open(url, '_blank');
    }

    async publishOne(modelId) {
        const model = this.models.find(m => m.id === modelId);
        if (!model) {
            alert('Model not found locally.');
            return;
        }
        
        if (!model.readyToPublish) {
            alert('Model is not ready for publishing. Please re-upload the model.');
            return;
        }
        
        // Show file picker to re-select the files for publishing
        alert('Please select your GLB and USDZ files again for publishing to GitHub.');
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.glb,.usdz';
        input.multiple = true;
        input.onchange = async (e) => {
            const files = e.target.files;
            const glbFile = Array.from(files).find(file => file.name.endsWith('.glb'));
            const usdzFile = Array.from(files).find(file => file.name.endsWith('.usdz'));
            
            if (!glbFile || !usdzFile) {
                alert('Please select both GLB and USDZ files.');
                return;
            }
            
            try {
                // Create model object for publishing
                const glbBase64 = await this.fileToBase64(glbFile);
                const usdzBase64 = await this.fileToBase64(usdzFile);
                
                const modelForPublishing = {
                    id: modelId,
                    name: model.name,
                    glbFile: glbBase64,
                    usdzFile: usdzBase64,
                    previewImage: model.previewImage,
                    createdAt: model.createdAt
                };
                
                await this.publishModelIfConfigured(modelForPublishing);
                alert('Publish successful. Share link is ready.');
            } catch (error) {
                console.error('Publish failed:', error);
                alert(`Publish failed: ${error.message}`);
            }
        };
        input.click();
    }
}

// Initialize the application
const modelShowcase = new ModelShowcase();

// Model Page JavaScript
class ModelPage {
    constructor() {
        this.modelId = new URLSearchParams(window.location.search).get('id');
        this.init();
    }

    init() {
        if (!this.modelId) {
            this.showError('No model ID provided');
            return;
        }

        this.loadModel();
    }

    async loadModel() {
        try {
            this.showLoading();
            const model = await this.fetchModel(this.modelId);
            this.renderModel(model);
        } catch (error) {
            console.error('Error loading model:', error);
            this.showError(`Failed to load model: ${error.message}`);
        }
    }

    async fetchModel(id) {
        // Try to load from GitHub raw URLs first
        try {
            const response = await fetch(`https://raw.githubusercontent.com/imagniahf-design/model-showcase-pages/main/models/${id}.json`);
            if (response.ok) {
                const manifest = await response.json();
                return this.processManifest(manifest);
            }
        } catch (error) {
            console.warn('Failed to load from GitHub raw URLs:', error);
        }

        // Fallback to Cloudflare R2
        const publicUrl = 'https://pub-80de14f69b6048d6b5ca9266a1aa6d1e.r2.dev';
        try {
            const response = await fetch(`${publicUrl}/models/${id}.json`);
            if (response.ok) {
                const manifest = await response.json();
                return this.processManifest(manifest);
            }
        } catch (error) {
            console.warn('Failed to load from Cloudflare R2:', error);
        }

        // Final fallback to local storage
        const models = JSON.parse(localStorage.getItem('models')) || [];
        const model = models.find(m => m.id === id);
        if (model) {
            return model;
        }

        throw new Error('Model not found');
    }

    processManifest(manifest) {
        // Ensure URLs have proper parameters for iOS AR
        const glbUrl = manifest.glbFile || manifest.glb;
        let usdzUrl = manifest.usdzFile || manifest.usdz;
        
        // Ensure USDZ URL is a direct link (not GitHub API URL)
        if (usdzUrl && usdzUrl.includes('api.github.com')) {
            usdzUrl = usdzUrl.replace('api.github.com/repos/', 'raw.githubusercontent.com/').replace('/contents/', '/').replace('?ref=main', '');
        }
        
        // Use jsDelivr CDN which serves files with correct MIME types
        if (usdzUrl && usdzUrl.includes('raw.githubusercontent.com')) {
            usdzUrl = usdzUrl.replace('raw.githubusercontent.com', 'cdn.jsdelivr.net/gh');
            // Add filename parameter for iOS AR
            const modelName = (manifest.name || manifest.title || 'model').replace(/[^a-zA-Z0-9]/g, '_');
            usdzUrl += `?filename=${modelName}.usdz&allowsContentScaling=1`;
        }

        return {
            id: manifest.id,
            name: manifest.name || manifest.title,
            description: manifest.description,
            glbUrl: glbUrl.startsWith('http') ? glbUrl : `https://raw.githubusercontent.com/imagniahf-design/model-showcase-pages/main/models/${manifest.id}/model.glb`,
            usdzUrl: usdzUrl && usdzUrl.startsWith('http') ? usdzUrl : (usdzUrl ? `https://raw.githubusercontent.com/imagniahf-design/model-showcase-pages/main/models/${manifest.id}/model.usdz` : ''),
            previewImage: manifest.previewImage || manifest.poster
        };
    }

    showLoading() {
        document.body.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #0f172a; color: white; font-family: Inter, sans-serif;">
                <div style="text-align: center;">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">🎯</div>
                    <div>Loading 3D Model...</div>
                </div>
            </div>
        `;
    }

    showError(message) {
        document.body.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #0f172a; color: white; font-family: Inter, sans-serif;">
                <div style="text-align: center; max-width: 400px; padding: 2rem;">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">❌</div>
                    <div style="font-size: 1.2rem; margin-bottom: 1rem;">Error</div>
                    <div style="color: #94a3b8;">${message}</div>
                    <button onclick="window.location.href='/' + window.location.search" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">Go Back</button>
                </div>
            </div>
        `;
    }

    renderModel(model) {
        // Ensure USDZ URL is properly formatted for iOS AR
        let usdz = model.usdzUrl;
        if (usdz) {
            // Ensure it's a direct link, not GitHub API URL
            if (usdz.includes('api.github.com')) {
                usdz = usdz.replace('api.github.com/repos/', 'raw.githubusercontent.com/').replace('/contents/', '/').replace('?ref=main', '');
            }
            // Use jsDelivr CDN for better MIME type support
            if (usdz.includes('raw.githubusercontent.com')) {
                usdz = usdz.replace('raw.githubusercontent.com', 'cdn.jsdelivr.net/gh');
            }
            // Don't add filename parameter for direct AR links - iOS handles this better without it
            // Just ensure it's a clean URL
        }
        
        const sceneViewer = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(model.glbUrl || '')}&mode=ar_only&title=${encodeURIComponent(model.name || 'Model')}#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;end;`;
        
        document.body.innerHTML = `
            <div style="background: #0f172a; color: white; font-family: Inter, sans-serif; min-height: 100vh;">
                <header style="padding: 1rem; text-align: center; border-bottom: 1px solid #1e293b;">
                    <h1 style="margin: 0; font-size: 1.5rem;">🎯 ${model.name}</h1>
                    ${model.description ? `<p style=\"margin: 0.5rem 0 0 0; color: #94a3b8;\">${model.description}</p>` : ''}
                </header>
                <main style="padding: 2rem; max-width: 1200px; margin: 0 auto;">
                    <div style="background: #1e293b; border-radius: 1rem; padding: 1rem; margin-bottom: 1.25rem; text-align:center;">
                        <img src="${model.previewImage}" alt="${model.name}" style="max-width:100%; height:auto; border-radius:12px;" />
                    </div>
                    <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
                        <button id="ios-ar" onclick="openInAR('${usdz || ''}')" style="display:none; padding:0.75rem 1.25rem; background:#16a34a; color:#fff; border-radius:8px; border:none; font-weight:600; cursor:pointer;">📱 Start AR (iOS)</button>
                        <a id="android-ar" href="${sceneViewer}" style="display:none; padding:0.75rem 1.25rem; background:#0ea5e9; color:#fff; border-radius:8px; text-decoration:none; font-weight:600;">🤖 Start AR (Android)</a>
                    </div>
                    <div style="text-align: center; margin-top:16px;">
                        <p style="color: #94a3b8; margin-bottom: 1rem;">Share this model</p>
                        <button onclick="navigator.clipboard.writeText(window.location.href); alert('Link copied!');" style="padding: 0.75rem 1.5rem; background: #3b82f6; color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600;">📋 Copy Share Link</button>
                    </div>
                </main>
            </div>
            <script>
                // Global function for iOS AR
                function openInAR(usdzUrl) {
                    console.log('Opening USDZ in AR:', usdzUrl);
                    
                    if (!usdzUrl || usdzUrl === '#') {
                        alert('No USDZ file available for AR viewing.');
                        return;
                    }
                    
                    const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
                    
                    if (isiOS) {
                        // Method 1: Try direct window.location (most reliable for AR)
                        try {
                            window.location.href = usdzUrl;
                        } catch (error) {
                            console.log('Direct method failed, trying AR link method');
                            
                            // Method 2: Create AR link as fallback
                            const arLink = document.createElement('a');
                            arLink.href = usdzUrl;
                            arLink.rel = 'ar';
                            arLink.style.display = 'none';
                            document.body.appendChild(arLink);
                            arLink.click();
                            document.body.removeChild(arLink);
                        }
                    } else {
                        alert('AR viewing is only available on iOS devices. Please open this page on an iPhone or iPad.');
                    }
                }
                
                (function(){
                  const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
                  const isAndroid = /Android/i.test(navigator.userAgent);
                  const iosBtn = document.getElementById('ios-ar');
                  const andBtn = document.getElementById('android-ar');
                  
                  if (isiOS) {
                    if (iosBtn && usdz) iosBtn.style.display = 'inline-block';
                  }
                  if (isAndroid && andBtn) andBtn.style.display = 'inline-block';
                  
                  // Debug info for iOS AR
                  if (isiOS && usdz) {
                    console.log('iOS AR URL:', usdz);
                    // Test if USDZ loads correctly
                    fetch(usdz, { method: 'HEAD' })
                      .then(response => {
                        console.log('USDZ response:', response.status, response.headers.get('content-type'));
                        if (response.status !== 200) {
                          console.warn('USDZ file may not be accessible');
                        }
                      })
                      .catch(error => {
                        console.error('USDZ test failed:', error);
                      });
                  }
                })();
            </script>
        `;
    }
}

// Initialize model page if we're on a model page
if (window.location.pathname.includes('/model/') || window.location.search.includes('id=')) {
    new ModelPage();
}

// Make showUsdzConverter globally accessible
window.showUsdzConverter = function() {
    if (window.modelShowcase) {
        window.modelShowcase.showUsdzConverter();
    }
};
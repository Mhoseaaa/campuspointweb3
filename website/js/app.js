/**
 * Campus Point - Main Application
 * Handles routing, UI updates, and user interactions
 */

class CampusPointApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.isWalletConnected = false;
        this.isOwner = false;

        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        // Setup routing
        this.setupRouting();

        // Setup event listeners
        this.setupEventListeners();

        // Check initial hash
        this.handleHashChange();
    }

    /**
     * Setup hash-based routing
     */
    setupRouting() {
        window.addEventListener('hashchange', () => this.handleHashChange());
    }

    /**
     * Handle URL hash changes
     */
    handleHashChange() {
        const hash = window.location.hash.slice(1) || 'dashboard';
        this.navigateTo(hash);
    }

    /**
     * Navigate to a specific page
     */
    navigateTo(pageName) {
        const validPages = ['dashboard', 'activities', 'certificates', 'admin'];

        if (!validPages.includes(pageName)) {
            pageName = 'dashboard';
        }

        this.currentPage = pageName;

        // Update page visibility
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        const targetPage = document.getElementById(`${pageName}Page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Update navigation active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === pageName) {
                item.classList.add('active');
            }
        });

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            activities: 'Kegiatan Kampus',
            certificates: 'Sertifikat NFT',
            admin: 'Admin Panel'
        };

        document.getElementById('pageTitle').textContent = titles[pageName] || 'Dashboard';

        // Load page-specific data
        this.loadPageData(pageName);
    }

    /**
     * Load data for specific page
     */
    async loadPageData(pageName) {
        if (!window.web3Utils.isConnected) return;

        switch (pageName) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'activities':
                await this.loadActivitiesData();
                break;
            case 'certificates':
                await this.loadCertificatesData();
                break;
            case 'admin':
                await this.checkAdminAccess();
                break;
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Wallet connect button
        const connectBtn = document.getElementById('connectWallet');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.handleConnectWallet());
        }

        // Navigation items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                window.location.hash = page;
            });
        });

        // Admin forms
        this.setupAdminForms();

        // Certificate preview
        const previewBtn = document.getElementById('previewCertBtn');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.handleCertificatePreview());
        }

        // Modal close
        const modalClose = document.getElementById('modalClose');
        const modalOverlay = document.getElementById('modalOverlay');
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeModal());
        }
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    this.closeModal();
                }
            });
        }

        // Wallet change event
        window.addEventListener('walletChanged', (e) => {
            this.updateWalletUI(e.detail.address);
            this.loadPageData(this.currentPage);
        });
    }

    /**
     * Setup admin form handlers
     */
    setupAdminForms() {
        // Create Activity Form
        const createActivityForm = document.getElementById('createActivityForm');
        if (createActivityForm) {
            createActivityForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCreateActivity();
            });
        }

        // Set Certificate URI Form
        const setCertUriForm = document.getElementById('setCertUriForm');
        if (setCertUriForm) {
            setCertUriForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSetCertUri();
            });
        }

        // Reward Student Form
        const rewardStudentForm = document.getElementById('rewardStudentForm');
        if (rewardStudentForm) {
            rewardStudentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRewardStudent();
            });
        }

        // Mint Certificate Form
        const mintCertificateForm = document.getElementById('mintCertificateForm');
        if (mintCertificateForm) {
            mintCertificateForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleMintCertificate();
            });
        }

        // Verify Token Form
        const verifyTokenForm = document.getElementById('verifyTokenForm');
        if (verifyTokenForm) {
            verifyTokenForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleVerifyToken();
            });
        }
    }

    /**
     * Handle wallet connection
     */
    async handleConnectWallet() {
        const btn = document.getElementById('connectWallet');
        const btnText = document.getElementById('walletButtonText');

        try {
            btn.disabled = true;
            btnText.innerHTML = '<span class="loading"></span>';

            const result = await window.web3Utils.connectWallet();

            this.isWalletConnected = true;
            this.updateWalletUI(result.address);

            this.showToast('Wallet berhasil terhubung!', 'success');

            // Load current page data
            await this.loadPageData(this.currentPage);

        } catch (error) {
            this.showToast(error.message || 'Gagal menghubungkan wallet', 'error');
            btn.disabled = false;
            btnText.textContent = 'Connect Wallet';
        }
    }

    /**
     * Update wallet UI after connection
     */
    async updateWalletUI(address) {
        const btn = document.getElementById('connectWallet');
        const btnText = document.getElementById('walletButtonText');
        const walletInfo = document.getElementById('walletInfo');
        const displayAddress = document.getElementById('displayAddress');
        const displayNetwork = document.getElementById('displayNetwork');
        const sidebarNetworkName = document.getElementById('sidebarNetworkName');

        btn.disabled = false;
        btnText.textContent = window.web3Utils.shortenAddress(address);
        btn.classList.add('connected');

        // Show wallet info section
        if (walletInfo) {
            walletInfo.style.display = 'flex';
        }

        // Display address
        if (displayAddress) {
            displayAddress.textContent = window.web3Utils.shortenAddress(address);
        }

        // Display network name
        const networkName = await window.web3Utils.getNetworkName();
        if (displayNetwork) {
            displayNetwork.textContent = networkName;
        }
        if (sidebarNetworkName) {
            sidebarNetworkName.textContent = networkName;
        }
    }

    /**
     * Load dashboard data
     */
    async loadDashboardData() {
        try {
            // Get point balance
            const points = await window.web3Utils.getPointBalance();
            document.getElementById('pointBalance').textContent = points;

            // Get certificate count
            const certCount = await window.web3Utils.getCertificateCount();
            document.getElementById('certCount').textContent = certCount;

            // Get activity count
            const activities = await window.web3Utils.getAllActivities();
            const activeCount = activities.filter(a => a.isActive).length;
            document.getElementById('activityCount').textContent = activeCount;

            // Update recent activity
            this.updateRecentActivity(activities.slice(-5).reverse());

        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    }

    /**
     * Update recent activity list
     */
    updateRecentActivity(activities) {
        const container = document.getElementById('recentActivity');

        if (activities.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Belum ada kegiatan terdaftar.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = activities.map(activity => `
            <div class="activity-item" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: var(--spacing-md);
                border-bottom: 1px solid var(--border-subtle);
            ">
                <div>
                    <strong>${activity.name}</strong>
                    <span class="status ${activity.isActive ? 'status-active' : 'status-inactive'}">
                        ${activity.isActive ? '● Aktif' : '○ Tidak Aktif'}
                    </span>
                </div>
                <span class="points">+${activity.pointReward} CPNT</span>
            </div>
        `).join('');
    }

    /**
     * Load activities data
     */
    async loadActivitiesData() {
        const container = document.getElementById('activitiesList');

        try {
            container.innerHTML = '<div class="empty-state"><span class="loading"></span> Memuat kegiatan...</div>';

            const activities = await window.web3Utils.getAllActivities();

            if (activities.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>Belum ada kegiatan terdaftar. Hubungi admin untuk menambahkan kegiatan.</p>
                    </div>
                `;
                return;
            }

            // Check request status for each activity
            const activitiesWithStatus = await Promise.all(
                activities.map(async (activity) => {
                    const hasRequested = await window.web3Utils.hasRequested(activity.id);
                    return { ...activity, hasRequested };
                })
            );

            container.innerHTML = activitiesWithStatus.map(activity => `
                <div class="activity-card ${activity.hasRequested ? 'requested' : ''}" 
                     data-activity-id="${activity.id}" 
                     data-activity-name="${activity.name}"
                     data-activity-active="${activity.isActive}">
                    <h4>${activity.name}</h4>
                    <span class="points">💰 ${activity.pointReward} CPNT</span>
                    <div class="status ${activity.isActive ? 'status-active' : 'status-inactive'}">
                        ${activity.isActive ? '● Sedang Berlangsung' : '○ Selesai'}
                    </div>
                    ${activity.hasRequested ? '<div class="request-badge">📨 Sudah Request</div>' : '<div class="request-hint">Double-click untuk request sertifikat</div>'}
                </div>
            `).join('');

            // Add double-click handlers
            container.querySelectorAll('.activity-card').forEach(card => {
                card.addEventListener('dblclick', (e) => {
                    const activityId = card.dataset.activityId;
                    const activityName = card.dataset.activityName;
                    const isActive = card.dataset.activityActive === 'true';
                    this.handleActivityDoubleClick(activityId, activityName, isActive);
                });
            });

        } catch (error) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Gagal memuat kegiatan. Pastikan kontrak telah di-deploy.</p>
                </div>
            `;
        }
    }

    /**
     * Load certificates data
     */
    async loadCertificatesData() {
        const container = document.getElementById('certificatesList');

        // Also load claimable activities
        await this.loadClaimableActivities();

        try {
            container.innerHTML = '<div class="empty-state"><span class="loading"></span> Memuat sertifikat...</div>';

            const certificates = await window.web3Utils.getUserCertificates();

            if (certificates.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>Anda belum memiliki sertifikat. Ikuti kegiatan kampus untuk mendapatkan sertifikat NFT!</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = certificates.map(cert => `
                <div class="certificate-card">
                    <img 
                        class="certificate-image" 
                        src="${cert.imageUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="%234a4a4a" width="400" height="300"/><text fill="%23858585" font-family="sans-serif" font-size="14" text-anchor="middle" x="200" y="150">Certificate Image</text></svg>'}" 
                        alt="Certificate ${cert.tokenId}"
                        onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22><rect fill=%22%234a4a4a%22 width=%22400%22 height=%22300%22/><text fill=%22%23858585%22 font-family=%22sans-serif%22 font-size=%2214%22 text-anchor=%22middle%22 x=%22200%22 y=%22150%22>Image not available</text></svg>'"
                    >
                    <div class="certificate-info">
                        <h4>${cert.metadata?.name || 'Certificate #' + cert.tokenId}</h4>
                        <p>${cert.metadata?.description || 'No description available'}</p>
                        <span class="token-id">Token ID: ${cert.tokenId}</span>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading certificates:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <p>Gagal memuat sertifikat. Pastikan kontrak telah di-deploy.</p>
                </div>
            `;
        }
    }

    /**
     * Check admin access
     */
    async checkAdminAccess() {
        try {
            this.isOwner = await window.web3Utils.isContractOwner();

            if (!this.isOwner) {
                const adminPage = document.getElementById('adminPage');
                adminPage.innerHTML = `
                    <div class="page-header">
                        <h2>Akses Ditolak</h2>
                        <p>Anda bukan owner kontrak. Hanya owner yang dapat mengakses panel admin.</p>
                    </div>
                `;
            } else {
                // Load waiting list for admin
                await this.loadWaitingList();
            }
        } catch (error) {
            console.error('Error checking admin access:', error);
        }
    }

    /**
     * Handle certificate preview
     */
    async handleCertificatePreview() {
        const uriInput = document.getElementById('certUri');
        const uri = uriInput.value.trim();

        if (!uri) {
            this.showToast('Masukkan IPFS URI terlebih dahulu', 'warning');
            return;
        }

        const previewSection = document.getElementById('certPreviewSection');
        const previewImage = document.getElementById('certPreviewImage');
        const previewInfo = document.getElementById('certPreviewInfo');
        const mintBtn = document.getElementById('mintCertBtn');

        try {
            previewSection.style.display = 'block';
            previewInfo.innerHTML = '<span class="loading"></span> Memuat preview...';

            const metadata = await window.web3Utils.fetchIPFSMetadata(uri);

            if (!metadata) {
                throw new Error('Metadata tidak ditemukan');
            }

            // Display image
            if (metadata.image) {
                previewImage.src = window.web3Utils.ipfsToHttp(metadata.image);
                previewImage.style.display = 'block';
            } else {
                previewImage.style.display = 'none';
            }

            // Display metadata info
            previewInfo.innerHTML = `
                <p><strong>Nama:</strong> ${metadata.name || 'Tidak tersedia'}</p>
                <p><strong>Deskripsi:</strong> ${metadata.description || 'Tidak tersedia'}</p>
                ${metadata.attributes ? `
                    <p><strong>Atribut:</strong></p>
                    <ul style="margin-left: 20px;">
                        ${metadata.attributes.map(attr =>
                `<li>${attr.trait_type || attr.name}: ${attr.value}</li>`
            ).join('')}
                    </ul>
                ` : ''}
            `;

            // Enable mint button
            mintBtn.disabled = false;
            this.showToast('Preview berhasil dimuat!', 'success');

        } catch (error) {
            previewImage.style.display = 'none';
            previewInfo.innerHTML = `<p style="color: var(--error);">Gagal memuat metadata: ${error.message}</p>`;
            mintBtn.disabled = true;
        }
    }

    /**
     * Handle create activity
     */
    async handleCreateActivity() {
        const nameInput = document.getElementById('activityName');
        const pointInput = document.getElementById('pointReward');

        const name = nameInput.value.trim();
        const points = parseInt(pointInput.value);

        if (!name || !points) {
            this.showToast('Lengkapi semua field', 'warning');
            return;
        }

        try {
            this.showToast('Membuat kegiatan...', 'warning');

            await window.web3Utils.createActivity(name, points);

            this.showToast('Kegiatan berhasil dibuat!', 'success');
            nameInput.value = '';
            pointInput.value = '';

            // Refresh activities if on activities page
            if (this.currentPage === 'activities') {
                await this.loadActivitiesData();
            }

        } catch (error) {
            this.showToast('Gagal membuat kegiatan: ' + (error.reason || error.message), 'error');
        }
    }

    /**
     * Handle reward student
     */
    async handleRewardStudent() {
        const activityIdInput = document.getElementById('rewardActivityId');
        const addressInput = document.getElementById('studentAddress');

        const activityId = parseInt(activityIdInput.value);
        const studentAddress = addressInput.value.trim();

        if (!activityId || !studentAddress) {
            this.showToast('Lengkapi semua field', 'warning');
            return;
        }

        if (!ethers.utils.isAddress(studentAddress)) {
            this.showToast('Alamat wallet tidak valid', 'error');
            return;
        }

        try {
            this.showToast('Mengirim poin...', 'warning');

            await window.web3Utils.rewardStudent(activityId, studentAddress);

            this.showToast('Poin berhasil dikirim!', 'success');
            activityIdInput.value = '';
            addressInput.value = '';

        } catch (error) {
            this.showToast('Gagal mengirim poin: ' + (error.reason || error.message), 'error');
        }
    }

    /**
     * Handle mint certificate
     */
    async handleMintCertificate() {
        const activityIdInput = document.getElementById('certActivityId');
        const addressInput = document.getElementById('certStudentAddress');
        const uriInput = document.getElementById('certUri');

        const activityId = parseInt(activityIdInput.value);
        const studentAddress = addressInput.value.trim();
        const uri = uriInput.value.trim();

        if (!activityId || !studentAddress || !uri) {
            this.showToast('Lengkapi semua field', 'warning');
            return;
        }

        if (!ethers.utils.isAddress(studentAddress)) {
            this.showToast('Alamat wallet tidak valid', 'error');
            return;
        }

        try {
            this.showToast('Menerbitkan sertifikat...', 'warning');

            await window.web3Utils.mintCertificate(activityId, studentAddress, uri);

            this.showToast('Sertifikat berhasil diterbitkan!', 'success');

            // Reset form
            activityIdInput.value = '';
            addressInput.value = '';
            uriInput.value = '';
            document.getElementById('certPreviewSection').style.display = 'none';
            document.getElementById('mintCertBtn').disabled = true;

        } catch (error) {
            this.showToast('Gagal menerbitkan sertifikat: ' + (error.reason || error.message), 'error');
        }
    }

    /**
     * Handle set certificate URI template
     */
    async handleSetCertUri() {
        const activityIdInput = document.getElementById('certUriActivityId');
        const uriInput = document.getElementById('certTemplateUri');

        const activityId = parseInt(activityIdInput.value);
        const uri = uriInput.value.trim();

        if (!activityId || !uri) {
            this.showToast('Lengkapi semua field', 'warning');
            return;
        }

        try {
            this.showToast('Menyimpan template sertifikat...', 'warning');

            await window.web3Utils.setActivityCertUri(activityId, uri);

            this.showToast('Template sertifikat berhasil disimpan!', 'success');
            activityIdInput.value = '';
            uriInput.value = '';

        } catch (error) {
            this.showToast('Gagal menyimpan template: ' + (error.reason || error.message), 'error');
        }
    }

    /**
     * Handle verify token
     */
    async handleVerifyToken() {
        const tokenIdInput = document.getElementById('verifyTokenId');
        const tokenId = parseInt(tokenIdInput.value);

        if (!tokenId) {
            this.showToast('Masukkan Token ID', 'warning');
            return;
        }

        const resultDiv = document.getElementById('verifyResult');
        const resultTokenId = document.getElementById('resultTokenId');
        const resultOwner = document.getElementById('resultOwner');
        const resultTokenUri = document.getElementById('resultTokenUri');

        try {
            resultDiv.style.display = 'block';
            resultTokenId.textContent = 'Loading...';
            resultOwner.textContent = 'Loading...';
            resultTokenUri.textContent = 'Loading...';

            const result = await window.web3Utils.verifyToken(tokenId);

            resultTokenId.textContent = result.tokenId;
            resultOwner.textContent = result.owner;
            resultTokenUri.textContent = result.tokenUri;

            this.showToast('Verifikasi berhasil!', 'success');

        } catch (error) {
            resultDiv.style.display = 'none';
            this.showToast('Token tidak ditemukan atau error: ' + (error.reason || error.message), 'error');
        }
    }

    /**
     * Load claimable activities for certificates page
     */
    async loadClaimableActivities() {
        const container = document.getElementById('claimableList');
        if (!container) return;

        try {
            const claimable = await window.web3Utils.getClaimableActivities();

            if (claimable.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>Tidak ada sertifikat yang bisa diklaim saat ini.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = claimable.map(activity => `
                <div class="claimable-item">
                    <div class="claimable-info">
                        <h4>${activity.name}</h4>
                        <span>+${activity.pointReward} CPNT • ID: ${activity.id}</span>
                    </div>
                    <button class="btn btn-claim" onclick="app.handleClaimCertificate(${activity.id})">
                        Klaim Sertifikat
                    </button>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading claimable activities:', error);
        }
    }

    /**
     * Handle claim certificate
     */
    async handleClaimCertificate(activityId) {
        try {
            this.showToast('Mengklaim sertifikat...', 'warning');

            await window.web3Utils.claimCertificate(activityId);

            this.showToast('Sertifikat berhasil diklaim!', 'success');

            // Reload claimable and certificates
            await this.loadClaimableActivities();
            await this.loadCertificatesData();

        } catch (error) {
            this.showToast('Gagal mengklaim sertifikat: ' + (error.reason || error.message), 'error');
        }
    }

    // ===== NEW: Certificate Request & Approval Handlers =====

    /**
     * Handle double click on activity card
     */
    async handleActivityDoubleClick(activityId, activityName, isActive) {
        // Check if already requested
        const hasRequested = await window.web3Utils.hasRequested(activityId);

        if (hasRequested) {
            this.showToast('Anda sudah mengajukan request untuk kegiatan ini', 'warning');
            return;
        }

        if (!isActive) {
            this.showToast('Kegiatan ini sudah tidak aktif', 'warning');
            return;
        }

        // Show confirmation modal
        this.openModal('Request Sertifikat', `
            <div class="request-modal-content">
                <p>Anda akan mengajukan request sertifikat untuk:</p>
                <h3>${activityName}</h3>
                <p class="modal-note">Setelah request diajukan, admin akan mereview dan approve sertifikat Anda.</p>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="app.closeModal()">Batal</button>
                    <button class="btn btn-primary" onclick="app.handleRequestCertificate(${activityId})">Request Sertifikat</button>
                </div>
            </div>
        `);
    }

    /**
     * Handle request certificate submit
     */
    async handleRequestCertificate(activityId) {
        try {
            this.closeModal();
            this.showToast('Mengajukan request sertifikat...', 'warning');

            await window.web3Utils.requestCertificate(activityId);

            this.showToast('Request sertifikat berhasil diajukan!', 'success');

            // Reload activities to update status
            await this.loadActivitiesData();

        } catch (error) {
            this.showToast('Gagal request sertifikat: ' + (error.reason || error.message), 'error');
        }
    }

    /**
     * Load waiting list for admin panel
     */
    async loadWaitingList() {
        const container = document.getElementById('waitingListContainer');
        if (!container) return;

        try {
            container.innerHTML = '<div class="empty-state"><span class="loading"></span> Memuat waiting list...</div>';

            const activities = await window.web3Utils.getAllActivitiesWithPendingCounts();

            // Filter activities with pending requests
            const activitiesWithPending = activities.filter(a => a.pendingCount > 0);

            if (activitiesWithPending.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>Tidak ada request sertifikat yang menunggu persetujuan.</p>
                    </div>
                `;
                return;
            }

            // Build waiting list HTML
            let html = '';

            for (const activity of activitiesWithPending) {
                const pendingAddresses = await window.web3Utils.getPendingRequests(activity.id);

                html += `
                    <div class="waiting-list-activity">
                        <div class="waiting-list-header">
                            <h4>${activity.name}</h4>
                            <span class="pending-count">${activity.pendingCount} pending</span>
                        </div>
                        <div class="waiting-list-items">
                            ${pendingAddresses.map(address => `
                                <div class="waiting-list-item">
                                    <span class="student-address">${window.web3Utils.shortenAddress(address)}</span>
                                    <span class="full-address" title="${address}">${address}</span>
                                    <button class="btn btn-approve" onclick="app.handleApproveRequest(${activity.id}, '${address}')">
                                        ✓ Approve
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            container.innerHTML = html;

        } catch (error) {
            console.error('Error loading waiting list:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <p>Gagal memuat waiting list.</p>
                </div>
            `;
        }
    }

    /**
     * Handle approve certificate request
     */
    async handleApproveRequest(activityId, studentAddress) {
        try {
            this.showToast('Menyetujui request...', 'warning');

            await window.web3Utils.approveCertificateRequest(activityId, studentAddress);

            this.showToast('Sertifikat berhasil diterbitkan!', 'success');

            // Reload waiting list
            await this.loadWaitingList();

        } catch (error) {
            this.showToast('Gagal approve request: ' + (error.reason || error.message), 'error');
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        // Auto remove after 4 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(50px)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    /**
     * Open modal
     */
    openModal(title, content) {
        const overlay = document.getElementById('modalOverlay');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');

        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        overlay.classList.add('active');
    }

    /**
     * Close modal
     */
    closeModal() {
        const overlay = document.getElementById('modalOverlay');
        overlay.classList.remove('active');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CampusPointApp();
});

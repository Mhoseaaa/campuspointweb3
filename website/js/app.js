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
        document.querySelectorAll('.nav-tab').forEach(item => {
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

        const titleEl = document.getElementById('pageTitle');
        if (titleEl) {
            titleEl.textContent = titles[pageName] || 'Dashboard';
        }

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

        // Navigation items (tabs)
        document.querySelectorAll('.nav-tab').forEach(item => {
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

        // Setup admin tabs
        this.setupAdminTabs();

        // Student request certificate form
        const requestCertForm = document.getElementById('requestCertForm');
        if (requestCertForm) {
            requestCertForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRequestCertificate();
            });
        }
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

        // Reward Student Form
        const rewardStudentForm = document.getElementById('rewardStudentForm');
        if (rewardStudentForm) {
            rewardStudentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRewardStudent();
            });
        }

        // Reward event select -> populate student dropdown
        const rewardEventSelect = document.getElementById('rewardEventSelect');
        if (rewardEventSelect) {
            rewardEventSelect.addEventListener('change', () => this.updateRewardStudentDropdown());
        }

        // Mint Certificate Form
        const mintCertificateForm = document.getElementById('mintCertificateForm');
        if (mintCertificateForm) {
            mintCertificateForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleMintCertificate();
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

            // Check if user is admin and show/hide admin tab
            await this.checkAdminAccess();

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
    updateWalletUI(address) {
        const btn = document.getElementById('connectWallet');
        const btnText = document.getElementById('walletButtonText');

        btn.disabled = false;
        btnText.textContent = window.web3Utils.shortenAddress(address);
        btn.classList.add('connected');
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

            // Get activity count (only aktif based on localStorage status)
            const activities = await window.web3Utils.getAllActivities();
            const activeCount = activities.filter(a => this.getActivityStatus(a.id) === 'aktif').length;
            document.getElementById('activityCount').textContent = activeCount;

            // Update recent activity
            this.updateRecentActivity(activities.slice(-5).reverse());

            // Update recent points
            this.updateRecentPoints();

        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    }

    /**
     * Update recent points display
     */
    updateRecentPoints() {
        const container = document.getElementById('recentPoints');
        if (!container) return;

        const points = this.getRecentPoints();

        if (points.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Belum ada poin yang diterima.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = points.map(p => {
            const timeAgo = this.getTimeAgo(p.timestamp);
            return `
                <div class="points-item">
                    <div class="points-info">
                        <span class="points-activity">${p.activityName}</span>
                        <span class="points-time">${timeAgo}</span>
                    </div>
                    <span class="points-amount">+${p.amount} CPNT</span>
                </div>
            `;
        }).join('');
    }

    /**
     * Get time ago string
     */
    getTimeAgo(timestamp) {
        const now = new Date();
        const then = new Date(timestamp);
        const diffMs = now - then;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Baru saja';
        if (diffMins < 60) return `${diffMins} menit lalu`;
        if (diffHours < 24) return `${diffHours} jam lalu`;
        return `${diffDays} hari lalu`;
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

        container.innerHTML = activities.map(activity => {
            const status = this.getActivityStatus(activity.id);
            const isActive = status === 'aktif';
            const statusLabel = status === 'belum' ? '○ Belum Dimulai' : status === 'aktif' ? '● Aktif' : '○ Selesai';
            const statusClass = status === 'aktif' ? 'status-aktif' : status === 'belum' ? 'status-belum' : 'status-selesai';

            return `
                <div class="activity-item" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: var(--spacing-md);
                    border-bottom: 1px solid var(--border-subtle);
                ">
                    <div>
                        <strong>${activity.name}</strong>
                        <span class="status ${statusClass}">
                            ${statusLabel}
                        </span>
                    </div>
                    <span class="points">+${activity.pointReward} CPNT</span>
                </div>
            `;
        }).join('');
    }

    /**
     * Load activities data
     */
    async loadActivitiesData() {
        const container = document.getElementById('activitiesList');

        try {
            container.innerHTML = '<div class="empty-state"><span class="loading"></span> Memuat kegiatan...</div>';

            const activities = await window.web3Utils.getAllActivities();

            // Filter to show only Aktif and Belum Dimulai (not Selesai)
            const filteredActivities = activities.filter(a => {
                const status = this.getActivityStatus(a.id);
                return status !== 'selesai';
            });

            if (filteredActivities.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>Belum ada kegiatan terdaftar. Hubungi admin untuk menambahkan kegiatan.</p>
                    </div>
                `;
                return;
            }

            const attendees = this.getStoredAttendees();
            const currentUser = window.web3Utils.userAddress;

            container.innerHTML = filteredActivities.map(activity => {
                const eventKey = String(activity.id); // Consistent string key
                const status = this.getActivityStatus(activity.id);
                const statusLabel = status === 'belum' ? '○ Belum Dimulai' : '● Sedang Aktif';
                const statusClass = status === 'belum' ? 'status-belum' : 'status-aktif';

                // Check if already registered
                const eventAttendees = attendees[eventKey] || [];
                const isRegistered = currentUser && eventAttendees.includes(currentUser);
                const canJoin = status === 'aktif' && !isRegistered;

                return `
                    <div class="activity-card ${canJoin ? 'joinable' : ''} ${isRegistered ? 'registered' : ''}" 
                         ${canJoin ? `ondblclick="app.requestJoinActivity(${activity.id}, '${activity.name}')"` : ''}>
                        <h4>${activity.name}</h4>
                        <span class="points">💰 ${activity.pointReward} CPNT</span>
                        <div class="status ${isRegistered ? 'status-registered' : statusClass}">
                            ${isRegistered ? '✓ Sudah Terdaftar' : statusLabel}
                        </div>
                    </div>
                `;
            }).join('');

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

            // Toggle is-admin class on body for CSS
            if (this.isOwner) {
                document.body.classList.add('is-admin');
            } else {
                document.body.classList.remove('is-admin');
                const adminPage = document.getElementById('adminPage');
                adminPage.innerHTML = `
                    <div class="page-header">
                        <h2>Akses Ditolak</h2>
                        <p>Anda bukan owner kontrak. Hanya owner yang dapat mengakses panel admin.</p>
                    </div>
                `;
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
        const eventSelect = document.getElementById('rewardEventSelect');
        const studentSelect = document.getElementById('rewardStudentSelect');

        const activityId = eventSelect?.value;
        const studentAddress = studentSelect?.value;

        if (!activityId || !studentAddress) {
            this.showToast('Lengkapi semua field', 'warning');
            return;
        }

        try {
            this.showToast('Mengirim poin...', 'warning');

            // Get activity details for storing
            const activities = await window.web3Utils.getAllActivities();
            const activity = activities.find(a => String(a.id) === String(activityId));

            await window.web3Utils.rewardStudent(activityId, studentAddress);

            // Store recent points
            this.storeRecentPoints({
                activityName: activity?.name || `Kegiatan #${activityId}`,
                amount: activity?.pointReward || 0,
                studentAddress,
                timestamp: new Date().toISOString()
            });

            this.showToast('Poin berhasil dikirim!', 'success');
            eventSelect.value = '';
            studentSelect.innerHTML = '<option value="">-- Pilih kegiatan terlebih dahulu --</option>';

            // Refresh events table
            await this.loadEventsTable();

        } catch (error) {
            this.showToast('Gagal mengirim poin: ' + (error.reason || error.message), 'error');
        }
    }

    /**
     * Handle mint certificate
     */
    async handleMintCertificate() {
        const eventSelect = document.getElementById('certEventSelect');
        const studentSelect = document.getElementById('certStudentSelect');
        const uriInput = document.getElementById('certUri');

        const activityId = eventSelect?.value;
        const studentAddress = studentSelect?.value;
        const uri = uriInput?.value.trim();

        if (!activityId || !studentAddress || !uri) {
            this.showToast('Lengkapi semua field', 'warning');
            return;
        }

        try {
            this.showToast('Menerbitkan sertifikat...', 'warning');

            await window.web3Utils.mintCertificate(activityId, studentAddress, uri);

            this.showToast('Sertifikat berhasil diterbitkan!', 'success');

            // Reset form
            eventSelect.value = '';
            studentSelect.innerHTML = '<option value="">-- Pilih kegiatan terlebih dahulu --</option>';
            uriInput.value = '';
            document.getElementById('certPreviewSection').style.display = 'none';

        } catch (error) {
            this.showToast('Gagal menerbitkan sertifikat: ' + (error.reason || error.message), 'error');
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

    // ===== NEW ADMIN PANEL FUNCTIONS =====

    /**
     * Setup admin tab switching
     */
    setupAdminTabs() {
        const tabs = document.querySelectorAll('.admin-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active from all tabs and contents
                tabs.forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));

                // Add active to clicked tab and corresponding content
                tab.classList.add('active');
                const contentId = tab.dataset.tab;
                document.getElementById(contentId)?.classList.add('active');

                // Load data for the active tab
                this.loadAdminTabData(contentId);
            });
        });
    }

    /**
     * Load data for admin tab
     */
    async loadAdminTabData(tabId) {
        switch (tabId) {
            case 'adminKegiatan':
                await this.loadEventsTable();
                await this.populateEventDropdowns();
                break;
            case 'adminPengajuan':
                await this.loadSubmissions();
                break;
            case 'adminSertifikat':
                await this.loadAllCertificates();
                break;
        }
    }

    /**
     * Load admin dashboard stats
     */
    async loadAdminDashboard() {
        const activities = await window.web3Utils.getAllActivities();
        document.getElementById('adminTotalEvents').textContent = activities.length;

        const submissions = this.getStoredSubmissions();
        document.getElementById('adminPendingReq').textContent = submissions.length;

        // Count certificates (approximation)
        try {
            const nextTokenId = await window.web3Utils.contracts.activityCertificate?.getNextTokenId();
            document.getElementById('adminTotalCerts').textContent = nextTokenId ? (nextTokenId - 1).toString() : '0';
        } catch {
            document.getElementById('adminTotalCerts').textContent = '0';
        }
    }

    /**
     * Load events table
     */
    async loadEventsTable() {
        const tbody = document.getElementById('eventsTableBody');
        if (!tbody) return;

        const activities = await window.web3Utils.getAllActivities();
        const attendees = this.getStoredAttendees();

        if (activities.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Belum ada kegiatan.</td></tr>';
            return;
        }

        tbody.innerHTML = activities.map(a => {
            const eventKey = String(a.id); // Consistent string key
            const eventAttendees = attendees[eventKey] || [];
            const status = this.getActivityStatus(a.id);

            return `
                <tr>
                    <td><strong>#${a.id}</strong></td>
                    <td>${a.name}</td>
                    <td>${a.pointReward} CPNT</td>
                    <td>
                        <span class="status-badge status-${status}">
                            ${status === 'belum' ? 'Belum Dimulai' : status === 'aktif' ? 'Aktif' : 'Selesai'}
                        </span>
                    </td>
                    <td>${eventAttendees.length} orang</td>
                    <td>
                        <div class="status-action">
                            <select class="status-select" id="statusSelect_${a.id}">
                                <option value="belum" ${status === 'belum' ? 'selected' : ''}>Belum Dimulai</option>
                                <option value="aktif" ${status === 'aktif' ? 'selected' : ''}>Aktif</option>
                                <option value="selesai" ${status === 'selesai' ? 'selected' : ''}>Selesai</option>
                            </select>
                            <button class="btn btn-sm btn-primary" onclick="app.submitStatusChange(${a.id})">✓</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Get activity status from localStorage
     */
    getActivityStatus(activityId) {
        const statuses = JSON.parse(localStorage.getItem('campuspoint_activity_status') || '{}');
        return statuses[activityId] || 'belum'; // Default: Belum Dimulai
    }

    /**
     * Set activity status in localStorage
     */
    setActivityStatus(activityId, status) {
        const statuses = JSON.parse(localStorage.getItem('campuspoint_activity_status') || '{}');
        statuses[activityId] = status;
        localStorage.setItem('campuspoint_activity_status', JSON.stringify(statuses));
    }

    /**
     * Change activity status
     */
    changeActivityStatus(activityId, status) {
        this.setActivityStatus(activityId, status);
        this.showToast(`Status kegiatan #${activityId} diubah ke ${status === 'belum' ? 'Belum Dimulai' : status === 'aktif' ? 'Aktif' : 'Selesai'}`, 'success');
        this.loadEventsTable();
    }

    /**
     * Submit status change from button click
     */
    submitStatusChange(activityId) {
        const select = document.getElementById(`statusSelect_${activityId}`);
        if (select) {
            this.changeActivityStatus(activityId, select.value);
        }
    }

    /**
     * Populate event dropdowns
     */
    async populateEventDropdowns() {
        const activities = await window.web3Utils.getAllActivities();
        const dropdowns = ['rewardEventSelect', 'certEventSelect'];

        dropdowns.forEach(id => {
            const select = document.getElementById(id);
            if (!select) return;

            const placeholder = select.querySelector('option');
            select.innerHTML = '';
            if (placeholder) select.appendChild(placeholder);

            activities.forEach(a => {
                const option = document.createElement('option');
                option.value = a.id;
                option.textContent = `#${a.id} - ${a.name}`;
                select.appendChild(option);
            });
        });

        // Setup cert event change handler for student dropdown
        const certEventSelect = document.getElementById('certEventSelect');
        if (certEventSelect) {
            certEventSelect.addEventListener('change', () => this.updateStudentDropdown());
        }
    }

    /**
     * Update student dropdown based on selected event (for mint certificate)
     */
    updateStudentDropdown() {
        const eventId = document.getElementById('certEventSelect')?.value;
        const studentSelect = document.getElementById('certStudentSelect');
        if (!studentSelect) return;

        studentSelect.innerHTML = '<option value="">-- Pilih Mahasiswa --</option>';

        if (!eventId) return;

        const attendees = this.getStoredAttendees();
        const eventAttendees = attendees[eventId] || [];

        eventAttendees.forEach(addr => {
            const option = document.createElement('option');
            option.value = addr;
            option.textContent = window.web3Utils.shortenAddress(addr);
            studentSelect.appendChild(option);
        });
    }

    /**
     * Update student dropdown for reward form
     */
    updateRewardStudentDropdown() {
        const eventId = document.getElementById('rewardEventSelect')?.value;
        const studentSelect = document.getElementById('rewardStudentSelect');
        if (!studentSelect) return;

        studentSelect.innerHTML = '<option value="">-- Pilih Mahasiswa --</option>';

        if (!eventId) return;

        const attendees = this.getStoredAttendees();
        const eventAttendees = attendees[eventId] || [];

        // Filter only valid addresses
        const validAttendees = eventAttendees.filter(addr =>
            addr && addr.startsWith('0x') && addr.length === 42
        );

        if (validAttendees.length === 0) {
            studentSelect.innerHTML = '<option value="">Tidak ada peserta terdaftar</option>';
            return;
        }

        validAttendees.forEach(addr => {
            const option = document.createElement('option');
            option.value = addr;
            option.textContent = `${addr.slice(0, 6)}...${addr.slice(-4)}`;
            studentSelect.appendChild(option);
        });
    }

    // ===== LOCALSTORAGE HELPERS =====

    /**
     * Get stored attendees (students who received points)
     */
    getStoredAttendees() {
        return JSON.parse(localStorage.getItem('campuspoint_attendees') || '{}');
    }

    /**
     * Store attendee for an event
     */
    storeAttendee(eventId, address) {
        console.log('storeAttendee called with:', { eventId, address });

        // Validate address before storing
        if (!address || !address.startsWith('0x') || address.length !== 42) {
            console.warn('Invalid address attempted to store:', address);
            return;
        }

        const attendees = this.getStoredAttendees();
        const key = String(eventId); // Ensure string key
        if (!attendees[key]) attendees[key] = [];
        if (!attendees[key].includes(address)) {
            attendees[key].push(address);
        }
        localStorage.setItem('campuspoint_attendees', JSON.stringify(attendees));
        console.log('Saved attendees:', attendees);
    }

    /**
     * Get recent points transactions
     */
    getRecentPoints() {
        return JSON.parse(localStorage.getItem('campuspoint_recent_points') || '[]');
    }

    /**
     * Store recent points transaction
     */
    storeRecentPoints(pointsData) {
        const points = this.getRecentPoints();
        points.unshift(pointsData); // Add to beginning
        // Keep only last 10
        const trimmed = points.slice(0, 10);
        localStorage.setItem('campuspoint_recent_points', JSON.stringify(trimmed));
    }

    /**
     * Get stored certificate submissions
     */
    getStoredSubmissions() {
        return JSON.parse(localStorage.getItem('campuspoint_submissions') || '[]');
    }

    /**
     * Store new submission
     */
    storeSubmission(submission) {
        const submissions = this.getStoredSubmissions();
        submission.id = Date.now().toString();
        submissions.push(submission);
        localStorage.setItem('campuspoint_submissions', JSON.stringify(submissions));
    }

    /**
     * Remove submission by ID
     */
    removeSubmission(submissionId) {
        let submissions = this.getStoredSubmissions();
        submissions = submissions.filter(s => s.id !== submissionId);
        localStorage.setItem('campuspoint_submissions', JSON.stringify(submissions));
    }

    // ===== PARTICIPATION REQUEST HELPERS =====

    /**
     * Get stored participation requests
     */
    getParticipationRequests() {
        return JSON.parse(localStorage.getItem('campuspoint_participation_requests') || '[]');
    }

    /**
     * Store new participation request
     */
    storeParticipationRequest(request) {
        const requests = this.getParticipationRequests();
        // Check if already requested
        const exists = requests.find(r =>
            r.activityId === request.activityId && r.studentAddress === request.studentAddress
        );
        if (exists) return false;

        request.id = Date.now().toString();
        request.createdAt = new Date().toISOString();
        requests.push(request);
        localStorage.setItem('campuspoint_participation_requests', JSON.stringify(requests));
        return true;
    }

    /**
     * Remove participation request by ID
     */
    removeParticipationRequest(requestId) {
        let requests = this.getParticipationRequests();
        requests = requests.filter(r => r.id !== requestId);
        localStorage.setItem('campuspoint_participation_requests', JSON.stringify(requests));
    }

    /**
     * Request to join an activity (for students) - directly adds them as participant
     */
    async requestJoinActivity(activityId, activityName) {
        if (!window.web3Utils.isConnected) {
            this.showToast('Hubungkan wallet terlebih dahulu', 'warning');
            return;
        }

        // Confirmation dialog
        const confirmed = confirm(`Apakah Anda yakin ingin mengikuti kegiatan "${activityName}"?`);
        if (!confirmed) return;

        const studentAddress = window.web3Utils.userAddress;
        const eventKey = String(activityId); // Ensure consistent string key

        // Check if already a participant
        const attendees = this.getStoredAttendees();
        if (attendees[eventKey]?.includes(studentAddress)) {
            this.showToast('Anda sudah terdaftar di kegiatan ini', 'warning');
            return;
        }

        try {
            this.showToast('Mendaftarkan keikutsertaan...', 'warning');

            // Store attendee with string key
            this.storeAttendee(eventKey, studentAddress);

            this.showToast(`Berhasil terdaftar di kegiatan "${activityName}"!`, 'success');

            // Refresh the page
            await this.loadActivitiesData();

        } catch (error) {
            this.showToast('Gagal mendaftar: ' + (error.reason || error.message), 'error');
        }
    }

    /**
     * Approve participation request (admin)
     */
    async approveParticipation(requestId) {
        const requests = this.getParticipationRequests();
        const request = requests.find(r => r.id === requestId);

        if (!request) {
            this.showToast('Pengajuan tidak ditemukan', 'error');
            return;
        }

        try {
            this.showToast('Mengirim poin...', 'warning');

            await window.web3Utils.rewardStudent(request.activityId, request.studentAddress);

            // Store attendee
            this.storeAttendee(request.activityId, request.studentAddress);

            // Remove request
            this.removeParticipationRequest(requestId);

            this.showToast(`Keikutsertaan ${window.web3Utils.shortenAddress(request.studentAddress)} di "${request.activityName}" disetujui!`, 'success');

            // Refresh
            await this.loadSubmissions();

        } catch (error) {
            this.showToast('Gagal menyetujui: ' + (error.reason || error.message), 'error');
        }
    }

    /**
     * Reject participation request (admin)
     */
    rejectParticipation(requestId) {
        this.removeParticipationRequest(requestId);
        this.showToast('Pengajuan keikutsertaan ditolak', 'info');
        this.loadSubmissions();
    }

    // ===== SUBMISSION HANDLERS =====

    /**
     * Load submissions for admin (external certificate submissions)
     */
    async loadSubmissions() {
        const grid = document.getElementById('submissionsGrid');
        if (!grid) return;

        const submissions = this.getStoredSubmissions();

        if (submissions.length === 0) {
            grid.innerHTML = '<div class="empty-state"><p>Tidak ada pengajuan sertifikat eksternal yang pending.</p></div>';
            return;
        }

        grid.innerHTML = submissions.map(s => `
            <div class="submission-card" data-id="${s.id}">
                <img src="${window.web3Utils.ipfsToHttp(s.ipfsUri)}" 
                     alt="Certificate Preview" 
                     class="submission-preview"
                     onclick="app.openPreviewModal('${s.ipfsUri}', '${s.id}')"
                     onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\'><text x=\\'50%\\' y=\\'50%\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\'>No Image</text></svg>'">
                <div class="submission-info">
                    <h4>${s.eventName}</h4>
                    <p class="submission-requester">${window.web3Utils.shortenAddress(s.requester)}</p>
                </div>
                <div class="submission-points">
                    <label>Poin:</label>
                    <input type="number" id="points_${s.id}" value="100" min="1" max="10000" class="points-input">
                </div>
                <div class="submission-actions">
                    <button class="btn btn-approve" onclick="app.approveSubmission('${s.id}')">✓ Approve</button>
                    <button class="btn btn-reject" onclick="app.rejectSubmission('${s.id}')">✕ Tolak</button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Open preview modal
     */
    openPreviewModal(ipfsUri, submissionId) {
        const imageUrl = window.web3Utils.ipfsToHttp(ipfsUri);
        this.openModal('Preview Sertifikat', `
            <div style="text-align: center;">
                <img src="${imageUrl}" style="max-width: 100%; max-height: 70vh; border-radius: 8px;">
                <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
                    <button class="btn btn-approve" onclick="app.approveSubmission('${submissionId}')">✓ Approve</button>
                    <button class="btn btn-reject" onclick="app.rejectSubmission('${submissionId}')">✕ Tolak</button>
                </div>
            </div>
        `);
    }

    /**
     * Approve submission - mint certificate AND give custom points
     */
    async approveSubmission(submissionId) {
        const submissions = this.getStoredSubmissions();
        const submission = submissions.find(s => s.id === submissionId);

        if (!submission) {
            this.showToast('Submission tidak ditemukan', 'error');
            return;
        }

        // Get custom points from input
        const pointsInput = document.getElementById(`points_${submissionId}`);
        const points = parseInt(pointsInput?.value) || 100;

        if (points < 1) {
            this.showToast('Poin harus minimal 1', 'warning');
            return;
        }

        try {
            this.closeModal();
            this.showToast('Menerbitkan sertifikat...', 'warning');

            // Mint certificate only (poin diberikan lewat "Berikan Poin")
            await window.web3Utils.mintCertificate(1, submission.requester, submission.ipfsUri);

            this.removeSubmission(submissionId);
            this.showToast(`Sertifikat berhasil diterbitkan! Gunakan "Berikan Poin" untuk memberikan ${points} CPNT.`, 'success');
            await this.loadSubmissions();

        } catch (error) {
            this.showToast('Gagal menerbitkan: ' + (error.reason || error.message), 'error');
        }
    }

    /**
     * Reject submission
     */
    rejectSubmission(submissionId) {
        this.removeSubmission(submissionId);
        this.closeModal();
        this.showToast('Pengajuan ditolak', 'warning');
        this.loadSubmissions();
        this.loadAdminDashboard();
    }

    /**
     * Load all certificates for admin gallery
     */
    async loadAllCertificates() {
        const gallery = document.getElementById('allCertificatesGallery');
        if (!gallery) return;

        try {
            const certs = await window.web3Utils.getUserCertificates();
            // This shows owner's certs; ideally we'd query all certs
            if (certs.length === 0) {
                gallery.innerHTML = '<div class="empty-state"><p>Belum ada sertifikat yang diterbitkan.</p></div>';
                return;
            }

            gallery.innerHTML = certs.map(c => `
                <div class="cert-gallery-item" onclick="app.openModal('Sertifikat #${c.tokenId}', '<img src=&quot;${c.imageUrl}&quot; style=&quot;max-width:100%;&quot;>')">
                    <img src="${c.imageUrl || 'data:image/svg+xml,<svg></svg>'}" alt="Certificate">
                    <span>Token #${c.tokenId}</span>
                </div>
            `).join('');
        } catch (error) {
            gallery.innerHTML = '<div class="empty-state"><p>Gagal memuat sertifikat.</p></div>';
        }
    }

    /**
     * Handle student certificate request
     */
    async handleRequestCertificate() {
        const eventName = document.getElementById('reqEventName')?.value.trim();
        const ipfsUri = document.getElementById('reqIpfsUri')?.value.trim();

        if (!eventName || !ipfsUri) {
            this.showToast('Lengkapi semua field', 'warning');
            return;
        }

        if (!window.web3Utils.userAddress) {
            this.showToast('Hubungkan wallet terlebih dahulu', 'error');
            return;
        }

        this.storeSubmission({
            eventName,
            ipfsUri,
            requester: window.web3Utils.userAddress,
            timestamp: Date.now()
        });

        this.showToast('Pengajuan sertifikat berhasil dikirim!', 'success');
        document.getElementById('reqEventName').value = '';
        document.getElementById('reqIpfsUri').value = '';
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CampusPointApp();
});
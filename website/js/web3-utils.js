/**
 * Web3 Utility Functions
 * Helper functions for wallet connection, IPFS, and blockchain interactions
 */

class Web3Utils {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.userAddress = null;
        this.contracts = {};
        this.isConnected = false;
    }

    /**
     * Check if MetaMask is installed
     */
    isMetaMaskInstalled() {
        return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
    }

    /**
     * Connect to MetaMask wallet
     */
    async connectWallet() {
        if (!this.isMetaMaskInstalled()) {
            throw new Error('MetaMask tidak terinstall. Silakan install MetaMask terlebih dahulu.');
        }

        try {
            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length === 0) {
                throw new Error('Tidak ada akun yang dipilih');
            }

            // Check and switch to correct network
            await this.switchToNetwork();

            // Setup ethers provider and signer
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            this.userAddress = accounts[0];
            this.isConnected = true;

            // Initialize contracts
            this.initializeContracts();

            // Setup event listeners
            this.setupEventListeners();

            return {
                address: this.userAddress,
                shortAddress: this.shortenAddress(this.userAddress)
            };
        } catch (error) {
            console.error('Wallet connection error:', error);
            throw error;
        }
    }

    /**
     * Switch to configured network (Ganache)
     */
    async switchToNetwork() {
        const config = window.ContractConfig.network;

        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: config.chainId }]
            });
        } catch (switchError) {
            // Network doesn't exist, add it
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: config.chainId,
                        chainName: config.chainName,
                        rpcUrls: config.rpcUrls,
                        nativeCurrency: config.nativeCurrency,
                        blockExplorerUrls: config.blockExplorerUrls
                    }]
                });
            } else {
                throw switchError;
            }
        }
    }

    /**
     * Get current network name
     */
    async getNetworkName() {
        if (!this.provider) return 'Not Connected';

        try {
            const network = await this.provider.getNetwork();
            const chainId = network.chainId;

            // Common network names
            const networks = {
                1: 'Ethereum Mainnet',
                5: 'Goerli Testnet',
                11155111: 'Sepolia Testnet',
                1337: 'Ganache Local',
                5777: 'Ganache Local'
            };

            return networks[chainId] || `Chain ID: ${chainId}`;
        } catch (error) {
            return 'Unknown';
        }
    }

    /**
     * Initialize contract instances
     */
    initializeContracts() {
        const addresses = window.ContractConfig.addresses;
        const abis = window.ContractConfig.abis;

        // Only initialize if addresses are set (not zero address)
        const zeroAddress = '0x0000000000000000000000000000000000000000';

        if (addresses.CAMPUS_POINT !== zeroAddress) {
            this.contracts.campusPoint = new ethers.Contract(
                addresses.CAMPUS_POINT,
                abis.campusPoint,
                this.signer
            );
        }

        if (addresses.ACTIVITY_CERTIFICATE !== zeroAddress) {
            this.contracts.activityCertificate = new ethers.Contract(
                addresses.ACTIVITY_CERTIFICATE,
                abis.activityCertificate,
                this.signer
            );
        }

        if (addresses.ACTIVITY_MANAGER !== zeroAddress) {
            this.contracts.activityManager = new ethers.Contract(
                addresses.ACTIVITY_MANAGER,
                abis.activityManager,
                this.signer
            );
        }
    }

    /**
     * Setup MetaMask event listeners
     */
    setupEventListeners() {
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                this.disconnect();
                window.location.reload();
            } else {
                this.userAddress = accounts[0];
                window.dispatchEvent(new CustomEvent('walletChanged', {
                    detail: { address: accounts[0] }
                }));
            }
        });

        window.ethereum.on('chainChanged', () => {
            window.location.reload();
        });
    }

    /**
     * Disconnect wallet
     */
    disconnect() {
        this.provider = null;
        this.signer = null;
        this.userAddress = null;
        this.contracts = {};
        this.isConnected = false;
    }

    /**
     * Shorten address for display
     */
    shortenAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    /**
     * Convert IPFS URI to HTTP URL
     */
    ipfsToHttp(ipfsUri) {
        if (!ipfsUri) return null;

        // If already HTTP, return as is
        if (ipfsUri.startsWith('http://') || ipfsUri.startsWith('https://')) {
            return ipfsUri;
        }

        // Handle ipfs:// protocol
        if (ipfsUri.startsWith('ipfs://')) {
            const hash = ipfsUri.replace('ipfs://', '');
            return window.ContractConfig.ipfsGateways[0] + hash;
        }

        // Handle raw IPFS hash
        if (ipfsUri.startsWith('Qm') || ipfsUri.startsWith('bafy')) {
            return window.ContractConfig.ipfsGateways[0] + ipfsUri;
        }

        return ipfsUri;
    }

    /**
     * Fetch IPFS metadata
     */
    async fetchIPFSMetadata(uri) {
        const httpUrl = this.ipfsToHttp(uri);
        if (!httpUrl) return null;

        try {
            const response = await fetch(httpUrl);
            if (!response.ok) throw new Error('Failed to fetch metadata');
            return await response.json();
        } catch (error) {
            console.error('Error fetching IPFS metadata:', error);

            // Try alternative gateways
            for (let i = 1; i < window.ContractConfig.ipfsGateways.length; i++) {
                try {
                    const hash = uri.replace('ipfs://', '').replace(/^\/ipfs\//, '');
                    const altUrl = window.ContractConfig.ipfsGateways[i] + hash;
                    const response = await fetch(altUrl);
                    if (response.ok) {
                        return await response.json();
                    }
                } catch (e) {
                    continue;
                }
            }

            return null;
        }
    }

    /**
     * Get Campus Point balance
     */
    async getPointBalance(address = null) {
        const targetAddress = address || this.userAddress;
        if (!targetAddress || !this.contracts.campusPoint) return 0;

        try {
            const balance = await this.contracts.campusPoint.balanceOf(targetAddress);
            return balance.toString();
        } catch (error) {
            console.error('Error getting point balance:', error);
            return 0;
        }
    }

    /**
     * Get certificate count
     */
    async getCertificateCount(address = null) {
        const targetAddress = address || this.userAddress;
        if (!targetAddress || !this.contracts.activityCertificate) return 0;

        try {
            const balance = await this.contracts.activityCertificate.balanceOf(targetAddress);
            return balance.toString();
        } catch (error) {
            console.error('Error getting certificate count:', error);
            return 0;
        }
    }

    /**
     * Get all activities
     */
    async getAllActivities() {
        if (!this.contracts.activityManager) return [];

        try {
            const nextId = await this.contracts.activityManager.nextActivityId();
            const activities = [];

            for (let i = 1; i < nextId; i++) {
                try {
                    const activity = await this.contracts.activityManager.getActivity(i);
                    if (activity.id && activity.id.toString() !== '0') {
                        activities.push({
                            id: activity.id.toString(),
                            name: activity.name,
                            pointReward: activity.pointReward.toString(),
                            isActive: activity.isActive
                        });
                    }
                } catch (e) {
                    console.error(`Error fetching activity ${i}:`, e);
                }
            }

            return activities;
        } catch (error) {
            console.error('Error getting activities:', error);
            return [];
        }
    }

    /**
     * Get user's certificates
     */
    async getUserCertificates(address = null) {
        const targetAddress = address || this.userAddress;
        if (!targetAddress || !this.contracts.activityCertificate) return [];

        try {
            const balance = await this.contracts.activityCertificate.balanceOf(targetAddress);
            const certificates = [];

            // Note: This is a simplified approach. In production, you'd want to use
            // enumerable extension or event logs to get token IDs
            const nextTokenId = await this.contracts.activityCertificate.getNextTokenId();

            for (let i = 1; i < nextTokenId; i++) {
                try {
                    const owner = await this.contracts.activityCertificate.ownerOf(i);
                    if (owner.toLowerCase() === targetAddress.toLowerCase()) {
                        const tokenUri = await this.contracts.activityCertificate.tokenURI(i);
                        const metadata = await this.fetchIPFSMetadata(tokenUri);

                        certificates.push({
                            tokenId: i.toString(),
                            tokenUri: tokenUri,
                            metadata: metadata,
                            imageUrl: metadata?.image ? this.ipfsToHttp(metadata.image) : null
                        });
                    }
                } catch (e) {
                    // Token might not exist, continue
                    continue;
                }
            }

            return certificates;
        } catch (error) {
            console.error('Error getting certificates:', error);
            return [];
        }
    }

    /**
     * Check if user is contract owner
     */
    async isContractOwner() {
        if (!this.userAddress || !this.contracts.activityManager) return false;

        try {
            const owner = await this.contracts.activityManager.owner();
            return owner.toLowerCase() === this.userAddress.toLowerCase();
        } catch (error) {
            console.error('Error checking owner:', error);
            return false;
        }
    }

    /**
     * Create new activity (admin only)
     */
    async createActivity(name, pointReward) {
        if (!this.contracts.activityManager) {
            throw new Error('Contract belum dikonfigurasi');
        }

        const tx = await this.contracts.activityManager.createActivity(name, pointReward);
        await tx.wait();
        return tx;
    }

    /**
     * Reward student (admin only)
     */
    async rewardStudent(activityId, studentAddress) {
        if (!this.contracts.activityManager) {
            throw new Error('Contract belum dikonfigurasi');
        }

        const tx = await this.contracts.activityManager.rewardStudent(activityId, studentAddress);
        await tx.wait();
        return tx;
    }

    /**
     * Mint certificate (admin only)
     */
    async mintCertificate(activityId, studentAddress, uri) {
        if (!this.contracts.activityManager) {
            throw new Error('Contract belum dikonfigurasi');
        }

        const tx = await this.contracts.activityManager.mintCertificate(activityId, studentAddress, uri);
        await tx.wait();
        return tx;
    }

    /**
     * Set certificate URI template (admin only)
     */
    async setActivityCertUri(activityId, uri) {
        if (!this.contracts.activityManager) {
            throw new Error('Contract belum dikonfigurasi');
        }

        const tx = await this.contracts.activityManager.setActivityCertUri(activityId, uri);
        await tx.wait();
        return tx;
    }

    /**
     * Verify token - get owner and URI by tokenId
     */
    async verifyToken(tokenId) {
        if (!this.contracts.activityCertificate) {
            throw new Error('Contract belum dikonfigurasi');
        }

        const owner = await this.contracts.activityCertificate.ownerOf(tokenId);
        const tokenUri = await this.contracts.activityCertificate.tokenURI(tokenId);

        return {
            tokenId: tokenId,
            owner: owner,
            tokenUri: tokenUri
        };
    }

    /**
     * Get activities that user can claim certificate for
     */
    async getClaimableActivities(address = null) {
        const targetAddress = address || this.userAddress;
        if (!targetAddress || !this.contracts.activityManager) return [];

        try {
            const nextId = await this.contracts.activityManager.nextActivityId();
            const claimable = [];

            for (let i = 1; i < nextId; i++) {
                try {
                    const canClaim = await this.contracts.activityManager.canClaimCertificate(i, targetAddress);
                    if (canClaim) {
                        const activity = await this.contracts.activityManager.getActivity(i);
                        claimable.push({
                            id: activity.id.toString(),
                            name: activity.name,
                            pointReward: activity.pointReward.toString(),
                            certUri: activity.certUri
                        });
                    }
                } catch (e) {
                    continue;
                }
            }

            return claimable;
        } catch (error) {
            console.error('Error getting claimable activities:', error);
            return [];
        }
    }

    /**
     * Claim certificate (student)
     */
    async claimCertificate(activityId) {
        if (!this.contracts.activityManager) {
            throw new Error('Contract belum dikonfigurasi');
        }

        const tx = await this.contracts.activityManager.claimCertificate(activityId);
        await tx.wait();
        return tx;
    }
}

// Create global instance
window.web3Utils = new Web3Utils();

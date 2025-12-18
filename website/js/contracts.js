// Smart Contract Addresses - Update these after deploying to Sepolia
const CONTRACT_ADDRESSES = {
    CAMPUS_POINT: '0xFc39Ec4DC40E67Ca3599394D55d3b049F2D50997',
    ACTIVITY_CERTIFICATE: '0x219c7f329320386D1511594A4B215f2C67d96af8',
    ACTIVITY_MANAGER: '0xD4F90c2A72FFd8F6B128cf1907821230437C0D21'
};

// Network Configuration - Change to match your network
// For Ganache Local: chainId '0x539' (1337) or '0x1691' (5777)
// For Sepolia: chainId '0xaa36a7' (11155111)
const NETWORK_CONFIG = {
    chainId: '0x539', // Ganache default (1337 in hex) - Change to '0xaa36a7' for Sepolia
    chainName: 'Ganache Local',
    rpcUrls: ['http://127.0.0.1:7545'],
    nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18
    },
    blockExplorerUrls: ['']
};

// IPFS Gateways for fetching metadata/images
const IPFS_GATEWAYS = [
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/'
];

// CampusPoint ABI (ERC20)
const CAMPUS_POINT_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",
    "function mint(address to, uint256 amount)",
    "function owner() view returns (address)",
    "function transferOwnership(address newOwner)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// ActivityCertificate ABI (ERC721)
const ACTIVITY_CERTIFICATE_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function balanceOf(address owner) view returns (uint256)",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function approve(address to, uint256 tokenId)",
    "function getApproved(uint256 tokenId) view returns (address)",
    "function setApprovalForAll(address operator, bool approved)",
    "function isApprovedForAll(address owner, address operator) view returns (bool)",
    "function transferFrom(address from, address to, uint256 tokenId)",
    "function safeTransferFrom(address from, address to, uint256 tokenId)",
    "function mintCertificate(address to, string memory uri) returns (uint256)",
    "function getNextTokenId() view returns (uint256)",
    "function owner() view returns (address)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)"
];

// ActivityManager ABI
const ACTIVITY_MANAGER_ABI = [
    "function owner() view returns (address)",
    "function campusPoint() view returns (address)",
    "function activityCert() view returns (address)",
    "function nextActivityId() view returns (uint256)",
    "function activities(uint256) view returns (uint256 id, string name, uint256 pointReward, bool isActive)",
    "function getActivity(uint256 activityId) view returns (uint256 id, string name, uint256 pointReward, bool isActive)",
    "function createActivity(string name, uint256 pointReward)",
    "function setActivityActive(uint256 activityId, bool active)",
    "function rewardStudent(uint256 activityId, address student)",
    "function mintCertificate(uint256 activityId, address student, string uri)",
    "event ActivityCreated(uint256 indexed id, string name, uint256 pointReward)",
    "event StudentRewarded(uint256 indexed activityId, address indexed student, uint256 pointReward)",
    "event CertificateMinted(uint256 indexed activityId, address indexed student, uint256 tokenId, string uri)"
];

// Export for use in other files
window.ContractConfig = {
    addresses: CONTRACT_ADDRESSES,
    network: NETWORK_CONFIG,
    ipfsGateways: IPFS_GATEWAYS,
    abis: {
        campusPoint: CAMPUS_POINT_ABI,
        activityCertificate: ACTIVITY_CERTIFICATE_ABI,
        activityManager: ACTIVITY_MANAGER_ABI
    }
};

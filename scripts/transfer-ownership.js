/**
 * Script untuk transfer ownership CampusPoint dan ActivityCertificate ke ActivityManager
 * Jalankan dengan: node transfer-ownership.js
 */

const ethers = require('ethers');

// Contract Addresses - sesuaikan dengan deployment Anda
const CAMPUS_POINT = '0xE1CE91ff70b2b2ac3E27A0cacDb4C2ac06a693e2';
const ACTIVITY_CERTIFICATE = '0x97eAa29122161bc8f21c3A57df1e37852AA3e99a';
const ACTIVITY_MANAGER = '0x4b949075E934cCC95e3Fd833F9463C82Be318F1b';

// Ganache RPC
const RPC_URL = 'http://127.0.0.1:7545';

// Owner private key - GANTI DENGAN PRIVATE KEY DARI GANACHE (account pertama)
// Bisa dilihat di Ganache UI -> klik icon kunci di samping address
const OWNER_PRIVATE_KEY = '0x374fe29fcdc7068581336de1ca83488a671818af3b87c0e63b99696236b9951f';

// ABI minimal untuk transferOwnership
const OWNERSHIP_ABI = [
    'function owner() view returns (address)',
    'function transferOwnership(address newOwner)'
];

async function main() {
    console.log('=== Transfer Ownership Script ===\n');

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);

    console.log('Connected wallet:', wallet.address);
    console.log('');

    // Connect to contracts
    const campusPoint = new ethers.Contract(CAMPUS_POINT, OWNERSHIP_ABI, wallet);
    const activityCert = new ethers.Contract(ACTIVITY_CERTIFICATE, OWNERSHIP_ABI, wallet);

    // Check current owners
    const cpOwner = await campusPoint.owner();
    const acOwner = await activityCert.owner();

    console.log('Current CampusPoint Owner:', cpOwner);
    console.log('Current ActivityCertificate Owner:', acOwner);
    console.log('ActivityManager Address:', ACTIVITY_MANAGER);
    console.log('');

    // Transfer CampusPoint ownership
    if (cpOwner.toLowerCase() !== ACTIVITY_MANAGER.toLowerCase()) {
        console.log('Transferring CampusPoint ownership to ActivityManager...');
        const tx1 = await campusPoint.transferOwnership(ACTIVITY_MANAGER);
        await tx1.wait();
        console.log('✅ CampusPoint ownership transferred!');
    } else {
        console.log('✅ CampusPoint already owned by ActivityManager');
    }

    // Transfer ActivityCertificate ownership
    if (acOwner.toLowerCase() !== ACTIVITY_MANAGER.toLowerCase()) {
        console.log('Transferring ActivityCertificate ownership to ActivityManager...');
        const tx2 = await activityCert.transferOwnership(ACTIVITY_MANAGER);
        await tx2.wait();
        console.log('✅ ActivityCertificate ownership transferred!');
    } else {
        console.log('✅ ActivityCertificate already owned by ActivityManager');
    }

    console.log('\n=== Transfer Complete! ===');
    console.log('Sekarang coba lagi di website untuk:');
    console.log('- Kirim poin ke mahasiswa');
    console.log('- Mint sertifikat');
}

main().catch(console.error);

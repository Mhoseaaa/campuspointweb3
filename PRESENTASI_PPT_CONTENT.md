# Campus Point Web3 App - Konten Presentasi PPT

## SLIDE 1: JUDUL
**Campus Point: Sistem Poin & Sertifikat Mahasiswa Berbasis Blockchain**

- Studi Kasus Web3 Integration (ERC20 + ERC721)
- Integrasi Token ERC20 dan NFT ERC721 untuk Sistem Poin & Sertifikat Mahasiswa
- Program Studi Informatika
- Fakultas Teknologi Informasi
- Universitas Kristen Duta Wacana
- 2025

---

## SLIDE 2: LATAR BELAKANG & MASALAH
**Mengapa Campus Point?**

**Latar Belakang:**
- Universitas memerlukan sistem digital untuk mencatat partisipasi mahasiswa
- Kebutuhan transparansi dalam pemberian reward dan sertifikat
- Tantangan: Sertifikat tradisional mudah dipalsukan
- Solusi: Memanfaatkan blockchain untuk keamanan dan verifikasi

**Masalah yang Diselesaikan:**
1. ✅ Sistem poin terpusat → Token ERC20 (CPNT) terdesentralisasi
2. ✅ Sertifikat kertas rawan hilang → NFT ERC721 permanen di blockchain
3. ✅ Sulit verifikasi kredibilitas → On-chain verification via smart contract

---

## SLIDE 3: TUJUAN PEMBELAJARAN
**Apa yang akan dipelajari?**

Mahasiswa mampu:
1. ✅ Memahami konsep Web3, smart contract, ERC20, ERC721
2. ✅ Menjelaskan protokol transfer token dan NFT minting
3. ✅ Merancang business logic sistem reward akademik
4. ✅ Mengintegrasikan frontend Web3App dengan MetaMask
5. ✅ Berinteraksi dengan smart contract dari browser
6. ✅ Presentasi solusi dan dokumentasi

---

## SLIDE 4: ARSITEKTUR SISTEM
**Tech Stack & Infrastruktur**

```
┌─────────────────────────────────────────┐
│         Frontend (Web3App)              │
│  - HTML/CSS/JavaScript                  │
│  - ethers.js Library                    │
│  - MetaMask Integration                 │
└────────────┬────────────────────────────┘
             │
     ┌───────▼───────┐
     │   MetaMask    │
     │   Wallet      │
     └───────┬───────┘
             │
┌────────────▼────────────────────────────┐
│      Blockchain Network                 │
│  - Ganache (Local Dev)                  │
│  - Sepolia Testnet (Production)         │
└────────────┬────────────────────────────┘
             │
     ┌───────▼────────────────┐
     │   Smart Contracts      │
     ├────────────────────────┤
     │ • CampusPoint (ERC20)  │
     │ • ActivityCertificate  │
     │   (ERC721)             │
     │ • ActivityManager      │
     │   (Business Logic)     │
     └────────────────────────┘
```

---

## SLIDE 5: SMART CONTRACT - CAMPUSPOINT (ERC20)
**Token Poin Mahasiswa**

```solidity
Contract: CampusPoint
├── Token Name: "Campus Point"
├── Symbol: "CPNT"
├── Decimals: 0 (whole numbers only)
└── Fitur:
    ├── balanceOf(address) → cek saldo poin
    ├── transfer(to, amount) → transfer poin
    ├── approve(spender, amount) → otorisasi transfer
    ├── transferFrom(from, to, amount) → transfer poin atas nama
    ├── mint(to, amount) [OWNER] → create poin baru
    └── transferOwnership(newOwner) [OWNER] → ganti owner
```

**Kegunaan:**
- Mahasiswa menerima CPNT sebagai apresiasi kegiatan
- Dapat ditransfer antar mahasiswa
- Bersifat divisible & trackable

---

## SLIDE 6: SMART CONTRACT - ACTIVITYCERTIFICATE (ERC721)
**Sertifikat NFT Unik**

```solidity
Contract: ActivityCertificate
├── Token Name: "Activity Certificate"
├── Symbol: "ACTCERT"
└── Fitur:
    ├── ownerOf(tokenId) → pemilik sertifikat
    ├── balanceOf(address) → jumlah sertifikat dimiliki
    ├── tokenURI(tokenId) → metadata JSON (IPFS)
    ├── transferFrom(from, to, tokenId) → transfer sertifikat
    ├── approve(to, tokenId) → otorisasi transfer
    ├── setApprovalForAll(operator, approved) → approval batch
    ├── mintCertificate(to, uri) [OWNER] → buat sertifikat NFT baru
    └── transferOwnership(newOwner) [OWNER] → ganti owner
```

**Keunikan:**
- Setiap sertifikat punya tokenId unik
- Metadata tersimpan di IPFS (terdesentralisasi)
- Tidak dapat diubah, dipalsukan, atau duplikat

---

## SLIDE 7: SMART CONTRACT - ACTIVITYMANAGER
**Orchestrator Bisnis**

```solidity
Contract: ActivityManager
├── References:
│   ├── CampusPoint (ERC20)
│   └── ActivityCertificate (ERC721)
└── Fungsi Utama:
    ├── createActivity(name, pointReward) [OWNER]
    │   → Daftarkan kegiatan baru
    │
    ├── rewardStudent(activityId, student) [OWNER]
    │   → Mint poin ke mahasiswa
    │
    ├── mintCertificate(activityId, student, uri) [OWNER]
    │   → Mint sertifikat NFT langsung
    │
    ├── claimCertificate(activityId) [PUBLIC]
    │   → Mahasiswa klaim sertifikat jika eligible
    │
    └── getActivity(activityId) [VIEW]
        → Baca data kegiatan
```

**Tracking:**
- `hasRewarded` → siapa saja yang sudah dapat poin untuk kegiatan
- `hasClaimed` → siapa saja yang sudah klaim sertifikat

---

## SLIDE 8: ALUR BISNIS - SKENARIO KEGIATAN
**Tahapan Dari Awal Hingga Akhir**

```
FASE 1: SETUP (Admin)
├── Deploy 3 smart contract (CampusPoint, ActivityCertificate, ActivityManager)
├── Set contract addresses di ActivityManager
└── Grant ownership permissions

FASE 2: KEGIATAN BERLANGSUNG
├── Admin membuat activity baru
│   createActivity("Seminar AI", 100 points)
├── Kegiatan berlangsung...
└── Admin mencatat peserta yang hadir

FASE 3: DISTRIBUSI REWARD
├── Admin memanggil rewardStudent untuk tiap peserta
│   rewardStudent(activityId=1, student=0xABC...)
├── Smart contract mint 100 CPNT ke 0xABC...
├── Event StudentRewarded dicatat
└── Mahasiswa bisa lihat saldo di dashboard

FASE 4: KLAIM SERTIFIKAT
├── Admin set template URI sertifikat
│   setActivityCertUri(activityId=1, uri="ipfs://QmXXX")
├── Mahasiswa klaim sertifikat mereka
│   claimCertificate(activityId=1)
├── Smart contract mint NFT dengan tokenId unik
├── NFT tersimpan di wallet mahasiswa
└── Mahasiswa bisa lihat sertifikat di koleksi

FASE 5: VERIFIKASI
├── Siapa saja bisa verify sertifikat
│   ownerOf(tokenId) → lihat pemilik
│   tokenURI(tokenId) → lihat metadata
└── Transparansi 100% via blockchain
```

---

## SLIDE 9: WEB3APP - FRONTEND ARCHITECTURE
**Struktur Frontend**

```
website/
├── index.html (Main Page Structure)
│   ├── Sidebar Navigation
│   │   ├── Dashboard
│   │   ├── Kegiatan
│   │   ├── Sertifikat
│   │   └── Admin Panel
│   ├── Header (Connect Wallet Button)
│   └── Page Container
│       ├── Dashboard Page
│       ├── Activities Page
│       ├── Certificates Page
│       └── Admin Page
│
├── styles.css (UI/UX Styling)
│   ├── Dark theme modern (blockchain aesthetic)
│   ├── Responsive design
│   ├── Card-based layout
│   └── Animations & transitions
│
└── js/
    ├── app.js (Main Application Logic)
    │   ├── Routing & navigation
    │   ├── Page data loading
    │   └── UI event handlers
    │
    ├── web3-utils.js (Web3 Connection)
    │   ├── MetaMask integration
    │   ├── Wallet connection/disconnection
    │   ├── Account switching
    │   └── Network detection
    │
    └── contracts.js (Contract Interaction)
        ├── Contract ABIs
        ├── Contract addresses
        └── Helper functions
```

---

## SLIDE 10: FITUR - DASHBOARD
**Landing Page Utama**

**Komponen:**
1. **Welcome Section**
   - Sapaan personalisasi
   - Deskripsi singkat sistem

2. **Stats Grid (3 Kartu)**
   - Total Points (CPNT Balance)
   - Certificates Owned (NFT Count)
   - Active Events (Kegiatan Berlangsung)

3. **Recent Activity Section**
   - List aktivitas terbaru
   - Transaction history
   - Empty state jika belum ada aktivitas

**Interaksi:**
- Auto-load saat wallet terkoneksi
- Real-time update saldo
- Link ke halaman detail aktivitas

---

## SLIDE 11: FITUR - DAFTAR KEGIATAN
**Activities Page**

**Tampilan:**
- Grid layout kartu kegiatan
- Setiap kartu menampilkan:
  - Nama kegiatan
  - Jumlah poin reward
  - Status (Active/Inactive)
  - Tombol "Join" atau "View Details"

**Fitur:**
- Filter berdasarkan status
- Search kegiatan berdasarkan nama
- Sorting by points (ascending/descending)
- Integrasi dengan ActivityManager.getActivity()

**User Journey:**
```
Lihat Kegiatan → Pilih Kegiatan → Join/Register → 
Tunggu Hasil Admin → Check Dashboard untuk Poin
```

---

## SLIDE 12: FITUR - KOLEKSI SERTIFIKAT
**Certificates Page**

**Tampilan:**
- Grid layout sertifikat NFT
- Setiap kartu menampilkan:
  - Preview sertifikat (dari tokenURI/IPFS)
  - Nama kegiatan
  - Tanggal diterima
  - Token ID (blockchain verification)
  - Tombol "View on Blockchain"

**Fitur:**
- Load NFT dari wallet via ActivityCertificate.balanceOf()
- Ambil metadata dari IPFS
- Export/share sertifikat
- Link ke blockchain explorer

**Data Source:**
```javascript
// Ambil jumlah sertifikat
balanceOf(userAddress)

// Ambil detail setiap sertifikat
for each tokenId:
  - ownerOf(tokenId)
  - tokenURI(tokenId) → fetch JSON dari IPFS
```

---

## SLIDE 13: FITUR - ADMIN PANEL
**Admin Management Interface**

**Bagian 1: Buat Kegiatan Baru**
```
Form Input:
├── Nama Kegiatan [text input]
├── Poin Reward [number input]
└── [Buat Kegiatan] button

Proses:
activity = ActivityManager.createActivity(name, pointReward)
Emit: ActivityCreated event
```

**Bagian 2: Berikan Poin ke Mahasiswa**
```
Form Input:
├── ID Kegiatan [number input]
├── Alamat Wallet Mahasiswa [text input]
└── [Kirim Poin] button

Proses:
ActivityManager.rewardStudent(activityId, studentAddress)
Emit: StudentRewarded event
Smart contract mints poin
```

**Bagian 3: Terbitkan Sertifikat NFT**
```
Form Input:
├── ID Kegiatan [number input]
├── Alamat Wallet Mahasiswa [text input]
├── IPFS URI Metadata [text input]
├── [Preview] button → tampilkan sertifikat preview
└── [Terbitkan Sertifikat] button

Proses:
1. Fetch metadata dari IPFS (Preview)
2. User review sertifikat
3. ActivityManager.mintCertificate(activityId, student, uri)
4. Emit: CertificateMinted event
5. NFT muncul di wallet mahasiswa
```

**Authorization:**
- Hanya owner ActivityManager yang bisa akses
- Gated by `msg.sender == owner` check
- Multi-sig recommended untuk production

---

## SLIDE 14: TEKNOLOGI & TOOLS
**Tech Stack Detailed**

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Smart Contract** | Solidity 0.8.20 | Contract logic |
| | Ethereum Chain | Public ledger |
| **Local Dev** | Ganache | Blockchain lokal |
| | Remix IDE | Compile & deploy |
| **Wallet** | MetaMask | User authentication + signing |
| **Frontend** | HTML5 | Markup |
| | CSS3 | Styling (dark theme) |
| | JavaScript (Vanilla) | Interactivity |
| | ethers.js v5.7 | Web3 library |
| **Storage** | IPFS | Metadata terdesentralisasi |
| **Hosting** | VS Code Live Server | Dev server |
| | | HTTP server produksi |

---

## SLIDE 15: DEPLOYMENT FLOW
**Cara Deploy & Setup**

**Tahap 1: Setup Local Environment**
```bash
# Install dependencies
npm install -g ganache-cli
# atau gunakan Ganache GUI

# Clone repository
git clone <repo-url>
cd campuspointweb3
```

**Tahap 2: Jalankan Ganache**
```bash
ganache-cli --deterministic
# Account 0 akan menjadi admin/owner
```

**Tahap 3: Compile & Deploy Smart Contract**
```
Di Remix IDE:
1. Copy paste CampusPoint.sol
2. Compile (Solidity 0.8.20)
3. Deploy di localhost:8545 (Ganache)
4. Copy contract address

Ulangi untuk ActivityCertificate dan ActivityManager
```

**Tahap 4: Setup Frontend**
```bash
# Di folder website, setup MetaMask:
# - Tambah network localhost:8545
# - Import account dari Ganache

# Jalankan server
cd website
python3 -m http.server 8000
# Atau gunakan Live Server di VS Code
```

**Tahap 5: Update Contract Addresses**
```javascript
// Di web3-utils.js atau contracts.js
const CONTRACT_ADDRESSES = {
  campusPoint: "0x...",          // Copy dari deploy
  activityCertificate: "0x...",  // Copy dari deploy
  activityManager: "0x..."       // Copy dari deploy
};
```

**Tahap 6: Test & Interact**
```
1. Buka http://localhost:8000
2. Connect MetaMask
3. Pilih akun owner untuk test admin
4. Create activity → reward student → mint certificate
```

---

## SLIDE 16: USER FLOW DIAGRAM
**Mahasiswa (Regular User)**

```
START
  ↓
[1] Buka Website
  ↓
[2] Install MetaMask (jika belum)
  ↓
[3] Klik "Connect Wallet"
  ↓
[4] Approve connection di MetaMask
  ↓
[5] Dashboard loaded dengan:
    - Saldo CPNT
    - Jumlah NFT sertifikat
    - Aktivitas terbaru
  ↓
[6] Browse Kegiatan
  ↓
[7] Ikut Kegiatan (manual registration)
  ↓
[8] Tunggu Admin reward poin
  ↓
[9] Saldo CPNT bertambah (visible di Dashboard)
  ↓
[10] Klaim Sertifikat NFT (jika template tersedia)
  ↓
[11] NFT muncul di Koleksi Sertifikat
  ↓
[12] Share/Export sertifikat
  ↓
END
```

**Admin (Owner)**

```
START
  ↓
[1] Connect Wallet (owner account)
  ↓
[2] Akses Admin Panel
  ↓
[3a] Buat Kegiatan Baru
  ├─→ Inputkan: Nama, Poin
  ├─→ Click "Buat Kegiatan"
  └─→ Event ActivityCreated
  ↓
[3b] Reward Mahasiswa
  ├─→ Input: Activity ID, Alamat Mahasiswa
  ├─→ Click "Kirim Poin"
  └─→ CPNT di-mint ke mahasiswa
  ↓
[3c] Terbitkan Sertifikat
  ├─→ Input: Activity ID, Alamat, IPFS URI
  ├─→ Click "Preview" → lihat sertifikat
  ├─→ Click "Terbitkan"
  └─→ NFT di-mint ke mahasiswa
  ↓
[4] Monitor & Verify
  ├─→ Check dashboard untuk stats
  └─→ Verify di blockchain explorer
  ↓
END
```

---

## SLIDE 17: KEAMANAN & BEST PRACTICES
**Security Considerations**

**Smart Contract Security:**
- ✅ `onlyOwner` modifier untuk admin functions
- ✅ Zero address checks sebelum transfer
- ✅ Overflow protection (Solidity 0.8.20)
- ✅ Re-entrancy safe (no external calls)
- ⚠️ TODO: Audit by professional (production)

**Frontend Security:**
- ✅ Never store private keys di client
- ✅ MetaMask handles signing
- ✅ Validate input sebelum submit
- ✅ HTTPS untuk production
- ⚠️ TODO: Add rate limiting

**Access Control:**
- ✅ Owner-based access untuk critical functions
- ⚠️ TODO: Multi-sig wallet recommended
- ⚠️ TODO: Timelock contract untuk updates

**Best Practices:**
1. Always verify contract addresses
2. Test di testnet sebelum mainnet
3. Implement event monitoring
4. Regular backup of metadata (IPFS)
5. Document all transactions

---

## SLIDE 18: TESTING & VERIFICATION
**Quality Assurance**

**Manual Testing Checklist:**

**Smart Contract:**
- [ ] Deploy contracts sukses
- [ ] Mint token bekerja
- [ ] Transfer antar wallet bekerja
- [ ] Only owner functions terbuka hanya untuk owner
- [ ] Events emitted correctly
- [ ] balanceOf returns correct value
- [ ] transferFrom dengan allowance works

**Frontend:**
- [ ] Connect wallet berhasil
- [ ] Disconnect wallet works
- [ ] Switch account detected
- [ ] Dashboard loads data correctly
- [ ] Create activity works (owner only)
- [ ] Reward student works
- [ ] Mint certificate works
- [ ] Claim certificate works (user)
- [ ] Responsive di mobile

**Integration:**
- [ ] End-to-end: activity → reward → certificate
- [ ] Data sync between contract and UI
- [ ] Error handling & user feedback
- [ ] Toast notifications work
- [ ] Modal dialogs work

**Performance:**
- [ ] Page load time < 3s
- [ ] Transaction wait time visible
- [ ] UI responsive saat awaiting transaction
- [ ] No memory leaks

---

## SLIDE 19: CHALLENGES & SOLUTIONS
**Problematika & Cara Mengatasi**

| Challenge | Root Cause | Solution |
|-----------|-----------|----------|
| Transaction slow | Network congestion | Increase gas price, use testnet |
| User confused about wallet | First-time Web3 user | Add tutorial, tooltips |
| Contract address wrong | Copy-paste typo | Double-check, use QR code |
| IPFS URI not found | Upload failed | Re-upload metadata to IPFS |
| MetaMask network wrong | Wrong network selected | Add network switching guide |
| Insufficient gas | Low gas limit set | Calculate correct gas, add buffer |
| Contract already deployed? | Code unchanged | Redeploy or verify address |
| Permission denied on function | Not owner | Use owner account |

---

## SLIDE 20: FUTURE ENHANCEMENTS
**Roadmap & Scalability**

**Phase 2 Improvements:**
1. **User Experience**
   - [ ] Add user profile page
   - [ ] Implement activity leaderboard
   - [ ] Social sharing certificate
   - [ ] Dark/Light mode toggle

2. **Smart Contract**
   - [ ] Batch operations (reward multiple students)
   - [ ] Burn functionality untuk revoke points
   - [ ] Multi-sig owner management
   - [ ] Pause/unpause mechanism

3. **Infrastructure**
   - [ ] Migrate to Layer 2 (Polygon, Arbitrum)
   - [ ] Implement subgraph (The Graph) untuk indexing
   - [ ] Database cache untuk queries
   - [ ] Email notifications

4. **Features**
   - [ ] Governance token (DAO)
   - [ ] Marketplace untuk jual-beli sertifikat
   - [ ] API untuk integrasi dengan sistem akademik
   - [ ] Mobile app (React Native)

5. **Analytics**
   - [ ] Dashboard statistik real-time
   - [ ] Activity heatmap
   - [ ] Student achievement ranking
   - [ ] Export reports

---

## SLIDE 21: DOKUMENTASI & RESOURCES
**Reference Materials**

**Dokumentasi Resmi:**
- Ethereum: https://ethereum.org/developers
- Solidity: https://docs.soliditylang.org
- ethers.js: https://docs.ethers.io/v5/
- MetaMask: https://docs.metamask.io

**Tutorial:**
- OpenZeppelin Contracts: https://docs.openzeppelin.com/
- CryptoZombies (Learn Solidity): https://cryptozombies.io
- Ethereum Development Docs: https://ethereum.org/en/developers/docs/

**Tools:**
- Remix IDE: https://remix.ethereum.org
- Ganache: https://www.trufflesuite.com/ganache
- MetaMask: https://metamask.io

**Repositories:**
- This Project: https://github.com/Mhoseaaa/campuspointweb3
- OpenZeppelin ERC Standards: https://github.com/OpenZeppelin/openzeppelin-contracts

---

## SLIDE 22: Q&A & CONTACT
**Questions & Discussion**

**Key Takeaways:**
✅ Campus Point mendemonstrasikan integrasi ERC20 + ERC721
✅ Smart contracts mengelola poin & sertifikat secara transparansi
✅ Frontend Web3App memudahkan user interaction
✅ Blockchain technology ensures immutability & security
✅ Scalable solution untuk reward system akademik

**Untuk Pertanyaan:**
- Tentang Smart Contract architecture
- Frontend integration & Web3 concepts
- Deployment & testing procedures
- Future improvements & scaling

**Thank You!** 🙏

---

## SLIDE 23: DEMO (OPTIONAL)
**Live Demo Walkthrough**

**Demo Scenario:**

**Aksi 1: Admin Setup**
```
1. Login sebagai Admin (owner account)
2. Go to Admin Panel
3. Create Activity: "Webinar Blockchain" dengan 50 CPNT reward
4. Lihat event ActivityCreated di console
```

**Aksi 2: Reward Student**
```
1. Input alamat student (copy dari MetaMask)
2. Click "Kirim Poin"
3. Approve transaction di MetaMask
4. Tunggu mined
5. Check student balance di Dashboard
```

**Aksi 3: Mint Certificate**
```
1. Set IPFS URI untuk sertifikat (template)
2. Input student address
3. Click "Preview" → lihat metadata
4. Click "Terbitkan Sertifikat"
5. Approve transaction
6. NFT muncul di student's Certificates page
```

**Aksi 4: Student View**
```
1. Disconnect admin, connect sebagai student
2. Go to Dashboard → lihat CPNT balance updated
3. Go to Certificates → lihat NFT baru
4. Click NFT → lihat detail & metadata
```

**Result:** End-to-end flow berhasil! 🎉

---

# BONUS: CATATAN UNTUK PRESENTER

## Tips Presentasi:

1. **Opening (1 menit)**
   - Mulai dengan pertanyaan: "Pernah dengar tentang blockchain di kampus?"
   - Introduce problem: Sertifikat mudah dipalsukan

2. **Problem & Solution (3 menit)**
   - Jelaskan masalah sertifikat tradisional
   - Tawarkan solusi blockchain: immutable, verifiable, decentralized

3. **Architecture Deep Dive (5 menit)**
   - Gambar: Frontend → MetaMask → Blockchain → Smart Contracts
   - Jelaskan masing-masing komponen
   - Highlight: ERC20 vs ERC721

4. **Live Demo (7 menit)**
   - Setup di browser (sudah deployed)
   - Walk through user scenario
   - Show transaction di blockchain explorer (Etherscan)

5. **Q&A (4 menit)**
   - Siap jawab pertanyaan teknis
   - Arahkan diskusi ke future work

**Total: ~20 menit**

## Slide Layout Recommendation:

- **Title Slide**: Full screen impact
- **Content Slides**: Max 5 bullet points, 1 diagram per slide
- **Code Slides**: Use monospace font, syntax highlighting
- **Diagram Slides**: Keep simple, use consistent colors (green = success, red = error)
- **Q&A Slide**: Contact info, thank you message

## Visual Elements Suggestion:

- Use blockchain-themed graphics (chains, nodes, blocks)
- Include transaction flow diagrams
- Show smart contract call stacks
- Highlight security features
- Use consistent color scheme (dark theme aligns with project)

---

**END OF PRESENTATION CONTENT**

Catatan: Konten ini siap untuk dikonversi ke PowerPoint, Google Slides, atau presentation tool apapun.

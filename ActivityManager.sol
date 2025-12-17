// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICampusPoint {
    function mint(address to, uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
}

interface IActivityCertificate {
    function mintCertificate(address to, string memory uri) external returns (uint256);
}

contract ActivityManager {
    struct Activity {
        uint256 id;
        string  name;
        uint256 pointReward;
        bool    isActive;
        string  certUri;  // Template URI sertifikat (diset admin)
    }

    address public owner;
    ICampusPoint public campusPoint;
    IActivityCertificate public activityCert;

    uint256 public nextActivityId = 1;
    mapping(uint256 => Activity) public activities;
    
    // Tracking: mahasiswa mana yang sudah dapat reward untuk activity mana
    mapping(uint256 => mapping(address => bool)) public hasRewarded;
    // Tracking: mahasiswa mana yang sudah klaim sertifikat untuk activity mana
    mapping(uint256 => mapping(address => bool)) public hasClaimed;
    // Tracking: mahasiswa mana yang sudah request sertifikat
    mapping(uint256 => mapping(address => bool)) public hasRequested;
    // Array untuk menyimpan daftar requester per activity
    mapping(uint256 => address[]) private _requesters;

    event ActivityCreated(uint256 indexed id, string name, uint256 pointReward);
    event StudentRewarded(uint256 indexed activityId, address indexed student, uint256 pointReward);
    event CertificateMinted(uint256 indexed activityId, address indexed student, uint256 tokenId, string uri);
    event CertUriSet(uint256 indexed activityId, string uri);
    event CertificateClaimed(uint256 indexed activityId, address indexed student, uint256 tokenId);
    event CertificateRequested(uint256 indexed activityId, address indexed student);
    event CertificateApproved(uint256 indexed activityId, address indexed student, uint256 tokenId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not contract owner");
        _;
    }

    constructor(address campusPointAddress, address activityCertAddress) {
        owner = msg.sender;
        campusPoint = ICampusPoint(campusPointAddress);
        activityCert = IActivityCertificate(activityCertAddress);
    }

    function createActivity(string calldata name, uint256 pointReward) external onlyOwner {
        uint256 activityId = nextActivityId;
        nextActivityId += 1;

        activities[activityId] = Activity({
            id: activityId,
            name: name,
            pointReward: pointReward,
            isActive: true,
            certUri: ""
        });

        emit ActivityCreated(activityId, name, pointReward);
    }

    // Admin set template URI sertifikat untuk kegiatan
    function setActivityCertUri(uint256 activityId, string calldata uri) external onlyOwner {
        require(activities[activityId].id != 0, "Activity not found");
        activities[activityId].certUri = uri;
        emit CertUriSet(activityId, uri);
    }

    function setActivityActive(uint256 activityId, bool active) external onlyOwner {
        require(activities[activityId].id != 0, "Activity not found");
        activities[activityId].isActive = active;
    }

    function getActivity(uint256 activityId)
        external
        view
        returns (uint256 id, string memory name, uint256 pointReward, bool isActive, string memory certUri)
    {
        Activity memory a = activities[activityId];
        return (a.id, a.name, a.pointReward, a.isActive, a.certUri);
    }

    // Cek apakah mahasiswa eligible untuk klaim sertifikat
    function canClaimCertificate(uint256 activityId, address student) external view returns (bool) {
        return hasRewarded[activityId][student] && !hasClaimed[activityId][student];
    }

    // Berikan poin ke mahasiswa untuk suatu kegiatan
    function rewardStudent(uint256 activityId, address student) external onlyOwner {
        Activity memory a = activities[activityId];
        require(a.id != 0, "Activity not found");
        require(a.isActive, "Activity not active");
        require(student != address(0), "Invalid student address");
        require(!hasRewarded[activityId][student], "Student already rewarded");

        hasRewarded[activityId][student] = true;
        campusPoint.mint(student, a.pointReward);
        emit StudentRewarded(activityId, student, a.pointReward);
    }

    // Mahasiswa klaim sertifikat sendiri (jika sudah dapat reward)
    function claimCertificate(uint256 activityId) external {
        Activity memory a = activities[activityId];
        require(a.id != 0, "Activity not found");
        require(bytes(a.certUri).length > 0, "Certificate template not set");
        require(hasRewarded[activityId][msg.sender], "Not eligible - no reward received");
        require(!hasClaimed[activityId][msg.sender], "Already claimed");

        hasClaimed[activityId][msg.sender] = true;
        uint256 tokenId = activityCert.mintCertificate(msg.sender, a.certUri);
        emit CertificateClaimed(activityId, msg.sender, tokenId);
    }

    // Mint sertifikat NFT untuk mahasiswa (admin direct mint - tetap dipertahankan)
    function mintCertificate(uint256 activityId, address student, string calldata uri) external onlyOwner {
        Activity memory a = activities[activityId];
        require(a.id != 0, "Activity not found");
        require(student != address(0), "Invalid student address");

        hasClaimed[activityId][student] = true;  // Mark as claimed
        uint256 tokenId = activityCert.mintCertificate(student, uri);
        emit CertificateMinted(activityId, student, tokenId, uri);
    }

    // ===== NEW: Certificate Request & Approval System =====

    // Mahasiswa request sertifikat untuk kegiatan
    function requestCertificate(uint256 activityId) external {
        Activity memory a = activities[activityId];
        require(a.id != 0, "Activity not found");
        require(a.isActive, "Activity not active");
        require(!hasRequested[activityId][msg.sender], "Already requested");
        require(!hasClaimed[activityId][msg.sender], "Already has certificate");

        hasRequested[activityId][msg.sender] = true;
        _requesters[activityId].push(msg.sender);

        emit CertificateRequested(activityId, msg.sender);
    }

    // Get daftar pending requests untuk admin (returns array of addresses)
    function getPendingRequests(uint256 activityId) external view returns (address[] memory) {
        address[] memory allRequesters = _requesters[activityId];
        
        // Count pending (requested but not claimed)
        uint256 pendingCount = 0;
        for (uint256 i = 0; i < allRequesters.length; i++) {
            if (hasRequested[activityId][allRequesters[i]] && !hasClaimed[activityId][allRequesters[i]]) {
                pendingCount++;
            }
        }
        
        // Build pending array
        address[] memory pending = new address[](pendingCount);
        uint256 index = 0;
        for (uint256 i = 0; i < allRequesters.length; i++) {
            if (hasRequested[activityId][allRequesters[i]] && !hasClaimed[activityId][allRequesters[i]]) {
                pending[index] = allRequesters[i];
                index++;
            }
        }
        
        return pending;
    }

    // Get total pending request count untuk activity
    function getPendingRequestCount(uint256 activityId) external view returns (uint256) {
        address[] memory allRequesters = _requesters[activityId];
        uint256 count = 0;
        for (uint256 i = 0; i < allRequesters.length; i++) {
            if (hasRequested[activityId][allRequesters[i]] && !hasClaimed[activityId][allRequesters[i]]) {
                count++;
            }
        }
        return count;
    }

    // Admin approve request dan mint sertifikat
    function approveCertificateRequest(uint256 activityId, address student) external onlyOwner {
        Activity memory a = activities[activityId];
        require(a.id != 0, "Activity not found");
        require(bytes(a.certUri).length > 0, "Certificate template not set");
        require(hasRequested[activityId][student], "Student has not requested");
        require(!hasClaimed[activityId][student], "Already has certificate");

        hasClaimed[activityId][student] = true;
        uint256 tokenId = activityCert.mintCertificate(student, a.certUri);
        
        emit CertificateApproved(activityId, student, tokenId);
    }
}

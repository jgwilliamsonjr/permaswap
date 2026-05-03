// Permaswap Demo - Fixed Version
// Fixes: Swap persistence when switching users, currency symbol, selection tracking

// ============================================================
// DATA MODEL
// ============================================================

const GAME_DATABASE = {
    // Alice's rare games
    'ror_2006': { id: 'ror_2006', title: 'Rule of Rose', genre: 'Horror', year: 2006, value_cents: 30000, rarity: 98, delisted: true, image: '🔥' },
    'kuon_2004': { id: 'kuon_2004', title: 'Kuon', genre: 'Horror', year: 2004, value_cents: 60000, rarity: 99, delisted: true, image: '🔥' },
    'sh2_2001': { id: 'sh2_2001', title: 'Silent Hill 2', genre: 'Horror', year: 2001, value_cents: 15000, rarity: 85, delisted: true, image: '⭐' },
    'pt_2014': { id: 'pt_2014', title: 'P.T. (Demo)', genre: 'Horror', year: 2014, value_cents: 50000, rarity: 100, delisted: true, image: '💀' },
    // Bob's common games
    'fifa23_2022': { id: 'fifa23_2022', title: 'FIFA 23', genre: 'Sports', year: 2022, value_cents: 2000, rarity: 5, delisted: false, image: '⚽' },
    'cod_2022': { id: 'cod_2022', title: 'Call of Duty: MW2', genre: 'FPS', year: 2022, value_cents: 3000, rarity: 10, delisted: false, image: '🔫' },
    'elden_2022': { id: 'elden_2022', title: 'Elden Ring', genre: 'RPG', year: 2022, value_cents: 4000, rarity: 20, delisted: false, image: '🗡️' },
    'madden_2023': { id: 'madden_2023', title: 'Madden NFL 23', genre: 'Sports', year: 2023, value_cents: 1500, rarity: 3, delisted: false, image: '🏈' }
};

// User libraries with cryptographic signatures (simulated)
let libraries = {
    alice: {
        user_id: 'alice',
        username: 'AliceCollector',
        privacy: 'view_only',
        titles: ['ror_2006', 'kuon_2004', 'sh2_2001', 'pt_2014'],
        signatures: {}
    },
    bob: {
        user_id: 'bob',
        username: 'BobGamer',
        privacy: 'public',
        titles: ['fifa23_2022', 'cod_2022', 'elden_2022', 'madden_2023'],
        signatures: {}
    }
};

// Swap history
let swapHistory = [];
let currentUser = 'alice';

// NEW: Persistent swap state that survives user switching
let activeSwap = {
    active: false,
    from_user: null,      // Who is initiating the swap
    offeredTitles: [],    // Games they are giving away
    requestedTitles: []   // Games they want to receive
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getOtherUser() {
    return currentUser === 'alice' ? 'bob' : 'alice';
}

function getUserLibrary(userId, viewerId) {
    const lib = libraries[userId];
    if (!lib) return null;
    
    if (viewerId !== userId && lib.privacy === 'private') return null;
    return lib;
}

function getMyLibrary() {
    return libraries[currentUser];
}

function getBrowseLibrary() {
    const other = getOtherUser();
    return getUserLibrary(other, currentUser);
}

function calculateLibraryValue(userId) {
    const lib = libraries[userId];
    if (!lib) return 0;
    return lib.titles.reduce((sum, gameId) => sum + GAME_DATABASE[gameId].value_cents, 0);
}

function formatPrice(cents) {
    return `€${(cents / 100).toFixed(2)}`;
}

function getRarityClass(rarity) {
    if (rarity >= 90) return 'rarity-high';
    if (rarity >= 70) return 'rarity-medium';
    return 'rarity-low';
}

function generateSignature(userId, gameId, timestamp) {
    const str = `${userId}:${gameId}:${timestamp}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return `0x${Math.abs(hash).toString(16)}`;
}

// ============================================================
// SWAP STATE MANAGEMENT (FIXED)
// ============================================================

function isGameSelected(gameId, type) {
    if (!activeSwap.active) return false;
    if (type === 'offer') {
        return activeSwap.offeredTitles.includes(gameId);
    } else if (type === 'request') {
        return activeSwap.requestedTitles.includes(gameId);
    }
    return false;
}

function toggleSelection(gameId, source) {
    // source: 'my' (offering from my library) or 'browse' (requesting from other library)
    
    if (!activeSwap.active) {
        // Start a new swap
        activeSwap.active = true;
        activeSwap.from_user = currentUser;
        activeSwap.offeredTitles = [];
        activeSwap.requestedTitles = [];
        
        if (source === 'my') {
            activeSwap.offeredTitles.push(gameId);
        } else if (source === 'browse') {
            activeSwap.requestedTitles.push(gameId);
        }
    } else {
        // Existing swap - check if we're still the initiator
        if (activeSwap.from_user !== currentUser) {
            // Different user is trying to modify - create new swap
            activeSwap.active = true;
            activeSwap.from_user = currentUser;
            activeSwap.offeredTitles = [];
            activeSwap.requestedTitles = [];
            
            if (source === 'my') {
                activeSwap.offeredTitles.push(gameId);
            } else if (source === 'browse') {
                activeSwap.requestedTitles.push(gameId);
            }
        } else {
            // Same user - toggle normally
            if (source === 'my') {
                if (activeSwap.offeredTitles.includes(gameId)) {
                    activeSwap.offeredTitles = activeSwap.offeredTitles.filter(id => id !== gameId);
                } else {
                    activeSwap.offeredTitles.push(gameId);
                }
            } else if (source === 'browse') {
                if (activeSwap.requestedTitles.includes(gameId)) {
                    activeSwap.requestedTitles = activeSwap.requestedTitles.filter(id => id !== gameId);
                } else {
                    activeSwap.requestedTitles.push(gameId);
                }
            }
        }
    }
    
    // If both arrays empty, deactivate swap
    if (activeSwap.offeredTitles.length === 0 && activeSwap.requestedTitles.length === 0) {
        activeSwap.active = false;
        activeSwap.from_user = null;
    }
    
    // Re-render everything
    renderLibrary();
    renderBrowseLibrary();
    updateSwapPanel();
}

function clearSwap() {
    activeSwap.active = false;
    activeSwap.from_user = null;
    activeSwap.offeredTitles = [];
    activeSwap.requestedTitles = [];
    updateSwapPanel();
    renderLibrary();
    renderBrowseLibrary();
}

function executeSwap() {
    if (!activeSwap.active) {
        alert('No swap in progress. Select games to swap first.');
        return;
    }
    
    if (activeSwap.offeredTitles.length === 0) {
        alert('Please select at least one game from YOUR library to offer.');
        return;
    }
    
    if (activeSwap.requestedTitles.length === 0) {
        alert('Please select at least one game from the OTHER user\'s library to request.');
        return;
    }
    
    const myLib = libraries[currentUser];
    const otherLib = libraries[getOtherUser()];
    const timestamp = Date.now();
    
    // Verify we still own the offered titles
    for (const gameId of activeSwap.offeredTitles) {
        if (!myLib.titles.includes(gameId)) {
            alert(`You no longer own ${GAME_DATABASE[gameId].title}. Swap cancelled.`);
            clearSwap();
            return;
        }
    }
    
    // Verify other user still owns the requested titles
    for (const gameId of activeSwap.requestedTitles) {
        if (!otherLib.titles.includes(gameId)) {
            alert(`${GAME_DATABASE[gameId].title} is no longer available from the other user.`);
            clearSwap();
            return;
        }
    }
    
    // Remove offered titles from my library
    activeSwap.offeredTitles.forEach(gameId => {
        const index = myLib.titles.indexOf(gameId);
        if (index !== -1) myLib.titles.splice(index, 1);
    });
    
    // Remove requested titles from other library
    activeSwap.requestedTitles.forEach(gameId => {
        const index = otherLib.titles.indexOf(gameId);
        if (index !== -1) otherLib.titles.splice(index, 1);
    });
    
    // Add requested titles to my library
    activeSwap.requestedTitles.forEach(gameId => {
        myLib.titles.push(gameId);
        myLib.signatures[gameId] = generateSignature(currentUser, gameId, timestamp);
    });
    
    // Add offered titles to other library
    activeSwap.offeredTitles.forEach(gameId => {
        otherLib.titles.push(gameId);
        otherLib.signatures[gameId] = generateSignature(getOtherUser(), gameId, timestamp);
    });
    
    // Record swap in history
    const swapRecord = {
        id: `swap_${timestamp}`,
        date: new Date().toLocaleString(),
        user: currentUser === 'alice' ? 'AliceCollector' : 'BobGamer',
        gave: activeSwap.offeredTitles.map(id => GAME_DATABASE[id].title).join(', '),
        received: activeSwap.requestedTitles.map(id => GAME_DATABASE[id].title).join(', '),
        value_gave: activeSwap.offeredTitles.reduce((s, id) => s + GAME_DATABASE[id].value_cents, 0),
        value_received: activeSwap.requestedTitles.reduce((s, id) => s + GAME_DATABASE[id].value_cents, 0)
    };
    swapHistory.unshift(swapRecord);
    
    // Clear the swap
    clearSwap();
    
    // Re-render everything
    renderLibrary();
    renderBrowseLibrary();
    renderSwapHistory();
    
    // Show success message temporarily
    const panel = document.getElementById('swap-panel');
    if (panel) {
        const originalHTML = panel.innerHTML;
        panel.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 3rem;">✅</div>
                <h3>SWAP COMPLETE!</h3>
                <p>Cryptographic binding transferred. Your library has been updated.</p>
                <button onclick="location.reload()" class="btn-primary" style="margin-top: 10px;">Continue Trading</button>
            </div>
        `;
        setTimeout(() => {
            if (panel) panel.innerHTML = originalHTML;
            updateSwapPanel();
        }, 3000);
    }
}

// ============================================================
// RENDER FUNCTIONS
// ============================================================

function renderLibrary() {
    const myLib = getMyLibrary();
    const myContainer = document.getElementById('my-library');
    const myValue = calculateLibraryValue(currentUser);
    
    const valueElement = document.getElementById('my-library-value');
    if (valueElement) valueElement.textContent = formatPrice(myValue);
    
    if (!myLib || myLib.titles.length === 0) {
        if (myContainer) myContainer.innerHTML = '<div class="empty-history">Your library is empty</div>';
        return;
    }
    
    myContainer.innerHTML = myLib.titles.map(gameId => {
        const game = GAME_DATABASE[gameId];
        const rarityClass = getRarityClass(game.rarity);
        const delistedBadge = game.delisted ? '<span class="delisted-badge">DELISTED</span>' : '';
        const isSelected = isGameSelected(gameId, 'offer');
        
        return `
            <div class="game-card ${isSelected ? 'selected' : ''}" data-game-id="${gameId}" data-source="my">
                <div class="game-info">
                    <h4>${game.image} ${game.title} ${delistedBadge}</h4>
                    <p>${game.genre} | ${game.year}</p>
                </div>
                <div class="game-meta">
                    <span class="rarity ${rarityClass}">Rarity ${game.rarity}</span>
                    <div class="price">${formatPrice(game.value_cents)}</div>
                </div>
            </div>
        `;
    }).join('');
    
    // Attach click handlers for my library
    document.querySelectorAll('#my-library .game-card').forEach(card => {
        card.addEventListener('click', (e) => {
            e.stopPropagation();
            const gameId = card.dataset.gameId;
            const source = card.dataset.source;
            if (gameId && source) toggleSelection(gameId, source);
        });
    });
}

function renderBrowseLibrary() {
    const browseLib = getBrowseLibrary();
    const browseContainer = document.getElementById('browse-library');
    
    if (!browseLib) {
        if (browseContainer) {
            browseContainer.innerHTML = '<div class="empty-history">This library is private. User has set privacy to "private".</div>';
        }
        const valueElement = document.getElementById('browse-library-value');
        if (valueElement) valueElement.textContent = formatPrice(0);
        return;
    }
    
    let games = browseLib.titles.map(gameId => GAME_DATABASE[gameId]);
    
    // Apply filters
    const searchTerm = document.getElementById('filter-search')?.value.toLowerCase() || '';
    const genre = document.getElementById('filter-genre')?.value || 'all';
    const sortBy = document.getElementById('filter-sort')?.value || 'rarity_desc';
    
    if (searchTerm) {
        games = games.filter(g => g.title.toLowerCase().includes(searchTerm));
    }
    if (genre !== 'all') {
        games = games.filter(g => g.genre === genre);
    }
    
    switch(sortBy) {
        case 'rarity_desc':
            games.sort((a,b) => b.rarity - a.rarity);
            break;
        case 'price_desc':
            games.sort((a,b) => b.value_cents - a.value_cents);
            break;
        case 'price_asc':
            games.sort((a,b) => a.value_cents - b.value_cents);
            break;
        case 'year_desc':
            games.sort((a,b) => b.year - a.year);
            break;
    }
    
    const totalValue = games.reduce((sum, g) => sum + g.value_cents, 0);
    const valueElement = document.getElementById('browse-library-value');
    if (valueElement) valueElement.textContent = formatPrice(totalValue);
    
    if (games.length === 0) {
        if (browseContainer) browseContainer.innerHTML = '<div class="empty-history">No games match your filters</div>';
        return;
    }
    
    browseContainer.innerHTML = games.map(game => {
        const rarityClass = getRarityClass(game.rarity);
        const delistedBadge = game.delisted ? '<span class="delisted-badge">DELISTED</span>' : '';
        const isSelected = isGameSelected(game.id, 'request');
        
        return `
            <div class="game-card selectable ${isSelected ? 'selected' : ''}" data-game-id="${game.id}" data-source="browse">
                <div class="game-info">
                    <h4>${game.image} ${game.title} ${delistedBadge}</h4>
                    <p>${game.genre} | ${game.year}</p>
                </div>
                <div class="game-meta">
                    <span class="rarity ${rarityClass}">Rarity ${game.rarity}</span>
                    <div class="price">${formatPrice(game.value_cents)}</div>
                </div>
            </div>
        `;
    }).join('');
    
    // Attach click handlers for browse library
    document.querySelectorAll('#browse-library .game-card.selectable').forEach(card => {
        card.addEventListener('click', (e) => {
            e.stopPropagation();
            const gameId = card.dataset.gameId;
            const source = card.dataset.source;
            if (gameId && source) toggleSelection(gameId, source);
        });
    });
}

function updateSwapPanel() {
    const panel = document.getElementById('swap-panel');
    const details = document.getElementById('swap-details');
    
    if (!activeSwap.active || (activeSwap.offeredTitles.length === 0 && activeSwap.requestedTitles.length === 0)) {
        if (panel) panel.classList.add('hidden');
        return;
    }
    
    if (panel) panel.classList.remove('hidden');
    
    const offeredGames = activeSwap.offeredTitles.map(id => GAME_DATABASE[id]);
    const requestedGames = activeSwap.requestedTitles.map(id => GAME_DATABASE[id]);
    const offeredValue = offeredGames.reduce((s,g) => s + g.value_cents, 0);
    const requestedValue = requestedGames.reduce((s,g) => s + g.value_cents, 0);
    
    if (details) {
        details.innerHTML = `
            <div style="margin-bottom: 10px;">
                <strong>📤 You offer:</strong><br>
                ${offeredGames.length ? offeredGames.map(g => `${g.image} ${g.title} (${formatPrice(g.value_cents)})`).join('<br>') : '— none selected —'}
                <div style="margin-top: 5px; color: #00d4ff;">Total: ${formatPrice(offeredValue)}</div>
            </div>
            <div>
                <strong>📥 You request:</strong><br>
                ${requestedGames.length ? requestedGames.map(g => `${g.image} ${g.title} (${formatPrice(g.value_cents)})`).join('<br>') : '— none selected —'}
                <div style="margin-top: 5px; color: #00d4ff;">Total: ${formatPrice(requestedValue)}</div>
            </div>
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #3a3f6f;">
                ${Math.abs(offeredValue - requestedValue) > 0 ? `<span style="color: #ffaa44;">⚠️ Value difference: ${formatPrice(Math.abs(offeredValue - requestedValue))}. This is allowed — trades don't need to be equal.</span>` : '✓ Values match perfectly'}
            </div>
        `;
    }
}

function renderSwapHistory() {
    const container = document.getElementById('swap-history');
    if (!container) return;
    
    if (swapHistory.length === 0) {
        container.innerHTML = '<div class="empty-history">No swaps yet. Browse and select games to start trading!</div>';
        return;
    }
    
    container.innerHTML = swapHistory.map(swap => `
        <div class="history-item">
            <div>
                <strong>${swap.user}</strong><br>
                Gave: ${swap.gave}<br>
                Received: ${swap.received}
            </div>
            <div class="history-date">
                ${swap.date}<br>
                ${formatPrice(swap.value_gave)} → ${formatPrice(swap.value_received)}
            </div>
        </div>
    `).join('');
}

function clearHistory() {
    swapHistory = [];
    renderSwapHistory();
}

function switchUser(userId) {
    currentUser = userId;
    
    // Update UI buttons
    document.querySelectorAll('.user-btn').forEach(btn => {
        if (btn.dataset.user === userId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // IMPORTANT: Keep the active swap state when switching users
    // The swap is attached to the initiator, not the current viewer
    // We just re-render to show the correct perspective
    
    // Update privacy select value
    const privacySelect = document.getElementById('privacy-select');
    if (privacySelect) {
        privacySelect.value = libraries[currentUser].privacy;
    }
    
    // Re-render everything
    renderLibrary();
    renderBrowseLibrary();
    updateSwapPanel();
}

function changePrivacy() {
    const select = document.getElementById('privacy-select');
    const lib = libraries[currentUser];
    if (lib && select) {
        lib.privacy = select.value;
        renderBrowseLibrary();
    }
}

// ============================================================
// INITIALIZATION
// ============================================================

function init() {
    // Generate initial signatures
    const initTimestamp = Date.now();
    for (const userId in libraries) {
        for (const gameId of libraries[userId].titles) {
            libraries[userId].signatures[gameId] = generateSignature(userId, gameId, initTimestamp);
        }
    }
    
    // Render everything
    renderLibrary();
    renderBrowseLibrary();
    renderSwapHistory();
    updateSwapPanel();
    
    // Set up event listeners
    const btnAlice = document.getElementById('btn-alice');
    const btnBob = document.getElementById('btn-bob');
    const confirmBtn = document.getElementById('confirm-swap');
    const cancelBtn = document.getElementById('cancel-swap');
    const closeBtn = document.getElementById('close-swap');
    const clearHistoryBtn = document.getElementById('clear-history');
    const privacySelect = document.getElementById('privacy-select');
    const filterSearch = document.getElementById('filter-search');
    const filterGenre = document.getElementById('filter-genre');
    const filterSort = document.getElementById('filter-sort');
    
    if (btnAlice) btnAlice.addEventListener('click', () => switchUser('alice'));
    if (btnBob) btnBob.addEventListener('click', () => switchUser('bob'));
    if (confirmBtn) confirmBtn.addEventListener('click', executeSwap);
    if (cancelBtn) cancelBtn.addEventListener('click', clearSwap);
    if (closeBtn) closeBtn.addEventListener('click', clearSwap);
    if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', clearHistory);
    if (privacySelect) privacySelect.addEventListener('change', changePrivacy);
    if (filterSearch) filterSearch.addEventListener('input', () => renderBrowseLibrary());
    if (filterGenre) filterGenre.addEventListener('change', () => renderBrowseLibrary());
    if (filterSort) filterSort.addEventListener('change', () => renderBrowseLibrary());
    
    // Set initial privacy value
    if (privacySelect) privacySelect.value = libraries[currentUser].privacy;
}

// Start the app
init();

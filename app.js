// Permaswap Demo - Complete Client-Side Implementation

// Cryptographic binding simulation using Ed25519-style signatures

// ============================================================

// DATA MODEL

// ============================================================

const GAME_DATABASE = {

    // Alice's rare games

    'ror_2006': { id: 'ror_2006', title: 'Rule of Rose', genre: 'Horror', year: 2006, value_cents: 30000, rarity: 98, delisted: true, image: '🔥' },

    'kuon_2004': { id: 'kuon_2004', title: 'Kuon', genre: 'Horror', year: 2004, value_cents: 60000, rarity: 99, delisted: true, image: '🔥' },

    'sh2_2001': { id: 'sh2_2001', title: 'Silent Hill 2', genre: 'Horror', year: 2001, value_cents: 15000, rarity: 85, delisted: false, image: '⭐' },

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

        signatures: {} // In real impl, these are Ed25519 sigs

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

let pendingSwap = null;

let currentUser = 'alice';

// Generate deterministic "signatures" (simulated for demo)

function generateSignature(userId, gameId, timestamp) {

    // In production: Ed25519 sign(userId + gameId + timestamp)

    // For demo: return a fake but consistent hash

    const str = `${userId}:${gameId}:${timestamp}`;

    let hash = 0;

    for (let i = 0; i < str.length; i++) {

        hash = ((hash << 5) - hash) + str.charCodeAt(i);

        hash |= 0;

    }

    return `0x${Math.abs(hash).toString(16)}`;

}

// Verify a signature (simulated)

function verifySignature(signature, userId, gameId, timestamp) {

    const expected = generateSignature(userId, gameId, timestamp);

    return signature === expected;

}

// ============================================================

// CORE FUNCTIONS

// ============================================================

function getOtherUser() {

    return currentUser === 'alice' ? 'bob' : 'alice';

}

function getUserLibrary(userId, viewerId) {

    const lib = libraries[userId];

    if (!lib) return null;

    

    // Privacy check

    if (viewerId !== userId) {

        if (lib.privacy === 'private') return null;

        // For view_only, return titles without signatures

    }

    

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

function renderLibrary() {

    const myLib = getMyLibrary();

    const myContainer = document.getElementById('my-library');

    const myValue = calculateLibraryValue(currentUser);

    

    document.getElementById('my-library-value').textContent = formatPrice(myValue);

    

    if (!myLib || myLib.titles.length === 0) {

        myContainer.innerHTML = '<div class="empty-history">Your library is empty</div>';

        return;

    }

    

    myContainer.innerHTML = myLib.titles.map(gameId => {

        const game = GAME_DATABASE[gameId];

        const rarityClass = getRarityClass(game.rarity);

        const delistedBadge = game.delisted ? '<span class="delisted-badge">DELISTED</span>' : '';

        const isSelected = pendingSwap && pendingSwap.offeredTitles && pendingSwap.offeredTitles.includes(gameId);

        

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

}

function renderBrowseLibrary(filters = {}) {

    const browseLib = getBrowseLibrary();

    const browseContainer = document.getElementById('browse-library');

    

    if (!browseLib) {

        browseContainer.innerHTML = '<div class="empty-history">This library is private. User has set privacy to "private".</div>';

        document.getElementById('browse-library-value').textContent = formatPrice(0);

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

    

    // Sort

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

    document.getElementById('browse-library-value').textContent = formatPrice(totalValue);

    

    if (games.length === 0) {

        browseContainer.innerHTML = '<div class="empty-history">No games match your filters</div>';

        return;

    }

    

    browseContainer.innerHTML = games.map(game => {

        const rarityClass = getRarityClass(game.rarity);

        const delistedBadge = game.delisted ? '<span class="delisted-badge">DELISTED</span>' : '';

        const isSelected = pendingSwap && pendingSwap.requestedTitles && pendingSwap.requestedTitles.includes(game.id);

        

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

    

    // Re-attach click handlers

    document.querySelectorAll('#browse-library .game-card.selectable').forEach(card => {

        card.addEventListener('click', () => toggleSelection(card.dataset.gameId, 'requested'));

    });

}

function toggleSelection(gameId, type) {

    if (!pendingSwap) {

        // Start a new swap

        const offeredTitles = [];

        const requestedTitles = [];

        

        if (type === 'requested') {

            requestedTitles.push(gameId);

        } else {

            offeredTitles.push(gameId);

        }

        

        pendingSwap = {

            from_user: currentUser,

            to_user: getOtherUser(),

            offeredTitles: offeredTitles,

            requestedTitles: requestedTitles,

            status: 'pending'

        };

    } else {

        if (type === 'requested') {

            if (pendingSwap.requestedTitles.includes(gameId)) {

                pendingSwap.requestedTitles = pendingSwap.requestedTitles.filter(id => id !== gameId);

            } else {

                pendingSwap.requestedTitles.push(gameId);

            }

        } else {

            if (pendingSwap.offeredTitles.includes(gameId)) {

                pendingSwap.offeredTitles = pendingSwap.offeredTitles.filter(id => id !== gameId);

            } else {

                pendingSwap.offeredTitles.push(gameId);

            }

        }

    }

    

    updateSwapPanel();

    renderLibrary();

    renderBrowseLibrary();

}

function updateSwapPanel() {

    const panel = document.getElementById('swap-panel');

    const details = document.getElementById('swap-details');

    

    if (!pendingSwap || (pendingSwap.offeredTitles.length === 0 && pendingSwap.requestedTitles.length === 0)) {

        panel.classList.add('hidden');

        return;

    }

    

    panel.classList.remove('hidden');

    

    const offeredGames = pendingSwap.offeredTitles.map(id => GAME_DATABASE[id]);

    const requestedGames = pendingSwap.requestedTitles.map(id => GAME_DATABASE[id]);

    const offeredValue = offeredGames.reduce((s,g) => s + g.value_cents, 0);

    const requestedValue = requestedGames.reduce((s,g) => s + g.value_cents, 0);

    

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

function executeSwap() {

    if (!pendingSwap) return;

    if (pendingSwap.offeredTitles.length === 0 || pendingSwap.requestedTitles.length === 0) {

        alert('Please select at least one game to offer and one to request.');

        return;

    }

    

    const myLib = libraries[currentUser];

    const otherLib = libraries[getOtherUser()];

    const timestamp = Date.now();

    

    // Remove offered titles from my library

    pendingSwap.offeredTitles.forEach(gameId => {

        const index = myLib.titles.indexOf(gameId);

        if (index !== -1) myLib.titles.splice(index, 1);

    });

    

    // Remove requested titles from other library

    pendingSwap.requestedTitles.forEach(gameId => {

        const index = otherLib.titles.indexOf(gameId);

        if (index !== -1) otherLib.titles.splice(index, 1);

    });

    

    // Add requested titles to my library (with new cryptographic binding)

    pendingSwap.requestedTitles.forEach(gameId => {

        myLib.titles.push(gameId);

        // Simulate new signature for this user

        myLib.signatures[gameId] = generateSignature(currentUser, gameId, timestamp);

    });

    

    // Add offered titles to other library (with new cryptographic binding)

    pendingSwap.offeredTitles.forEach(gameId => {

        otherLib.titles.push(gameId);

        otherLib.signatures[gameId] = generateSignature(getOtherUser(), gameId, timestamp);

    });

    

    // Record swap in history

    const swapRecord = {

        id: `swap_${timestamp}`,

        date: new Date().toLocaleString(),

        user: currentUser === 'alice' ? 'AliceCollector' : 'BobGamer',

        gave: pendingSwap.offeredTitles.map(id => GAME_DATABASE[id].title).join(', '),

        received: pendingSwap.requestedTitles.map(id => GAME_DATABASE[id].title).join(', '),

        value_gave: pendingSwap.offeredTitles.reduce((s,id) => s + GAME_DATABASE[id].value_cents, 0),

        value_received: pendingSwap.requestedTitles.reduce((s,id) => s + GAME_DATABASE[id].value_cents, 0)

    };

    swapHistory.unshift(swapRecord);

    

    // Clear pending swap

    pendingSwap = null;

    

    // Re-render UI

    renderLibrary();

    renderBrowseLibrary();

    renderSwapHistory();

    updateSwapPanel();

    

    // Show success message

    const panel = document.getElementById('swap-panel');

    const originalContent = panel.innerHTML;

    panel.innerHTML = `

        <div style="text-align: center; padding: 20px;">

            <div style="font-size: 3rem;">✅</div>

            <h3>SWAP COMPLETE!</h3>

            <p>Cryptographic binding transferred. Your library has been updated.</p>

            <button onclick="location.reload()" class="btn-primary" style="margin-top: 10px;">Continue Trading</button>

        </div>

    `;

    setTimeout(() => {

        if (panel) panel.innerHTML = originalContent;

    }, 3000);

}

function renderSwapHistory() {

    const container = document.getElementById('swap-history');

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

    

    // Update UI

    document.querySelectorAll('.user-btn').forEach(btn => {

        if (btn.dataset.user === userId) {

            btn.classList.add('active');

        } else {

            btn.classList.remove('active');

        }

    });

    

    // Clear pending swap

    pendingSwap = null;

    updateSwapPanel();

    

    // Re-render

    renderLibrary();

    renderBrowseLibrary();

}

function changePrivacy() {

    const select = document.getElementById('privacy-select');

    const lib = libraries[currentUser];

    if (lib) {

        lib.privacy = select.value;

        renderBrowseLibrary(); // Re-render browse in case other user changed

    }

}

// ============================================================

// INITIALIZATION

// ============================================================

function init() {

    // Generate initial signatures for all titles

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

    

    // Set up event listeners

    document.getElementById('btn-alice').addEventListener('click', () => switchUser('alice'));

    document.getElementById('btn-bob').addEventListener('click', () => switchUser('bob'));

    document.getElementById('confirm-swap')?.addEventListener('click', executeSwap);

    document.getElementById('cancel-swap')?.addEventListener('click', () => {

        pendingSwap = null;

        updateSwapPanel();

        renderLibrary();

        renderBrowseLibrary();

    });

    document.getElementById('close-swap')?.addEventListener('click', () => {

        pendingSwap = null;

        updateSwapPanel();

        renderLibrary();

        renderBrowseLibrary();

    });

    document.getElementById('clear-history')?.addEventListener('click', clearHistory);

    document.getElementById('privacy-select')?.addEventListener('change', changePrivacy);

    document.getElementById('filter-search')?.addEventListener('input', () => renderBrowseLibrary());

    document.getElementById('filter-genre')?.addEventListener('change', () => renderBrowseLibrary());

    document.getElementById('filter-sort')?.addEventListener('change', () => renderBrowseLibrary());

    

    // Set initial privacy select value

    const privacySelect = document.getElementById('privacy-select');

    if (privacySelect) privacySelect.value = libraries[currentUser].privacy;

}

// Start the app

init();
// Application State
let currentSport = 'football';
let currentView = 'cards';
let filteredMarkets = [];
let editingMarketId = null;
let cardsGroupBy = 'suggested'; // 'suggested' or 'current'
let showOriginalNames = false; // Toggle between original and custom display names

// Constants
const VIEW_MODES = {
    CARDS: 'cards',
    TABLE: 'table',
    COMPARISON: 'comparison'
};

const GROUP_BY = {
    SUGGESTED: 'suggested',
    CURRENT: 'current'
};

// Helper Functions
function getMarketById(marketId) {
    const sport = sportsData[currentSport];
    return sport.markets.find(m => m.id === marketId);
}

function getCategoryConfig(categoryName) {
    const sport = sportsData[currentSport];
    return sport.suggestedCategories.find(c => c.name === categoryName);
}

function getUniqueCategoryValues(markets, field) {
    return [...new Set(markets.map(m => m[field]))].filter(Boolean).sort();
}

function getFilterCriteria() {
    return {
        searchTerm: document.getElementById('searchInput').value.toLowerCase(),
        statusFilter: document.getElementById('statusFilter').value,
        categoryFilter: document.getElementById('categoryFilter').value
    };
}

function applyFilters(markets, criteria) {
    return markets.filter(market => {
        const matchesSearch = !criteria.searchTerm ||
            market.specificMarket.toLowerCase().includes(criteria.searchTerm) ||
            market.sportsradarType.toLowerCase().includes(criteria.searchTerm) ||
            market.suggestedCategory.toLowerCase().includes(criteria.searchTerm);

        const matchesStatus = criteria.statusFilter === 'all' ||
            (criteria.statusFilter === 'active' && market.active) ||
            (criteria.statusFilter === 'inactive' && !market.active);

        const matchesCategory = criteria.categoryFilter === 'all' ||
            market.suggestedCategory === criteria.categoryFilter;

        return matchesSearch && matchesStatus && matchesCategory;
    });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeSportList();
    updateStats();
    updateCategoryFilter();
    renderContent();
});

// Initialize sport list in sidebar
function initializeSportList() {
    const sportList = document.getElementById('sportList');
    sportList.innerHTML = '';

    Object.entries(sportsData).forEach(([key, sport]) => {
        const li = document.createElement('li');
        li.className = `sport-item ${key === currentSport ? 'active' : ''}`;
        li.innerHTML = `
            <span class="sport-icon">${sport.icon}</span>
            <span class="sport-name">${sport.name}</span>
            <span class="sport-tooltip">${sport.name}</span>
        `;
        li.onclick = () => selectSport(key);
        sportList.appendChild(li);
    });
}

// Toggle sidebar collapsed state
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = sidebar.querySelector('.sidebar-toggle');
    sidebar.classList.toggle('collapsed');

    // Update toggle button icon
    if (sidebar.classList.contains('collapsed')) {
        toggleBtn.innerHTML = '▶';
    } else {
        toggleBtn.innerHTML = '◀';
    }
}

// Select a sport
function selectSport(sportKey) {
    currentSport = sportKey;
    document.querySelectorAll('.sport-item').forEach(item => item.classList.remove('active'));
    event.currentTarget.classList.add('active');
    updateStats();
    updateCategoryFilter();
    renderContent();
}

// Update statistics bar
function updateStats() {
    const sport = sportsData[currentSport];
    const totalMarkets = sport.markets.length;
    const activeMarkets = sport.markets.filter(m => m.active).length;
    const inactiveMarkets = totalMarkets - activeMarkets;

    const statsBar = document.getElementById('statsBar');
    statsBar.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${totalMarkets}</div>
            <div class="stat-label">Total Markets</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" style="color: #00ba7c">${activeMarkets}</div>
            <div class="stat-label">Active</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" style="color: #f4212e">${inactiveMarkets}</div>
            <div class="stat-label">Inactive</div>
        </div>
    `;
}

// Update category filter dropdown
function updateCategoryFilter() {
    const sport = sportsData[currentSport];
    const categories = getUniqueCategoryValues(sport.markets, 'suggestedCategory');

    const categoryFilter = document.getElementById('categoryFilter');
    const options = [
        '<option value="all">All Categories</option>',
        ...categories.map(cat => `<option value="${cat}">${cat}</option>`)
    ];
    categoryFilter.innerHTML = options.join('');
}

// Set view mode
function setView(view) {
    currentView = view;
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    renderContent();
}

// Filter markets based on search and filters
function filterMarkets() {
    const sport = sportsData[currentSport];
    const criteria = getFilterCriteria();
    filteredMarkets = applyFilters(sport.markets, criteria);
    renderContent();
}

// Render content based on current view
function renderContent() {
    const contentArea = document.getElementById('contentArea');
    const sport = sportsData[currentSport];

    // Apply filters
    const criteria = getFilterCriteria();
    filteredMarkets = applyFilters(sport.markets, criteria);

    switch (currentView) {
        case VIEW_MODES.CARDS:
            renderCardsView(contentArea);
            break;
        case VIEW_MODES.TABLE:
            renderTableView(contentArea);
            break;
        case VIEW_MODES.COMPARISON:
            renderComparisonView(contentArea);
            break;
    }
}

// Toggle cards grouping mode
function setCardsGroupBy(mode) {
    cardsGroupBy = mode;
    renderContent();
}

function toggleNameDisplay() {
    showOriginalNames = !showOriginalNames;
    // Update toggle button text
    const toggleBtn = document.getElementById('nameDisplayToggle');
    if (toggleBtn) {
        toggleBtn.textContent = showOriginalNames ? 'Original Names' : 'Custom Names';
    }
    renderContent();
}

// Helper to get the display name for a market
function getMarketDisplayName(market) {
    if (showOriginalNames) {
        return market.specificMarket;
    }
    return market.displayName || market.specificMarket;
}

// Check if market has a custom display name
function hasCustomName(market) {
    return market.displayName && market.displayName !== market.specificMarket;
}

// Render cards view
function renderCardsView(container) {
    const sport = sportsData[currentSport];
    const groupedMarkets = {};

    if (cardsGroupBy === 'suggested') {
        // Initialize all suggested categories (even empty ones)
        sport.suggestedCategories.forEach(cat => {
            groupedMarkets[cat.name] = [];
        });

        // Add markets to their categories
        filteredMarkets.forEach(market => {
            const category = market.suggestedCategory || 'Uncategorized';
            if (!groupedMarkets[category]) {
                groupedMarkets[category] = [];
            }
            groupedMarkets[category].push(market);
        });
    } else {
        // Group by current categories (sportsradarType)
        sport.currentCategories.forEach(cat => {
            groupedMarkets[cat.name] = [];
        });

        // Add markets to their current categories
        filteredMarkets.forEach(market => {
            const category = market.sportsradarType || 'Uncategorized';
            if (!groupedMarkets[category]) {
                groupedMarkets[category] = [];
            }
            groupedMarkets[category].push(market);
        });
    }

    if (Object.keys(groupedMarkets).length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <h3>No markets found</h3>
                <p>Try adjusting your search or filters</p>
            </div>
        `;
        return;
    }

    const isSuggested = cardsGroupBy === 'suggested';

    // Filter out empty categories in current view
    const displayMarkets = isSuggested
        ? groupedMarkets
        : Object.fromEntries(Object.entries(groupedMarkets).filter(([_, markets]) => markets.length > 0));

    let html = `
        <div class="cards-header">
            <div class="view-info">
                <span class="info-icon">ℹ️</span>
                <span>Showing <strong>${isSuggested ? 'Suggested' : 'Current'} Categories</strong>${isSuggested ? ' — drag to reorder markets, move between categories, or reorder category cards' : ''}</span>
            </div>
            <div class="group-toggle">
                <button class="group-btn ${isSuggested ? 'active' : ''}" onclick="setCardsGroupBy('suggested')">Suggested</button>
                <button class="group-btn ${!isSuggested ? 'active' : ''}" onclick="setCardsGroupBy('current')">Current</button>
            </div>
        </div>
        <div class="categories-container">
    `;

    // Sort categories by their order (if defined) or alphabetically
    const sortedCategories = Object.entries(displayMarkets).sort((a, b) => {
        const catConfigA = sport.suggestedCategories.find(c => c.name === a[0]);
        const catConfigB = sport.suggestedCategories.find(c => c.name === b[0]);
        const orderA = catConfigA?.order ?? 999;
        const orderB = catConfigB?.order ?? 999;
        if (orderA !== orderB) return orderA - orderB;
        return a[0].localeCompare(b[0]);
    });

    sortedCategories.forEach(([category, markets], cardIndex) => {
        html += `
            <div class="category-card" data-category="${category}" ${isSuggested ? `draggable="true" ondragstart="handleCardDragStart(event)" ondragend="handleCardDragEnd(event)" ondragover="handleCardDragOver(event)" ondragleave="handleCardDragLeave(event)" ondrop="handleCardDrop(event)"` : ''}>
                <div class="category-header">
                    <div class="category-title">
                        ${isSuggested ? `<span class="category-order">${cardIndex + 1}</span>` : ''}
                        ${category}
                        <span class="category-count">${markets.length}</span>
                    </div>
                    ${isSuggested ? `
                    <div class="category-actions">
                        <span class="drag-handle" title="Drag to reorder">⋮⋮</span>
                        <button class="icon-btn" onclick="editCategory('${category}')" title="Edit category">✏️</button>
                        <button class="icon-btn icon-btn-danger" onclick="deleteCategory('${category}', event)" title="Delete category">🗑️</button>
                    </div>
                    ` : ''}
                </div>
                <div class="market-list" ${isSuggested ? `ondragover="handleDragOver(event)" ondrop="handleDrop(event, '${category}')"` : ''}>
        `;

        if (markets.length === 0) {
            html += `
                <div class="empty-category-message">
                    ${isSuggested ? 'Drag markets here' : 'No markets'}
                </div>
            `;
        } else {
            // Sort markets by subcategory to group them together
            const sortedMarkets = [...markets].sort((a, b) => {
                const subA = (isSuggested ? a.suggestedSubcategory : '') || '';
                const subB = (isSuggested ? b.suggestedSubcategory : '') || '';
                const nameA = a.specificMarket;
                const nameB = b.specificMarket;

                // Special case: Football Player Props - TD Props comes first
                if (currentSport === 'football' && category === 'Player Props') {
                    if (subA === 'TD Props' && subB !== 'TD Props') return -1;
                    if (subB === 'TD Props' && subA !== 'TD Props') return 1;
                }

                // Special case: Football Halves - Halftime/Fulltime first, Highest Scoring Half second
                if (currentSport === 'football' && category === 'Halves') {
                    const isHalftimeA = nameA === 'Halftime/Fulltime';
                    const isHalftimeB = nameB === 'Halftime/Fulltime';
                    const isHighestA = nameA === 'Highest Scoring Half';
                    const isHighestB = nameB === 'Highest Scoring Half';

                    if (isHalftimeA) return -1;
                    if (isHalftimeB) return 1;
                    if (isHighestA) return -1;
                    if (isHighestB) return 1;
                }

                // Special case: Football Game Props - Odd/Even markets at the top
                if (currentSport === 'football' && category === 'Game Props') {
                    const isOddEvenA = nameA.toLowerCase().includes('odd/even');
                    const isOddEvenB = nameB.toLowerCase().includes('odd/even');

                    if (isOddEvenA && !isOddEvenB) return -1;
                    if (isOddEvenB && !isOddEvenA) return 1;
                }

                // Markets without subcategory come first, then sort alphabetically by subcategory
                if (!subA && subB) return -1;
                if (subA && !subB) return 1;
                return subA.localeCompare(subB);
            });

            sortedMarkets.forEach((market, index) => {
                const subcategory = isSuggested ? market.suggestedSubcategory : '';
                const needsReview = market.needsReview || false;
                const displayName = getMarketDisplayName(market);
                const isRenamed = hasCustomName(market);
                html += `
                    <div class="market-item ${market.active ? '' : 'inactive'} ${!isSuggested ? 'readonly' : ''}"
                         ${isSuggested ? 'draggable="true"' : ''}
                         data-id="${market.id}"
                         data-category="${category}"
                         data-index="${index}"
                         ${isSuggested ? `ondragstart="handleDragStart(event)" ondragend="handleDragEnd(event)" ondragover="handleItemDragOver(event)" ondragleave="handleItemDragLeave(event)" ondrop="handleItemDrop(event)" onclick="openMarketModal('${market.id}')"` : ''}>
                        <span class="market-name ${isRenamed ? 'renamed' : ''}" ${isRenamed ? `data-original="${market.specificMarket}"` : ''}>${displayName}</span>
                        <div class="market-badges">
                            ${subcategory ? `<span class="badge badge-subcategory">${subcategory}</span>` : ''}
                            <span class="badge ${market.active ? 'badge-active' : 'badge-inactive'}">
                                ${market.active ? 'Active' : 'Inactive'}
                            </span>
                            <button class="review-btn ${needsReview ? 'flagged' : ''}" onclick="toggleNeedsReview('${market.id}', event)" title="Flag for review">?</button>
                        </div>
                    </div>
                `;
            });
        }

        html += `
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// Render table view
function renderTableView(container) {
    let html = `
        <div class="table-view">
            <div class="table-inner">
                <div class="table-header">
                    <div>#</div>
                    <div>Market Name</div>
                    <div>Sportsradar Type</div>
                    <div>Suggested Category</div>
                    <div>Subcategory</div>
                    <div>Current Category</div>
                    <div>Active</div>
                    <div>Review</div>
                </div>
    `;

    filteredMarkets.forEach((market, index) => {
        const needsReview = market.needsReview || false;
        const displayName = getMarketDisplayName(market);
        const isRenamed = hasCustomName(market);
        html += `
            <div class="table-row" data-id="${market.id}">
                <div class="row-number">${index + 1}</div>
                <div class="market-name ${isRenamed ? 'renamed' : ''}" ${isRenamed ? `data-original="${market.specificMarket}"` : ''}>${displayName}</div>
                <div><span class="badge badge-subcategory">${market.sportsradarType}</span></div>
                <div class="editable-cell" onclick="editMarketCategory('${market.id}', 'suggestedCategory', event)">${market.suggestedCategory || '-'}</div>
                <div class="editable-cell" onclick="editMarketCategory('${market.id}', 'suggestedSubcategory', event)">${market.suggestedSubcategory || '-'}</div>
                <div>${getCurrentCategory(market) || '-'}</div>
                <div>
                    <label class="toggle-switch">
                        <input type="checkbox" ${market.active ? 'checked' : ''} onchange="toggleMarketActive('${market.id}')">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div>
                    <button class="review-btn ${needsReview ? 'flagged' : ''}" onclick="toggleNeedsReview('${market.id}', event)" title="Flag for review">
                        ?
                    </button>
                </div>
            </div>
        `;
    });

    // Add Market button row
    html += `
                <div class="add-market-row" id="addMarketRow">
                    <button class="btn btn-secondary add-market-btn" onclick="showAddMarketForm()">+ Add Market</button>
                </div>
    `;

    html += '</div></div>';
    container.innerHTML = html;
}

// Show add market form
function showAddMarketForm() {
    const sport = sportsData[currentSport];
    const sportsradarTypes = [...new Set(sport.markets.map(m => m.sportsradarType))].sort();
    const categories = sport.suggestedCategories.map(c => c.name);

    const addMarketRow = document.getElementById('addMarketRow');
    addMarketRow.innerHTML = `
        <div class="add-market-form">
            <div class="form-row">
                <input type="text" id="newMarketName" placeholder="Market Name" class="form-input" required>
                <select id="newSportsradarType" class="form-select">
                    ${sportsradarTypes.map(t => `<option value="${t}">${t}</option>`).join('')}
                </select>
                <select id="newCategory" class="form-select" onchange="updateNewSubcategoryOptions()">
                    ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
                <select id="newSubcategory" class="form-select">
                    <option value="">None</option>
                </select>
                <label class="toggle-switch">
                    <input type="checkbox" id="newMarketActive" checked>
                    <span class="toggle-slider"></span>
                </label>
            </div>
            <div class="form-actions">
                <button class="btn btn-success" onclick="saveNewMarket()">Save</button>
                <button class="btn btn-secondary" onclick="cancelAddMarket()">Cancel</button>
            </div>
        </div>
    `;

    // Initialize subcategory options
    updateNewSubcategoryOptions();

    // Focus on the name input
    document.getElementById('newMarketName').focus();
}

// Update subcategory options based on selected category
function updateNewSubcategoryOptions() {
    const sport = sportsData[currentSport];
    const selectedCategory = document.getElementById('newCategory').value;
    const categoryConfig = sport.suggestedCategories.find(c => c.name === selectedCategory);
    const subcategories = categoryConfig ? categoryConfig.subcategories : [];

    const subcategorySelect = document.getElementById('newSubcategory');
    subcategorySelect.innerHTML = '<option value="">None</option>';
    subcategories.forEach(sub => {
        subcategorySelect.innerHTML += `<option value="${sub}">${sub}</option>`;
    });
}

// Generate unique market ID
function generateMarketId(sport) {
    const prefix = {
        football: 'fb',
        basketball: 'bb',
        soccer: 'sc',
        hockey: 'hk',
        tennis: 'tn',
        baseball: 'bs'
    }[sport];

    const existingIds = sportsData[sport].markets.map(m => {
        const parts = m.id.split('_');
        return parseInt(parts[1]) || 0;
    });
    const nextNum = Math.max(...existingIds, 0) + 1;
    return `${prefix}_${nextNum}`;
}

// Save new market
function saveNewMarket() {
    const name = document.getElementById('newMarketName').value.trim();
    const sportsradarType = document.getElementById('newSportsradarType').value;
    const category = document.getElementById('newCategory').value;
    const subcategory = document.getElementById('newSubcategory').value;
    const active = document.getElementById('newMarketActive').checked;

    if (!name) {
        alert('Please enter a market name');
        return;
    }

    const newMarket = {
        id: generateMarketId(currentSport),
        specificMarket: name,
        sportsradarType: sportsradarType,
        active: active,
        suggestedCategory: category,
        suggestedSubcategory: subcategory
    };

    sportsData[currentSport].markets.push(newMarket);
    updateStats();
    updateCategoryFilter();
    renderContent();
}

// Cancel add market
function cancelAddMarket() {
    renderContent();
}

// Render comparison view
function renderComparisonView(container) {
    const sport = sportsData[currentSport];
    const competitor = competitorData.draftkings[currentSport];

    let html = `
        <div class="comparison-view">
            <div class="comparison-panel">
                <div class="comparison-header current">
                    Current Categories
                </div>
                <div class="market-list">
    `;

    sport.currentCategories.forEach(cat => {
        html += `
            <div class="market-item">
                <span class="market-name">${cat.name}</span>
                ${cat.subcategories.length > 0 ? `<span class="badge badge-subcategory">${cat.subcategories.length} subcats</span>` : ''}
            </div>
        `;
        cat.subcategories.forEach(sub => {
            html += `
                <div class="market-item" style="padding-left: 30px; opacity: 0.7">
                    <span class="market-name">↳ ${sub}</span>
                </div>
            `;
        });
    });

    html += `
                </div>
            </div>
            <div class="comparison-panel">
                <div class="comparison-header suggested">
                    DraftKings Categories
                </div>
                <div class="market-list">
    `;

    if (competitor) {
        competitor.categories.forEach(cat => {
            html += `
                <div class="market-item">
                    <span class="market-name">${cat.name}</span>
                    ${cat.subcategories.length > 0 ? `<span class="badge badge-subcategory">${cat.subcategories.length} subcats</span>` : ''}
                </div>
            `;
            cat.subcategories.forEach(sub => {
                html += `
                    <div class="market-item" style="padding-left: 30px; opacity: 0.7">
                        <span class="market-name">↳ ${sub}</span>
                    </div>
                `;
            });
        });
    } else {
        html += `
            <div class="empty-state">
                <p>No competitor data available for this sport</p>
            </div>
        `;
    }

    html += `
                </div>
            </div>
        </div>

        <h3 style="margin: 30px 0 20px; color: #71767b">Suggested Categories</h3>

        <div class="comparison-view">
            <div class="comparison-panel">
                <div class="comparison-header suggested" style="border-left-color: #1d9bf0">
                    Suggested New Categories
                </div>
                <div class="market-list">
    `;

    sport.suggestedCategories.forEach(cat => {
        html += `
            <div class="market-item" style="cursor: pointer" onclick="editCategory('${cat.name}')">
                <span class="market-name">${cat.name}</span>
                ${cat.subcategories.length > 0 ? `<span class="badge badge-subcategory">${cat.subcategories.length} subcats</span>` : ''}
            </div>
        `;
        cat.subcategories.forEach(sub => {
            html += `
                <div class="market-item" style="padding-left: 30px; opacity: 0.7; cursor: pointer" onclick="editSubcategory('${cat.name}', '${sub}')">
                    <span class="market-name">↳ ${sub}</span>
                </div>
            `;
        });
    });

    html += `
                </div>
            </div>
            <div class="comparison-panel">
                <div class="comparison-header" style="border-left: 3px solid #71767b">
                    Key Differences
                </div>
                <div class="market-list" style="padding: 20px">
                    <p style="margin-bottom: 12px; color: #e7e9ea">Recommendations:</p>
                    <ul style="color: #71767b; line-height: 1.8; padding-left: 20px">
                        <li>Separate Player Props into stat-specific categories (Passing, Rushing, etc.)</li>
                        <li>Add a "Popular" category for featured markets</li>
                        <li>Create "Game Props" distinct from Player Props</li>
                        <li>Consider "Team Props" for team-specific totals</li>
                        <li>Use consistent naming across sports</li>
                    </ul>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// Get current category for a market
function getCurrentCategory(market) {
    const sport = sportsData[currentSport];
    for (const cat of sport.currentCategories) {
        if (cat.name === market.sportsradarType) {
            return cat.name;
        }
    }
    return market.sportsradarType;
}

// Drag and drop handlers
function handleDragStart(event) {
    event.target.classList.add('dragging');
    event.dataTransfer.setData('text/plain', event.target.dataset.id);
}

function handleDragEnd(event) {
    event.target.classList.remove('dragging');
}

function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
}

function handleDrop(event, category) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');

    const marketId = event.dataTransfer.getData('text/plain');
    const sport = sportsData[currentSport];
    const market = sport.markets.find(m => m.id === marketId);

    if (market) {
        market.suggestedCategory = category;
        renderContent();
        updateStats();
    }
}

// Handle drag over individual market items for reordering
function handleItemDragOver(event) {
    event.preventDefault();
    event.stopPropagation();

    const targetItem = event.currentTarget;
    const draggingId = event.dataTransfer.getData('text/plain') || document.querySelector('.dragging')?.dataset.id;

    // Don't show indicator on the item being dragged
    if (targetItem.dataset.id === draggingId) return;

    // Determine if we're in the top or bottom half of the target
    const rect = targetItem.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;

    // Remove existing indicators
    document.querySelectorAll('.drop-above, .drop-below').forEach(el => {
        el.classList.remove('drop-above', 'drop-below');
    });

    if (event.clientY < midpoint) {
        targetItem.classList.add('drop-above');
    } else {
        targetItem.classList.add('drop-below');
    }
}

function handleItemDragLeave(event) {
    event.currentTarget.classList.remove('drop-above', 'drop-below');
}

function handleItemDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    const targetItem = event.currentTarget;
    const draggedId = event.dataTransfer.getData('text/plain');
    const targetId = targetItem.dataset.id;
    const targetCategory = targetItem.dataset.category;

    // Remove visual indicators
    document.querySelectorAll('.drop-above, .drop-below').forEach(el => {
        el.classList.remove('drop-above', 'drop-below');
    });
    document.querySelectorAll('.drag-over').forEach(el => {
        el.classList.remove('drag-over');
    });

    if (draggedId === targetId) return;

    const sport = sportsData[currentSport];
    const draggedMarket = sport.markets.find(m => m.id === draggedId);

    if (!draggedMarket) return;

    // Determine drop position (above or below target)
    const rect = targetItem.getBoundingClientRect();
    const dropBelow = event.clientY > rect.top + rect.height / 2;

    // Update the dragged market's category if moving to a different category
    draggedMarket.suggestedCategory = targetCategory;

    // Get all markets in the target category (sorted by current order)
    const categoryMarkets = sport.markets.filter(m => m.suggestedCategory === targetCategory);

    // Find positions
    const draggedIndex = sport.markets.indexOf(draggedMarket);
    const targetMarket = sport.markets.find(m => m.id === targetId);
    const targetIndex = sport.markets.indexOf(targetMarket);

    // Remove dragged market from array
    sport.markets.splice(draggedIndex, 1);

    // Find new target index (it may have shifted after removal)
    const newTargetIndex = sport.markets.indexOf(targetMarket);

    // Insert at new position
    const insertIndex = dropBelow ? newTargetIndex + 1 : newTargetIndex;
    sport.markets.splice(insertIndex, 0, draggedMarket);

    renderContent();
    updateStats();
}

// Category card drag and drop handlers
let draggingCard = null;

function handleCardDragStart(event) {
    draggingCard = event.currentTarget;
    event.currentTarget.classList.add('card-dragging');
    event.dataTransfer.setData('text/card', event.currentTarget.dataset.category);
    event.dataTransfer.effectAllowed = 'move';
}

function handleCardDragEnd(event) {
    event.currentTarget.classList.remove('card-dragging');
    document.querySelectorAll('.card-drop-left, .card-drop-right').forEach(el => {
        el.classList.remove('card-drop-left', 'card-drop-right');
    });
    draggingCard = null;
}

function handleCardDragOver(event) {
    // Only handle if we're dragging a card (not a market)
    if (!draggingCard) return;

    event.preventDefault();
    event.stopPropagation();

    const targetCard = event.currentTarget;
    if (targetCard === draggingCard) return;

    // Determine if we're on the left or right half
    const rect = targetCard.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;

    // Remove existing indicators
    document.querySelectorAll('.card-drop-left, .card-drop-right').forEach(el => {
        el.classList.remove('card-drop-left', 'card-drop-right');
    });

    if (event.clientX < midpoint) {
        targetCard.classList.add('card-drop-left');
    } else {
        targetCard.classList.add('card-drop-right');
    }
}

function handleCardDragLeave(event) {
    if (!draggingCard) return;
    event.currentTarget.classList.remove('card-drop-left', 'card-drop-right');
}

function handleCardDrop(event) {
    if (!draggingCard) return;

    event.preventDefault();
    event.stopPropagation();

    const targetCard = event.currentTarget;
    const draggedCategory = event.dataTransfer.getData('text/card');
    const targetCategory = targetCard.dataset.category;

    // Remove visual indicators
    document.querySelectorAll('.card-drop-left, .card-drop-right').forEach(el => {
        el.classList.remove('card-drop-left', 'card-drop-right');
    });

    if (draggedCategory === targetCategory) return;

    const sport = sportsData[currentSport];

    // Determine drop position (left or right of target)
    const rect = targetCard.getBoundingClientRect();
    const dropAfter = event.clientX > rect.left + rect.width / 2;

    // Get current category configs
    const draggedConfig = sport.suggestedCategories.find(c => c.name === draggedCategory);
    const targetConfig = sport.suggestedCategories.find(c => c.name === targetCategory);

    if (!draggedConfig || !targetConfig) return;

    // Initialize orders if not set
    sport.suggestedCategories.forEach((cat, idx) => {
        if (cat.order === undefined) cat.order = idx;
    });

    // Get sorted list of categories
    const sorted = [...sport.suggestedCategories].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    // Remove dragged from list
    const draggedIndex = sorted.indexOf(draggedConfig);
    sorted.splice(draggedIndex, 1);

    // Find target index after removal
    const targetIndex = sorted.indexOf(targetConfig);

    // Insert at new position
    const insertIndex = dropAfter ? targetIndex + 1 : targetIndex;
    sorted.splice(insertIndex, 0, draggedConfig);

    // Update order values
    sorted.forEach((cat, idx) => {
        cat.order = idx;
    });

    renderContent();
}

// Toggle market active status
function toggleMarketActive(marketId) {
    const market = getMarketById(marketId);
    if (market) {
        market.active = !market.active;
        updateStats();
        // Don't re-render to avoid losing scroll position
    }
}

// Toggle needs review flag
function toggleNeedsReview(marketId, event) {
    if (event) event.stopPropagation();
    const market = getMarketById(marketId);
    if (market) {
        market.needsReview = !market.needsReview;
        updateReviewCount();
        renderContent();
    }
}

// Get count of markets needing review across all sports
function getReviewCount() {
    let count = 0;
    Object.values(sportsData).forEach(sport => {
        count += sport.markets.filter(m => m.needsReview).length;
    });
    return count;
}

// Update review count badge
function updateReviewCount() {
    const countEl = document.getElementById('reviewCount');
    if (countEl) {
        const count = getReviewCount();
        countEl.textContent = `(${count})`;
        countEl.style.display = count > 0 ? 'inline' : 'none';
    }
}

// Show review list modal
function showReviewList() {
    const content = document.getElementById('reviewListContent');
    let html = '';

    // Collect all markets needing review across all sports
    const reviewMarkets = [];
    Object.entries(sportsData).forEach(([sportKey, sport]) => {
        sport.markets.forEach(market => {
            if (market.needsReview) {
                reviewMarkets.push({
                    ...market,
                    sportKey,
                    sportName: sport.name
                });
            }
        });
    });

    if (reviewMarkets.length === 0) {
        html = `
            <div class="empty-state" style="padding: 40px; text-align: center; color: var(--color-text-muted);">
                <div style="font-size: 48px; margin-bottom: 16px;">✓</div>
                <h3 style="color: var(--color-text); margin-bottom: 8px;">No markets to review</h3>
                <p>Click the ? button on any market to flag it for review</p>
            </div>
        `;
    } else {
        html = `<div class="review-list">`;
        reviewMarkets.forEach(market => {
            html += `
                <div class="review-item">
                    <div class="review-item-info">
                        <div class="review-item-sport">${market.sportName}</div>
                        <div class="review-item-name">${market.specificMarket}</div>
                        <div class="review-item-category">
                            ${market.suggestedCategory || 'Uncategorized'}
                            ${market.suggestedSubcategory ? ` → ${market.suggestedSubcategory}` : ''}
                        </div>
                    </div>
                    <div class="review-item-actions">
                        <button class="btn btn-secondary" onclick="goToMarket('${market.sportKey}', '${market.id}')">View</button>
                        <button class="review-btn flagged" onclick="unflagFromReviewList('${market.sportKey}', '${market.id}')" title="Remove flag">?</button>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }

    content.innerHTML = html;
    document.getElementById('reviewModal').classList.add('active');
}

// Close review modal
function closeReviewModal() {
    document.getElementById('reviewModal').classList.remove('active');
}

// Navigate to a specific market from review list
function goToMarket(sportKey, marketId) {
    // Change sport if needed
    if (currentSport !== sportKey) {
        currentSport = sportKey;
        document.querySelectorAll('.sport-item').forEach((item, index) => {
            const key = Object.keys(sportsData)[index];
            item.classList.toggle('active', key === sportKey);
        });
        updateStats();
        updateCategoryFilter();
    }

    closeReviewModal();
    setView('table');

    // Scroll to market after render
    setTimeout(() => {
        const row = document.querySelector(`[data-id="${marketId}"]`);
        if (row) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            row.style.animation = 'highlight 2s';
        }
    }, 100);
}

// Unflag market from review list
function unflagFromReviewList(sportKey, marketId) {
    const sport = sportsData[sportKey];
    const market = sport.markets.find(m => m.id === marketId);
    if (market) {
        market.needsReview = false;
        updateReviewCount();
        showReviewList(); // Refresh the list
        renderContent(); // Update main view
    }
}

// Modal functions
function openAddCategoryModal() {
    document.getElementById('modalTitle').textContent = 'Add Category';
    document.getElementById('categoryName').value = '';

    const parentSelect = document.getElementById('parentCategory');
    parentSelect.innerHTML = '<option value="">None (Top-level category)</option>';

    const sport = sportsData[currentSport];
    const categories = [...new Set(sport.markets.map(m => m.suggestedCategory))].sort();
    categories.forEach(cat => {
        if (cat) {
            parentSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
        }
    });

    document.getElementById('categoryModal').classList.add('active');
}

function closeModal() {
    document.getElementById('categoryModal').classList.remove('active');
}

function saveCategory() {
    const name = document.getElementById('categoryName').value.trim();
    if (!name) {
        alert('Please enter a category name');
        return;
    }

    const sport = sportsData[currentSport];
    const parentCategory = document.getElementById('parentCategory').value;

    if (parentCategory) {
        // Add as subcategory
        const parent = sport.suggestedCategories.find(c => c.name === parentCategory);
        if (parent && !parent.subcategories.includes(name)) {
            parent.subcategories.push(name);
        }
    } else {
        // Add as top-level category
        if (!sport.suggestedCategories.find(c => c.name === name)) {
            sport.suggestedCategories.push({ name, subcategories: [] });
        }
    }

    closeModal();
    updateCategoryFilter();
    renderContent();
}

function openMarketModal(marketId) {
    editingMarketId = marketId;
    const sport = sportsData[currentSport];
    const market = getMarketById(marketId);

    if (!market) return;

    document.getElementById('marketOriginalName').value = market.specificMarket;
    document.getElementById('marketDisplayName').value = market.displayName || '';
    document.getElementById('marketSportsradarType').value = market.sportsradarType;
    document.getElementById('marketCurrentCategory').value = getCurrentCategory(market) || '-';
    document.getElementById('marketActive').value = market.active.toString();

    // Populate category dropdown
    const categorySelect = document.getElementById('marketCategory');
    const categories = getUniqueCategoryValues(sport.markets, 'suggestedCategory');
    categorySelect.innerHTML = categories.map(cat =>
        `<option value="${cat}" ${cat === market.suggestedCategory ? 'selected' : ''}>${cat}</option>`
    ).join('');

    // Populate subcategory dropdown
    updateSubcategoryDropdown(market.suggestedCategory, market.suggestedSubcategory);

    document.getElementById('marketModal').classList.add('active');
}

function updateSubcategoryDropdown(category, selectedSubcategory = '') {
    const subcategorySelect = document.getElementById('marketSubcategory');
    const catConfig = getCategoryConfig(category);
    const subcategories = catConfig ? catConfig.subcategories : [];

    const options = [
        '<option value="">None</option>',
        ...subcategories.map(sub =>
            `<option value="${sub}" ${sub === selectedSubcategory ? 'selected' : ''}>${sub}</option>`
        )
    ];
    subcategorySelect.innerHTML = options.join('');
}

function closeMarketModal() {
    document.getElementById('marketModal').classList.remove('active');
    editingMarketId = null;
}

function saveMarket() {
    if (!editingMarketId) return;

    const sport = sportsData[currentSport];
    const market = sport.markets.find(m => m.id === editingMarketId);

    if (market) {
        market.suggestedCategory = document.getElementById('marketCategory').value;
        market.suggestedSubcategory = document.getElementById('marketSubcategory').value;
        market.active = document.getElementById('marketActive').value === 'true';

        // Save display name (empty string means use original)
        const displayName = document.getElementById('marketDisplayName').value.trim();
        market.displayName = displayName;

        closeMarketModal();
        updateStats();
        renderContent();
    }
}

function editCategory(category) {
    const newName = prompt('Enter new category name:', category);
    if (newName && newName !== category) {
        const sport = sportsData[currentSport];
        sport.markets.forEach(market => {
            if (market.suggestedCategory === category) {
                market.suggestedCategory = newName;
            }
        });

        // Update suggested categories
        const catConfig = sport.suggestedCategories.find(c => c.name === category);
        if (catConfig) {
            catConfig.name = newName;
        }

        updateCategoryFilter();
        renderContent();
    }
}

function deleteCategory(category, event) {
    if (event) {
        event.stopPropagation();
    }

    const sport = sportsData[currentSport];
    const marketsInCategory = sport.markets.filter(m => m.suggestedCategory === category);

    let confirmMessage = `Are you sure you want to delete the category "${category}"?`;
    if (marketsInCategory.length > 0) {
        confirmMessage += `\n\n${marketsInCategory.length} market(s) in this category will be moved to "Uncategorized".`;
    }

    if (!confirm(confirmMessage)) {
        return;
    }

    // Move markets to Uncategorized
    marketsInCategory.forEach(market => {
        market.suggestedCategory = 'Uncategorized';
        market.suggestedSubcategory = '';
    });

    // Remove the category from suggestedCategories
    const catIndex = sport.suggestedCategories.findIndex(c => c.name === category);
    if (catIndex !== -1) {
        sport.suggestedCategories.splice(catIndex, 1);
    }

    // Ensure Uncategorized category exists if we moved markets there
    if (marketsInCategory.length > 0) {
        const uncategorizedExists = sport.suggestedCategories.find(c => c.name === 'Uncategorized');
        if (!uncategorizedExists) {
            sport.suggestedCategories.push({ name: 'Uncategorized', subcategories: [], order: 999 });
        }
    }

    updateCategoryFilter();
    renderContent();
}

function editSubcategory(categoryName, subcategory) {
    const newName = prompt('Enter new subcategory name:', subcategory);
    if (newName && newName !== subcategory) {
        const sport = sportsData[currentSport];

        // Update markets with this subcategory
        sport.markets.forEach(market => {
            if (market.suggestedCategory === categoryName && market.suggestedSubcategory === subcategory) {
                market.suggestedSubcategory = newName;
            }
        });

        // Update suggested categories config
        const catConfig = sport.suggestedCategories.find(c => c.name === categoryName);
        if (catConfig) {
            const subIndex = catConfig.subcategories.indexOf(subcategory);
            if (subIndex !== -1) {
                catConfig.subcategories[subIndex] = newName;
            }
        }

        renderContent();
    }
}

function editMarketCategory(marketId, field, event) {
    // Prevent event bubbling
    if (event) {
        event.stopPropagation();
    }

    const sport = sportsData[currentSport];
    const market = sport.markets.find(m => m.id === marketId);

    if (!market) return;

    // Close any existing dropdown
    closeCategoryDropdown();

    const currentValue = market[field] || '';

    // Get available options based on field type
    let options = [];
    if (field === 'suggestedCategory') {
        options = sport.suggestedCategories.map(c => c.name);
    } else if (field === 'suggestedSubcategory') {
        const parentCategory = sport.suggestedCategories.find(c => c.name === market.suggestedCategory);
        options = parentCategory ? parentCategory.subcategories : [];
    }

    // Get the clicked cell's position
    const cell = event ? event.currentTarget : document.querySelector(`[data-id="${marketId}"] .editable-cell`);
    const rect = cell.getBoundingClientRect();

    // Create dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'category-dropdown';
    dropdown.id = 'categoryDropdown';
    dropdown.style.top = `${rect.bottom + window.scrollY + 4}px`;
    dropdown.style.left = `${rect.left + window.scrollX}px`;

    // Add "None" option for subcategory field
    if (field === 'suggestedSubcategory') {
        const noneItem = document.createElement('div');
        noneItem.className = `category-dropdown-item ${!currentValue ? 'selected' : ''}`;
        noneItem.innerHTML = `${!currentValue ? '✓ ' : ''}None`;
        noneItem.onclick = (e) => {
            e.stopPropagation();
            selectCategory(marketId, field, '');
        };
        dropdown.appendChild(noneItem);
    }

    // Add options
    options.forEach(option => {
        const item = document.createElement('div');
        item.className = `category-dropdown-item ${option === currentValue ? 'selected' : ''}`;
        item.innerHTML = `${option === currentValue ? '✓ ' : ''}${option}`;
        item.onclick = (e) => {
            e.stopPropagation();
            selectCategory(marketId, field, option);
        };
        dropdown.appendChild(item);
    });

    // Add "Add new" option
    const addNewItem = document.createElement('div');
    addNewItem.className = 'category-dropdown-item add-new';
    addNewItem.innerHTML = '+ Add custom...';
    addNewItem.onclick = (e) => {
        e.stopPropagation();
        showCustomCategoryInput(dropdown, marketId, field, currentValue);
    };
    dropdown.appendChild(addNewItem);

    // Create overlay to close dropdown when clicking outside
    const overlay = document.createElement('div');
    overlay.className = 'dropdown-overlay';
    overlay.id = 'dropdownOverlay';
    overlay.onclick = closeCategoryDropdown;

    document.body.appendChild(overlay);
    document.body.appendChild(dropdown);
}

function showCustomCategoryInput(dropdown, marketId, field, currentValue) {
    // Remove existing items and show input
    dropdown.innerHTML = `
        <div class="category-dropdown-input">
            <input type="text" id="customCategoryInput" placeholder="Enter ${field === 'suggestedCategory' ? 'category' : 'subcategory'} name..." value="${currentValue}">
            <div class="category-dropdown-input-actions">
                <button class="cancel-btn" onclick="closeCategoryDropdown()">Cancel</button>
                <button class="save-btn" onclick="saveCustomCategory('${marketId}', '${field}')">Save</button>
            </div>
        </div>
    `;

    // Focus the input
    setTimeout(() => {
        const input = document.getElementById('customCategoryInput');
        input.focus();
        input.select();

        // Handle Enter key
        input.onkeydown = (e) => {
            if (e.key === 'Enter') {
                saveCustomCategory(marketId, field);
            } else if (e.key === 'Escape') {
                closeCategoryDropdown();
            }
        };
    }, 0);
}

function selectCategory(marketId, field, value) {
    const sport = sportsData[currentSport];
    const market = sport.markets.find(m => m.id === marketId);

    if (market) {
        market[field] = value;

        // If changing category, reset subcategory if it's not valid for new category
        if (field === 'suggestedCategory') {
            const newCategory = sport.suggestedCategories.find(c => c.name === value);
            if (newCategory && !newCategory.subcategories.includes(market.suggestedSubcategory)) {
                market.suggestedSubcategory = '';
            }
        }

        closeCategoryDropdown();
        updateCategoryFilter();
        renderContent();
    }
}

function saveCustomCategory(marketId, field) {
    const input = document.getElementById('customCategoryInput');
    const value = input.value.trim();

    if (value) {
        const sport = sportsData[currentSport];
        const market = sport.markets.find(m => m.id === marketId);

        if (market) {
            market[field] = value;

            // Add to suggestedCategories if it's a new category
            if (field === 'suggestedCategory') {
                const exists = sport.suggestedCategories.find(c => c.name === value);
                if (!exists) {
                    sport.suggestedCategories.push({ name: value, subcategories: [] });
                }
            }

            closeCategoryDropdown();
            updateCategoryFilter();
            renderContent();
        }
    }
}

function closeCategoryDropdown() {
    const dropdown = document.getElementById('categoryDropdown');
    const overlay = document.getElementById('dropdownOverlay');

    if (dropdown) dropdown.remove();
    if (overlay) overlay.remove();
}

// Export functions
function exportData() {
    // Ensure all categories have order set before exporting
    Object.values(sportsData).forEach(sport => {
        sport.suggestedCategories.forEach((cat, idx) => {
            if (cat.order === undefined) cat.order = idx;
        });
        // Sort categories by order and re-index
        sport.suggestedCategories.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
        sport.suggestedCategories.forEach((cat, idx) => {
            cat.order = idx;
        });
    });

    const exportObj = {
        exportDate: new Date().toISOString(),
        sports: sportsData
    };

    const dataStr = JSON.stringify(exportObj, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `market-config-${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);
}

function exportCSV() {
    const sport = sportsData[currentSport];
    let csv = '';

    // === MARKETS SECTION ===
    csv += '=== MARKETS ===\n';
    csv += 'Market Name,Display Name,Sportsradar Type,Suggested Category,Suggested Subcategory,Active\n';

    sport.markets.forEach(market => {
        const displayName = market.displayName || '';
        csv += `"${market.specificMarket}","${displayName}","${market.sportsradarType}","${market.suggestedCategory}","${market.suggestedSubcategory || ''}","${market.active}"\n`;
    });

    // === CATEGORIES SECTION ===
    csv += '\n=== CATEGORIES ===\n';
    csv += 'Order,Category Name,Subcategories\n';

    // Sort categories by order
    const sortedCategories = [...sport.suggestedCategories].sort((a, b) => {
        const orderA = a.order ?? 999;
        const orderB = b.order ?? 999;
        return orderA - orderB;
    });

    sortedCategories.forEach((cat, index) => {
        const subcats = cat.subcategories.join('; ');
        csv += `${index + 1},"${cat.name}","${subcats}"\n`;
    });

    // === MARKET ORDER BY CATEGORY SECTION ===
    csv += '\n=== MARKET ORDER BY CATEGORY ===\n';
    csv += 'Category,Order,Market Name,Display Name\n';

    sortedCategories.forEach(cat => {
        // Get markets in this category, preserving their array order
        const categoryMarkets = sport.markets.filter(m => m.suggestedCategory === cat.name);
        categoryMarkets.forEach((market, index) => {
            const displayName = market.displayName || '';
            csv += `"${cat.name}",${index + 1},"${market.specificMarket}","${displayName}"\n`;
        });
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSport}-markets-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    URL.revokeObjectURL(url);
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target.result);
                if (imported.sports) {
                    Object.assign(sportsData, imported.sports);
                    initializeSportList();
                    updateStats();
                    updateCategoryFilter();
                    renderContent();
                    alert('Data imported successfully!');
                }
            } catch (err) {
                alert('Error importing file: ' + err.message);
            }
        };

        reader.readAsText(file);
    };

    input.click();
}

// Category dropdown change handler for market modal
document.getElementById('marketCategory')?.addEventListener('change', function() {
    updateSubcategoryDropdown(this.value);
});

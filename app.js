// Application State
let currentSport = 'football';
let currentView = 'cards';
let filteredMarkets = [];
let editingMarketId = null;

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
    const categories = [...new Set(sport.markets.map(m => m.suggestedCategory))].length;

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
        <div class="stat-card">
            <div class="stat-value" style="color: #1d9bf0">${categories}</div>
            <div class="stat-label">Categories</div>
        </div>
    `;
}

// Update category filter dropdown
function updateCategoryFilter() {
    const sport = sportsData[currentSport];
    const categories = [...new Set(sport.markets.map(m => m.suggestedCategory))].sort();

    const categoryFilter = document.getElementById('categoryFilter');
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    categories.forEach(cat => {
        if (cat) {
            categoryFilter.innerHTML += `<option value="${cat}">${cat}</option>`;
        }
    });
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
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;

    filteredMarkets = sport.markets.filter(market => {
        const matchesSearch = market.specificMarket.toLowerCase().includes(searchTerm) ||
                            market.sportsradarType.toLowerCase().includes(searchTerm) ||
                            market.suggestedCategory.toLowerCase().includes(searchTerm);

        const matchesStatus = statusFilter === 'all' ||
                            (statusFilter === 'active' && market.active) ||
                            (statusFilter === 'inactive' && !market.active);

        const matchesCategory = categoryFilter === 'all' || market.suggestedCategory === categoryFilter;

        return matchesSearch && matchesStatus && matchesCategory;
    });

    renderContent();
}

// Render content based on current view
function renderContent() {
    const contentArea = document.getElementById('contentArea');
    const sport = sportsData[currentSport];

    // Apply filters
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;

    filteredMarkets = sport.markets.filter(market => {
        const matchesSearch = !searchTerm ||
                            market.specificMarket.toLowerCase().includes(searchTerm) ||
                            market.sportsradarType.toLowerCase().includes(searchTerm) ||
                            market.suggestedCategory.toLowerCase().includes(searchTerm);

        const matchesStatus = statusFilter === 'all' ||
                            (statusFilter === 'active' && market.active) ||
                            (statusFilter === 'inactive' && !market.active);

        const matchesCategory = categoryFilter === 'all' || market.suggestedCategory === categoryFilter;

        return matchesSearch && matchesStatus && matchesCategory;
    });

    switch (currentView) {
        case 'cards':
            renderCardsView(contentArea);
            break;
        case 'table':
            renderTableView(contentArea);
            break;
        case 'comparison':
            renderComparisonView(contentArea);
            break;
    }
}

// Render cards view
function renderCardsView(container) {
    const sport = sportsData[currentSport];

    // Group markets by suggested category
    const groupedMarkets = {};

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

    let html = `
        <div class="view-info">
            <span class="info-icon">ℹ️</span>
            <span>Showing <strong>Suggested Categories</strong> — drag markets between categories to reorganize</span>
        </div>
        <div class="categories-container">
    `;

    Object.entries(groupedMarkets).sort().forEach(([category, markets]) => {
        html += `
            <div class="category-card" data-category="${category}">
                <div class="category-header">
                    <div class="category-title">
                        ${category}
                        <span class="category-count">${markets.length}</span>
                    </div>
                    <div class="category-actions">
                        <button class="icon-btn" onclick="editCategory('${category}')" title="Edit category">✏️</button>
                    </div>
                </div>
                <div class="market-list" ondragover="handleDragOver(event)" ondrop="handleDrop(event, '${category}')">
        `;

        if (markets.length === 0) {
            html += `
                <div class="empty-category-message">
                    Drag markets here
                </div>
            `;
        } else {
            markets.forEach(market => {
                html += `
                    <div class="market-item ${market.active ? '' : 'inactive'}"
                         draggable="true"
                         data-id="${market.id}"
                         ondragstart="handleDragStart(event)"
                         ondragend="handleDragEnd(event)"
                         onclick="openMarketModal('${market.id}')">
                        <span class="market-name">${market.specificMarket}</span>
                        <div class="market-badges">
                            ${market.suggestedSubcategory ? `<span class="badge badge-subcategory">${market.suggestedSubcategory}</span>` : ''}
                            <span class="badge ${market.active ? 'badge-active' : 'badge-inactive'}">
                                ${market.active ? 'Active' : 'Inactive'}
                            </span>
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
                </div>
    `;

    filteredMarkets.forEach((market, index) => {
        html += `
            <div class="table-row" data-id="${market.id}">
                <div class="row-number">${index + 1}</div>
                <div>${market.specificMarket}</div>
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

    html = `
        <div class="comparison-view">
            <div class="comparison-panel">
                <div class="comparison-header current">
                    Your Current Categories
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

        <h3 style="margin: 30px 0 20px; color: #71767b">Suggested Categories Based on Competitor Analysis</h3>

        <div class="comparison-view">
            <div class="comparison-panel">
                <div class="comparison-header suggested" style="border-left-color: #1d9bf0">
                    Suggested New Categories
                </div>
                <div class="market-list">
    `;

    sport.suggestedCategories.forEach(cat => {
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

// Toggle market active status
function toggleMarketActive(marketId) {
    const sport = sportsData[currentSport];
    const market = sport.markets.find(m => m.id === marketId);
    if (market) {
        market.active = !market.active;
        updateStats();
        // Don't re-render to avoid losing scroll position
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
    const market = sport.markets.find(m => m.id === marketId);

    if (!market) return;

    document.getElementById('marketName').value = market.specificMarket;
    document.getElementById('marketSportsradarType').value = market.sportsradarType;
    document.getElementById('marketCurrentCategory').value = getCurrentCategory(market) || '-';
    document.getElementById('marketActive').value = market.active.toString();

    // Populate category dropdown
    const categorySelect = document.getElementById('marketCategory');
    const categories = [...new Set(sport.markets.map(m => m.suggestedCategory))].filter(c => c).sort();
    categorySelect.innerHTML = categories.map(cat =>
        `<option value="${cat}" ${cat === market.suggestedCategory ? 'selected' : ''}>${cat}</option>`
    ).join('');

    // Populate subcategory dropdown
    updateSubcategoryDropdown(market.suggestedCategory, market.suggestedSubcategory);

    document.getElementById('marketModal').classList.add('active');
}

function updateSubcategoryDropdown(category, selectedSubcategory = '') {
    const sport = sportsData[currentSport];
    const subcategorySelect = document.getElementById('marketSubcategory');

    // Get subcategories from suggested categories
    const catConfig = sport.suggestedCategories.find(c => c.name === category);
    const subcategories = catConfig ? catConfig.subcategories : [];

    subcategorySelect.innerHTML = '<option value="">None</option>';
    subcategories.forEach(sub => {
        subcategorySelect.innerHTML += `<option value="${sub}" ${sub === selectedSubcategory ? 'selected' : ''}>${sub}</option>`;
    });
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
    let csv = 'Market Name,Sportsradar Type,Suggested Category,Suggested Subcategory,Active\n';

    sport.markets.forEach(market => {
        csv += `"${market.specificMarket}","${market.sportsradarType}","${market.suggestedCategory}","${market.suggestedSubcategory}","${market.active}"\n`;
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

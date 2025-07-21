let currentList = null;
let currentInventory = [];
let filterSettings = {
    inProgress: true,
    completed: true,
    normal: true,
    ac: true,
    legend: true,
    seasonal: true,
    drop: true,
    quest: true,
    merge: true
};

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadFarmLists();
    updateStats();
    setupFilters();
    setupEventListeners();
    
    // Load current inventory if available
    chrome.storage.local.get(['lastFoundItems'], function(result) {
        if (result.lastFoundItems) {
            currentInventory = result.lastFoundItems;
            console.log('Loaded inventory:', currentInventory.length, 'items');
        }
    });
});

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Navigation buttons
    const toFarmPageBtn = document.getElementById('toFarmPageBtn');
    if (toFarmPageBtn) {
        toFarmPageBtn.addEventListener('click', goToFarmPage);
        console.log('To Farm Page button listener added');
    } else {
        console.warn('To Farm Page button not found');
    }
    
    const backToWikiBtn = document.getElementById('backToWikiBtn');
    if (backToWikiBtn) {
        backToWikiBtn.addEventListener('click', goToMainWiki);
        console.log('Back to Wiki button listener added');
    } else {
        console.warn('Back to Wiki button not found');
    }
    
    // Create list button
    const createListBtn = document.getElementById('createListBtn');
    if (createListBtn) {
        createListBtn.addEventListener('click', createNewList);
        console.log('Create List button listener added');
    } else {
        console.warn('Create List button not found');
    }
    
    // Add item button
    const addItemBtn = document.getElementById('addItemBtn');
    if (addItemBtn) {
        addItemBtn.addEventListener('click', addItemToCurrentList);
        console.log('Add Item button listener added');
    } else {
        console.warn('Add Item button not found');
    }
    
    // Import from wiki button
    const importFromWikiBtn = document.getElementById('importFromWikiBtn');
    if (importFromWikiBtn) {
        importFromWikiBtn.addEventListener('click', importFromWiki);
        console.log('Import from Wiki button listener added');
    } else {
        console.warn('Import from Wiki button not found');
    }
    
    console.log('All static event listeners set up');
}

// Navigation functions
function goToFarmPage() {
    window.location.href = chrome.runtime.getURL("tofarm.html");
}

function goToMainWiki() {
    // Get the last wiki page from storage or default
    chrome.storage.local.get({lastWikiPage: "http://aqwwiki.wikidot.com/"}, function(result) {
        window.location.href = result.lastWikiPage;
    });
}

// Make navigation functions globally available
window.goToFarmPage = goToFarmPage;
window.goToMainWiki = goToMainWiki;

function setupFilters() {
    const filterCheckboxes = [
        'filterInProgress', 'filterCompleted', 'filterNormal', 'filterAC', 'filterLegend',
        'filterSeasonal', 'filterDrop', 'filterQuest', 'filterMerge'
    ];
    
    filterCheckboxes.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', function() {
                const filterType = id.replace('filter', '').toLowerCase();
                if (filterType === 'inprogress') {
                    filterSettings.inProgress = this.checked;
                } else if (filterType === 'completed') {
                    filterSettings.completed = this.checked;
                } else {
                    filterSettings[filterType] = this.checked;
                }
                if (currentList) {
                    displayListItems(currentList);
                }
            });
        }
    });
}

function createNewList() {
    const listName = document.getElementById('listName').value.trim();
    if (!listName) {
        alert('Please enter a list name');
        return;
    }
    
    chrome.storage.local.get(['customFarmLists'], function(result) {
        const farmLists = result.customFarmLists || {};
        
        if (farmLists[listName]) {
            alert('A list with this name already exists');
            return;
        }
        
        farmLists[listName] = {
            name: listName,
            items: [],
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        };
        
        chrome.storage.local.set({customFarmLists: farmLists}, function() {
            document.getElementById('listName').value = '';
            loadFarmLists();
            updateStats();
            selectList(listName);
        });
    });
}

function loadFarmLists() {
    chrome.storage.local.get(['customFarmLists'], function(result) {
        const farmLists = result.customFarmLists || {};
        const listsDiv = document.getElementById('farmLists');
        
        if (Object.keys(farmLists).length === 0) {
            listsDiv.innerHTML = '<p style="color: #b3a082;">No farm lists created yet. Create your first list above!</p>';
            return;
        }
        
        let html = '';
        Object.keys(farmLists).forEach(listName => {
            const list = farmLists[listName];
            const itemCount = list.items ? list.items.length : 0;
            const completedCount = list.items ? list.items.filter(item => item.status === 'done').length : 0;
            const progressPercent = itemCount > 0 ? Math.round((completedCount / itemCount) * 100) : 0;
            
            html += `
                <div class="list-item" data-list-name="${listName}">
                    <div class="list-header">
                        <strong>${listName}</strong>
                        <button class="delete-btn" data-list-name="${listName}" title="Delete List">×</button>
                    </div>
                    <div class="list-info">
                        <span>${itemCount} items</span>
                        <span>${completedCount}/${itemCount} completed (${progressPercent}%)</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                </div>
            `;
        });
        
        listsDiv.innerHTML = html;
        
        // Add event listeners after HTML is inserted
        setTimeout(() => {
            // Add event listeners for list selection
            document.querySelectorAll('.list-item').forEach(item => {
                item.addEventListener('click', function(e) {
                    // Don't trigger if clicking the delete button
                    if (e.target.classList.contains('delete-btn')) {
                        return;
                    }
                    const listName = this.getAttribute('data-list-name');
                    console.log('Selecting list:', listName);
                    selectList(listName);
                });
            });
            
            // Add event listeners for delete buttons
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const listName = this.getAttribute('data-list-name');
                    console.log('Deleting list:', listName);
                    deleteList(listName);
                });
            });
            
            console.log('List event listeners attached');
        }, 10);
    });
}

function selectList(listName) {
    chrome.storage.local.get(['customFarmLists'], function(result) {
        const farmLists = result.customFarmLists || {};
        currentList = farmLists[listName];
        
        if (!currentList) return;
        
        // Ensure the currentList has the name property
        currentList.name = listName;
        
        document.getElementById('currentListTitle').textContent = listName;
        document.getElementById('addItemSection').style.display = 'block';
        document.getElementById('filterSection').style.display = 'block';
        
        displayListItems(currentList);
        
        // Highlight selected list
        document.querySelectorAll('.list-item').forEach(item => {
            item.classList.remove('selected');
        });
        // Find the clicked list item
        const listItems = document.querySelectorAll('.list-item');
        listItems.forEach(item => {
            if (item.textContent.includes(listName)) {
                item.classList.add('selected');
            }
        });
    });
}

function displayListItems(list) {
    const itemsDiv = document.getElementById('currentListItems');
    
    if (!list.items || list.items.length === 0) {
        itemsDiv.innerHTML = '<p style="color: #b3a082;">No items in this list yet. Add some items below!</p>';
        return;
    }
    
    // Filter items based on current filter settings
    const filteredItems = list.items.filter(item => {
        // Status filter
        if (item.status === 'done' && !filterSettings.completed) return false;
        if (item.status !== 'done' && !filterSettings.inProgress) return false;
        
        // Tag filters
        if (item.tags) {
            if (item.tags.includes('normal') && !filterSettings.normal) return false;
            if (item.tags.includes('ac') && !filterSettings.ac) return false;
            if (item.tags.includes('legend') && !filterSettings.legend) return false;
            if (item.tags.includes('seasonal') && !filterSettings.seasonal) return false;
            if (item.tags.includes('drop') && !filterSettings.drop) return false;
            if (item.tags.includes('quest') && !filterSettings.quest) return false;
            if (item.tags.includes('merge') && !filterSettings.merge) return false;
        } else {
            // If no tags, consider it as normal item
            if (!filterSettings.normal) return false;
        }
        
        return true;
    });
    
    if (filteredItems.length === 0) {
        itemsDiv.innerHTML = '<p style="color: #b3a082;">No items match the current filters.</p>';
        return;
    }
    
    let html = '<div class="items-grid">';
    
    filteredItems.forEach((item, index) => {
        const isCompleted = item.status === 'done';
        const statusClass = isCompleted ? 'item-completed' : 'item-in-progress';
        const statusText = isCompleted ? 'Completed' : 'In Progress';
        
        // Generate tag icons
        let tagIcons = '';
        if (item.tags && item.tags.length > 0) {
            item.tags.forEach(tag => {
                switch(tag) {
                    case 'normal':
                        tagIcons += '<img src="images/normal_icon.png" title="Normal Item" class="tag-icon">';
                        break;
                    case 'ac':
                        tagIcons += '<img src="http://aqwwiki.wdfiles.com/local--files/image-tags/aclarge.png" title="AC Item" class="tag-icon">';
                        break;
                    case 'legend':
                        tagIcons += '<img src="http://aqwwiki.wdfiles.com/local--files/image-tags/legendlarge.png" title="Legend Item" class="tag-icon">';
                        break;
                    case 'seasonal':
                        tagIcons += '<img src="images/treasurechest_icon.png" title="Seasonal Item" class="tag-icon">';
                        break;
                    case 'drop':
                        tagIcons += '<img src="images/monster_drop.png" title="Monster Drop" class="tag-icon">';
                        break;
                    case 'quest':
                        tagIcons += '<img src="images/quest_icon.png" title="Quest Item" class="tag-icon">';
                        break;
                    case 'merge':
                        tagIcons += '<img src="images/mergeshop_icon.png" title="Merge Shop Item" class="tag-icon">';
                        break;
                }
            });
        } else {
            // Default to normal item if no tags
            tagIcons += '<img src="images/normal_icon.png" title="Normal Item" class="tag-icon">';
        }
        
        html += `
            <div class="farm-item ${statusClass}">
                <div class="item-header">
                    <strong>${item.name}</strong>
                    <div class="item-actions">
                        <button class="toggle-status-btn" data-item-name="${item.name}" title="Toggle Status">
                            ${isCompleted ? '↺' : '✓'}
                        </button>
                        <button class="delete-btn" data-item-name="${item.name}" title="Remove Item">×</button>
                    </div>
                </div>
                <div class="item-details">
                    <div class="item-status ${isCompleted ? 'status-completed' : 'status-in-progress'}">
                        ${statusText}
                    </div>
                    ${tagIcons}
                </div>
                ${item.source ? `<div class="item-source"><strong>Source:</strong> ${item.source}</div>` : ''}
                ${item.notes ? `<div class="item-notes"><strong>Notes:</strong> ${item.notes}</div>` : ''}
                ${item.addedDate ? `<div class="item-date">Added: ${new Date(item.addedDate).toLocaleDateString()}</div>` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    itemsDiv.innerHTML = html;
    
    // Add event listeners for item buttons
    setTimeout(() => {
        document.querySelectorAll('.toggle-status-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemName = this.getAttribute('data-item-name');
                console.log('Toggling status for:', itemName);
                toggleItemStatus(itemName);
            });
        });
        
        document.querySelectorAll('.farm-item .delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemName = this.getAttribute('data-item-name');
                console.log('Removing item:', itemName);
                removeItemFromList(itemName);
            });
        });
        
        console.log('Item event listeners attached');
    }, 10);
}

function toggleItemStatus(itemName) {
    if (!currentList) return;
    
    const item = currentList.items.find(i => i.name === itemName);
    if (!item) return;
    
    item.status = item.status === 'done' ? 'in-progress' : 'done';
    item.updatedDate = new Date().toISOString();
    
    // Update storage
    chrome.storage.local.get(['customFarmLists'], function(result) {
        const farmLists = result.customFarmLists || {};
        farmLists[currentList.name] = currentList;
        
        chrome.storage.local.set({customFarmLists: farmLists}, function() {
            displayListItems(currentList);
            loadFarmLists(); // Refresh list display with updated progress
            updateStats();
        });
    });
}

function removeItemFromList(itemName) {
    if (!currentList) return;
    
    if (!confirm(`Remove "${itemName}" from this list?`)) return;
    
    currentList.items = currentList.items.filter(item => item.name !== itemName);
    currentList.updated = new Date().toISOString();
    
    chrome.storage.local.get(['customFarmLists'], function(result) {
        const farmLists = result.customFarmLists || {};
        farmLists[currentList.name] = currentList;
        
        chrome.storage.local.set({customFarmLists: farmLists}, function() {
            displayListItems(currentList);
            loadFarmLists();
            updateStats();
        });
    });
}

function addItemToCurrentList() {
    if (!currentList) {
        alert('Please select a list first');
        return;
    }
    
    const itemName = document.getElementById('itemName').value.trim();
    if (!itemName) {
        alert('Please enter an item name');
        return;
    }
    
    // Check if item already exists
    if (currentList.items.some(item => item.name.toLowerCase() === itemName.toLowerCase())) {
        alert('This item is already in the list');
        return;
    }
    
    const itemSource = document.getElementById('itemSource').value.trim();
    const itemNotes = document.getElementById('itemNotes').value.trim();
    
    const newItem = {
        name: itemName,
        source: itemSource,
        notes: itemNotes,
        status: 'in-progress',
        addedDate: new Date().toISOString(),
        tags: [] // Will be populated by auto-detection if available
    };
    
    // Auto-detect tags based on source
    if (itemSource.toLowerCase().includes('ac') || itemSource.toLowerCase().includes('adventurecoin')) {
        newItem.tags.push('ac');
    }
    if (itemSource.toLowerCase().includes('merge')) {
        newItem.tags.push('merge');
    }
    if (itemSource.toLowerCase().includes('quest')) {
        newItem.tags.push('quest');
    }
    if (itemSource.toLowerCase().includes('drop') || itemSource.toLowerCase().includes('monster')) {
        newItem.tags.push('drop');
    }
    
    currentList.items.push(newItem);
    currentList.updated = new Date().toISOString();
    
    chrome.storage.local.get(['customFarmLists'], function(result) {
        const farmLists = result.customFarmLists || {};
        farmLists[currentList.name] = currentList;
        
        chrome.storage.local.set({customFarmLists: farmLists}, function() {
            // Clear form
            document.getElementById('itemName').value = '';
            document.getElementById('itemSource').value = '';
            document.getElementById('itemNotes').value = '';
            
            displayListItems(currentList);
            loadFarmLists();
            updateStats();
        });
    });
}

function deleteList(listName) {
    if (!confirm(`Delete the list "${listName}" and all its items?`)) return;
    
    chrome.storage.local.get(['customFarmLists'], function(result) {
        const farmLists = result.customFarmLists || {};
        delete farmLists[listName];
        
        chrome.storage.local.set({customFarmLists: farmLists}, function() {
            if (currentList && currentList.name === listName) {
                currentList = null;
                document.getElementById('currentListTitle').textContent = 'Select a list to view items';
                document.getElementById('currentListItems').innerHTML = '';
                document.getElementById('addItemSection').style.display = 'none';
                document.getElementById('filterSection').style.display = 'none';
            }
            
            loadFarmLists();
            updateStats();
        });
    });
}

function updateStats() {
    chrome.storage.local.get(['customFarmLists'], function(result) {
        const farmLists = result.customFarmLists || {};
        const listCount = Object.keys(farmLists).length;
        let totalItems = 0;
        let inProgressItems = 0;
        let completedItems = 0;
        
        Object.values(farmLists).forEach(list => {
            if (list.items) {
                totalItems += list.items.length;
                inProgressItems += list.items.filter(item => item.status !== 'done').length;
                completedItems += list.items.filter(item => item.status === 'done').length;
            }
        });
        
        document.getElementById('totalLists').textContent = listCount;
        document.getElementById('totalItems').textContent = totalItems;
        document.getElementById('inProgressItems').textContent = inProgressItems;
        document.getElementById('completedItems').textContent = completedItems;
    });
}

function checkInventoryStatus() {
    if (!currentList || !currentInventory || currentInventory.length === 0) {
        alert('No inventory data available. Please visit a wiki page first to load your inventory.');
        return;
    }
    
    let updatedCount = 0;
    
    currentList.items.forEach(item => {
        if (item.status !== 'done') {
            // Check if item is in inventory
            const foundInInventory = currentInventory.some(invItem => 
                invItem.toLowerCase().includes(item.name.toLowerCase()) ||
                item.name.toLowerCase().includes(invItem.toLowerCase())
            );
            
            if (foundInInventory) {
                item.status = 'done';
                item.updatedDate = new Date().toISOString();
                updatedCount++;
            }
        }
    });
    
    if (updatedCount > 0) {
        chrome.storage.local.get(['customFarmLists'], function(result) {
            const farmLists = result.customFarmLists || {};
            farmLists[currentList.name] = currentList;
            
            chrome.storage.local.set({customFarmLists: farmLists}, function() {
                displayListItems(currentList);
                loadFarmLists();
                updateStats();
                alert(`Updated ${updatedCount} items to completed status based on your inventory!`);
            });
        });
    } else {
        alert('No progress updates needed - all owned items are already marked as completed.');
    }
}

function importFromWiki() {
    // This will be implemented to import items from the current wiki page
    alert('This feature will import items from the currently open wiki page. Feature coming soon!');
}

// Make all functions globally available for debugging and compatibility
window.createNewList = createNewList;
window.loadFarmLists = loadFarmLists;
window.selectList = selectList;
window.displayListItems = displayListItems;
window.toggleItemStatus = toggleItemStatus;
window.removeItemFromList = removeItemFromList;
window.addItemToCurrentList = addItemToCurrentList;
window.deleteList = deleteList;
window.updateStats = updateStats;
window.checkInventoryStatus = checkInventoryStatus;
window.importFromWiki = importFromWiki;

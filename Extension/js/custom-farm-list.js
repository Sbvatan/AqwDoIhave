// Custom Farm List Management

let currentSelectedList = null;
let farmLists = {};

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadFarmLists();
    displayFarmLists();
    updateStats();
});

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

// Load farm lists from storage
function loadFarmLists() {
    chrome.storage.local.get({customFarmLists: {}}, function(result) {
        farmLists = result.customFarmLists;
        displayFarmLists();
        updateStats();
    });
}

// Save farm lists to storage
function saveFarmLists() {
    chrome.storage.local.set({customFarmLists: farmLists}, function() {
        console.log('Farm lists saved');
        updateStats();
    });
}

// Create a new farm list
function createNewList() {
    const listName = document.getElementById('listName').value.trim();
    if (!listName) {
        alert('Please enter a list name');
        return;
    }
    
    if (farmLists[listName]) {
        alert('A list with this name already exists');
        return;
    }
    
    farmLists[listName] = {
        items: [],
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
    };
    
    saveFarmLists();
    displayFarmLists();
    document.getElementById('listName').value = '';
    selectList(listName);
}

// Display all farm lists
function displayFarmLists() {
    const container = document.getElementById('farmLists');
    container.innerHTML = '';
    
    const listNames = Object.keys(farmLists);
    if (listNames.length === 0) {
        container.innerHTML = '<p style="color: #888; text-align: center;">No farm lists created yet</p>';
        return;
    }
    
    listNames.forEach(listName => {
        const listDiv = document.createElement('div');
        listDiv.className = 'list-item';
        if (currentSelectedList === listName) {
            listDiv.classList.add('selected');
        }
        
        listDiv.innerHTML = `
            <div>
                <strong>${listName}</strong>
                <br>
                <small>${farmLists[listName].items.length} items</small>
            </div>
            <button class="delete-btn" onclick="deleteList('${listName}')" title="Delete List">×</button>
        `;
        
        listDiv.onclick = (e) => {
            if (e.target.classList.contains('delete-btn')) return;
            selectList(listName);
        };
        
        container.appendChild(listDiv);
    });
}

// Select a farm list
function selectList(listName) {
    currentSelectedList = listName;
    displayFarmLists(); // Refresh to show selection
    displayCurrentListItems();
    document.getElementById('addItemSection').style.display = 'block';
    document.getElementById('currentListTitle').textContent = `Items in "${listName}"`;
}

// Display items in the currently selected list
function displayCurrentListItems() {
    const container = document.getElementById('currentListItems');
    
    if (!currentSelectedList || !farmLists[currentSelectedList]) {
        container.innerHTML = '<p style="color: #888;">No list selected</p>';
        return;
    }
    
    const items = farmLists[currentSelectedList].items;
    container.innerHTML = '';
    
    if (items.length === 0) {
        container.innerHTML = '<p style="color: #888;">No items in this list yet</p>';
        return;
    }
    
    items.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'farm-item';
        
        itemDiv.innerHTML = `
            <div>
                <strong>${item.name}</strong>
                ${item.source ? `<br><small>Source: ${item.source}</small>` : ''}
                ${item.notes ? `<br><small>Notes: ${item.notes}</small>` : ''}
                ${item.obtained ? '<br><small style="color: #4CAF50;">✓ Obtained</small>' : '<br><small style="color: #f44336;">✗ Not obtained</small>'}
            </div>
            <div>
                <button class="delete-btn" onclick="toggleItemObtained(${index})" title="Toggle Obtained">
                    ${item.obtained ? '✓' : '○'}
                </button>
                <button class="delete-btn" onclick="removeItemFromList(${index})" title="Remove Item">×</button>
            </div>
        `;
        
        container.appendChild(itemDiv);
    });
}

// Add item to current list
function addItemToCurrentList() {
    if (!currentSelectedList) {
        alert('Please select a list first');
        return;
    }
    
    const itemName = document.getElementById('itemName').value.trim();
    const itemSource = document.getElementById('itemSource').value.trim();
    const itemNotes = document.getElementById('itemNotes').value.trim();
    
    if (!itemName) {
        alert('Please enter an item name');
        return;
    }
    
    // Check if item already exists in the list
    const existingItem = farmLists[currentSelectedList].items.find(item => 
        item.name.toLowerCase() === itemName.toLowerCase()
    );
    
    if (existingItem) {
        alert('This item is already in the list');
        return;
    }
    
    const newItem = {
        name: itemName,
        source: itemSource,
        notes: itemNotes,
        obtained: false,
        added: new Date().toISOString()
    };
    
    farmLists[currentSelectedList].items.push(newItem);
    farmLists[currentSelectedList].lastModified = new Date().toISOString();
    
    saveFarmLists();
    displayCurrentListItems();
    displayFarmLists(); // Update item count
    
    // Clear form
    document.getElementById('itemName').value = '';
    document.getElementById('itemSource').value = '';
    document.getElementById('itemNotes').value = '';
}

// Remove item from list
function removeItemFromList(index) {
    if (!currentSelectedList) return;
    
    if (confirm('Are you sure you want to remove this item?')) {
        farmLists[currentSelectedList].items.splice(index, 1);
        farmLists[currentSelectedList].lastModified = new Date().toISOString();
        saveFarmLists();
        displayCurrentListItems();
        displayFarmLists(); // Update item count
    }
}

// Toggle item obtained status
function toggleItemObtained(index) {
    if (!currentSelectedList) return;
    
    farmLists[currentSelectedList].items[index].obtained = !farmLists[currentSelectedList].items[index].obtained;
    farmLists[currentSelectedList].lastModified = new Date().toISOString();
    saveFarmLists();
    displayCurrentListItems();
}

// Delete a farm list
function deleteList(listName) {
    if (confirm(`Are you sure you want to delete the list "${listName}"?`)) {
        delete farmLists[listName];
        if (currentSelectedList === listName) {
            currentSelectedList = null;
            document.getElementById('addItemSection').style.display = 'none';
            document.getElementById('currentListTitle').textContent = 'Select a list to view items';
            displayCurrentListItems();
        }
        saveFarmLists();
        displayFarmLists();
    }
}

// Update statistics
function updateStats() {
    const totalLists = Object.keys(farmLists).length;
    let totalItems = 0;
    
    Object.values(farmLists).forEach(list => {
        totalItems += list.items.length;
    });
    
    document.getElementById('totalLists').textContent = totalLists;
    document.getElementById('totalItems').textContent = totalItems;
}

// Import items from current wiki page (if available)
function importFromWiki() {
    if (!currentSelectedList) {
        alert('Please select a list first');
        return;
    }
    
    // Get items from the main extension's found items
    chrome.storage.local.get({lastFoundItems: []}, function(result) {
        const foundItems = result.lastFoundItems;
        
        if (!foundItems || foundItems.length === 0) {
            alert('No items found to import. Please visit a wiki page with items first.');
            return;
        }
        
        let importedCount = 0;
        foundItems.forEach(itemName => {
            // Check if item already exists
            const existingItem = farmLists[currentSelectedList].items.find(item => 
                item.name.toLowerCase() === itemName.toLowerCase()
            );
            
            if (!existingItem) {
                const newItem = {
                    name: itemName,
                    source: 'Imported from wiki',
                    notes: '',
                    obtained: false,
                    added: new Date().toISOString()
                };
                
                farmLists[currentSelectedList].items.push(newItem);
                importedCount++;
            }
        });
        
        if (importedCount > 0) {
            farmLists[currentSelectedList].lastModified = new Date().toISOString();
            saveFarmLists();
            displayCurrentListItems();
            displayFarmLists();
            alert(`Imported ${importedCount} items from wiki page`);
        } else {
            alert('No new items to import (all items already in list)');
        }
    });
}

// Export functions for integration with other pages
window.getFarmLists = function() {
    return farmLists;
};

window.addToFarmList = function(listName, itemName, source = '', notes = '') {
    if (!farmLists[listName]) {
        return false;
    }
    
    const existingItem = farmLists[listName].items.find(item => 
        item.name.toLowerCase() === itemName.toLowerCase()
    );
    
    if (existingItem) {
        return false; // Item already exists
    }
    
    const newItem = {
        name: itemName,
        source: source,
        notes: notes,
        obtained: false,
        added: new Date().toISOString()
    };
    
    farmLists[listName].items.push(newItem);
    farmLists[listName].lastModified = new Date().toISOString();
    saveFarmLists();
    return true;
};

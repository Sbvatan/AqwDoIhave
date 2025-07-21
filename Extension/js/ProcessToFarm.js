// Whole Wiki Pre processed using python script 

// How it looks?
//
//	{Name}: [Data]
//
//	Data:
//		0 - Type >> Item/Monster/Location 
//		1 - href >> Link To Item 
//      2 - >> 
var ac_large = "http://aqwwiki.wdfiles.com/local--files/image-tags/aclarge.png"
var rare_large = "http://aqwwiki.wdfiles.com/local--files/image-tags/rarelarge.png"
var seasonal_large = "http://aqwwiki.wdfiles.com/local--files/image-tags/seasonallarge.png"
var legend_large = "http://aqwwiki.wdfiles.com/local--files/image-tags/legendlarge.png"



function getJson(theUrl)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false ); 
	xmlHttp.send(null);
    return JSON.parse(xmlHttp.responseText)
}

var items_json = getJson(chrome.runtime.getURL("data/WikiItems.json"))
var wiki_exclude_suffixes = getJson(chrome.runtime.getURL("data/wiki_exclude_suffixes.json"))



async function add_to_table(table,item_name,item_details, av_item_count, avaliableItemsElement){
	let tr = document.createElement("tr") 
	let td_1 = document.createElement("td")
	let td_2 = document.createElement("td")
	let td_3 = document.createElement("td")
	let td_4 = document.createElement("td") // New column for actions
	av_item_count+=1
	
	// Make item name a link to wiki page for hover preview functionality
	const wikiUrl = `http://aqwwiki.wikidot.com/${item_name.replace(/\s+/g, '-').toLowerCase()}`;
	td_1.innerHTML = `<a href="${wikiUrl}" target="_blank" style="color: #4da6ff; text-decoration: underline;">${item_name}</a>`
	
	if (item_details[1][1][0] == "Drop" || item_details[1][1][0] == "Quest" ) {
		if  (item_details[1][1][1] !== "") {
			td_2.innerHTML = "<a href='http://aqwwiki.wikidot.com/"+item_details[1][1][2]+"'>"+item_details[1][1][1]+"</a>"
			
		} else {
			td_2.innerHTML = item_details[1][1][1][0]
		}
	}
	else if (item_details[1][1][0] == "Merge") {
		td_2.innerHTML = "<a href='http://aqwwiki.wikidot.com"+item_details[1][1][2]+"'>"+item_details[1][1][1]+"</a>"
	}
	else {
		td_2.innerHTML = "N/A"
	}
	
	// Monster Drop Icon
	if (item_details[1][1][0] == "Drop") {
		td_3.innerHTML = td_3.innerHTML + "<img style='height:20px' src='"+drop_icon+"'></img>"
	}
	// Quest Icon
	if (item_details[1][1][0] == "Quest") {
		td_3.innerHTML = td_3.innerHTML + "<img style='height:20px' src='"+quest_icon+"'></img>"
	}
	// Merge Icon
	if (item_details[1][1][0] == "Merge") {
		td_3.innerHTML = td_3.innerHTML + "<img style='height:20px' src='"+mergeshop_icon+"'></img>"
	}
	// Ac Icon
	if (item_details[6][1] == true) {
		td_3.innerHTML = td_3.innerHTML + "<img style='height:20px' src='"+ac_large+"'></img>"
	}
	// Legend Icon
	if (item_details[7][1] == true) {
		td_3.innerHTML = td_3.innerHTML + "<img style='height:20px' src='"+legend_large+"'></img>"
	}
	// Seasonal Icon
	if (item_details[8][1] == true) {
		td_3.innerHTML = td_3.innerHTML + "<img style='height:20px' src='"+seasonal_large+"'></img>"
	}
	
	// Add to custom farm list button - get source information for better context
	let sourceInfo = "Unknown";
	if (item_details[1][1][0] == "Drop" || item_details[1][1][0] == "Quest" || item_details[1][1][0] == "Merge") {
		sourceInfo = `${item_details[1][1][0]}: ${item_details[1][1][1] || 'Unknown'}`;
	}
	
	// Create detailed item info for better tracking
	const detailedItemInfo = {
		isAc: item_details[6][1] === true,
		isLegend: item_details[7][1] === true,
		isSeasonal: item_details[8][1] === true,
		dropType: item_details[1][1][0]
	};
	
	// Create button with both onclick and event listener approach for better compatibility
	const addListBtn = document.createElement('button');
	addListBtn.innerHTML = '+ List';
	addListBtn.style.cssText = 'background-color: #4CAF50; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px; font-size: 12px;';
	addListBtn.title = 'Add to Custom Farm List';
	addListBtn.setAttribute('data-item-name', item_name);
	addListBtn.setAttribute('data-item-source', sourceInfo);
	
	// Add event listener
	addListBtn.addEventListener('click', function() {
		console.log('Button clicked for:', item_name);
		addToCustomFarmList(item_name, sourceInfo, detailedItemInfo);
	});
	
	td_4.appendChild(addListBtn);
	
	tr.appendChild(td_1)
	tr.appendChild(td_2)
	tr.appendChild(td_3)
	tr.appendChild(td_4)
	table.appendChild(tr)

	
}

function processToFarmItem(item_name,item_details,table) {
	add_to_table(table,item_name,item_details)
}


	
function reProcess_ToFarm_Page() {
	var table_element = document.getElementById("table-content")
	table_element.innerHTML = "" 
	process_ToFarm_Page()
}






function filterItem(item_name, item_data, account_items) {
		// Filters check boxes True/False On/Off
		var Filter_AcItem = document.getElementById("Filter_AcItem").checked 
		var Filter_LegendItem = document.getElementById("Filter_LegendItem").checked 
		var Filter_NormalItem = document.getElementById("Filter_NormalItem").checked 
		var Filter_SeasonalItem = document.getElementById("Filter_SeasonalItem").checked 
		var Filter_MonsterDrop = document.getElementById("Filter_MonsterDrop").checked 
		var Filter_MergeDrop = document.getElementById("Filter_MergeDrop").checked 
		var Filter_QuestDrop = document.getElementById("Filter_QuestDrop").checked 
		
		
		// Gets Tag exclusion from wiki_exclude_suffixes.json and make it smaller to compare with account_items 
		let cq = item_name.toLowerCase()
		for (var i = 0; i < wiki_exclude_suffixes["Excluded"].length; i++) {
			cq = cq.replace(wiki_exclude_suffixes["Excluded"][i].toLowerCase(), "")
		} 
		
		
		
		// Filter Drop Type on if any is TRUE and ITEM is of type it will return False (Skip Item) 
		if (item_data[1][1][0] == "Drop" && Filter_MonsterDrop == false) {
			return false 
		}
		if (item_data[1][1][0] == "Quest" && Filter_QuestDrop == false) {
			return false 
		}
		if (item_data[1][1][0] == "Merge" && Filter_MergeDrop == false) {
			return false 
		}
		
		
		if (item_data[5] != undefined) {
			// item_data[5] if undefined, the object isn't presentable (Item dosen't have data if its AC)
			if (account_items.includes(cq)) {
				
				return false 
				
			} 
			else if (item_data[14] == "necklaces" || item_data[14] == "misc-items") {
				// Exclude Misc Items and Necklaces 
				return false 
			} else if (item_data[8][1] && Filter_SeasonalItem == false) {
				// Seasonal Filter 
				return false 
			} else if (item_data[6][1] == false && Filter_NormalItem == false) { 
					// Ac Filter 
					return false 			
			} 
			
			else if (item_data[5][1] == true) { 
				// Excludes Rare Tag  
					return false 			
			} 
			
			else if (item_data[1][1][0] == "Drop" || item_data[1][1][0] == "Quest" || item_data[1][1][0] == "Merge") {
				if (item_data[1][1][0] == "Merge") {
					if (item_data[1][1][1].includes("Doom Merge")) {
						// Ignore Doom Merge 
						return false 
					} else {
						// Normal Merge Drop Item 
						return true 
					}
				} else if (item_data[1][1][0] == "Quest") {
					if (item_data[1][1][1] == "Open Treasure Chests" || item_data[1][1][1] == "Wheel of Doom") {
						// Ignore Open Chest 
						return false 
					}
					else{
						// Normal Quest Drop Item
						return true 
					}
				} else {
					// Normal Monster Drop Item 
					return true
				}
			}
			else {
				return false 
			}
		}
		else {
			// Failed to retrive item ._.
			// Fault of scraper in 99.99% of times.
		}
}

async function process_ToFarm_Page() {
	
	// Count of ac - account, and av - avaliable items
	var av_item_count = 0 
	var ac_item_count = 0 
	
	
	
	const item_keys = Object.keys(items_json)
	
	var table_element = document.getElementById("table-content")
	
	
	var avaliableItemsElement = document.getElementById("av-items")
	var accounteItemsElement = document.getElementById("ac-items")
	avaliableItemsElement.innerHTML = "Avaliable Items: "+av_item_count
	accounteItemsElement.innerHTML = "Account Items: "+ac_item_count
	
	
	chrome.storage.local.get({aqwitems: []}, function(result){
		var account_items = result.aqwitems
		ac_item_count = result.aqwitems.length
		for (var x = 0; x < item_keys.length; x++) {

			if (filterItem(item_keys[x], items_json[item_keys[x]], account_items)) {
				processToFarmItem(item_keys[x], items_json[item_keys[x]],table_element, av_item_count, avaliableItemsElement)
				av_item_count+= 1
			}
		}
		avaliableItemsElement.innerHTML = "Avaliable Items: "+av_item_count	
		accounteItemsElement.innerHTML = "Account Items: "+ac_item_count	
		
	})
}

// Declare icons only if not already declared by main.js
if (typeof drop_icon === 'undefined') {
    var drop_icon = chrome.runtime.getURL("images/monster_drop.png");
}
if (typeof quest_icon === 'undefined') {
    var quest_icon = chrome.runtime.getURL("images/quest_icon.png");
}
if (typeof mergeshop_icon === 'undefined') {
    var mergeshop_icon = chrome.runtime.getURL("images/mergeshop_icon.png");
}

// Navigation function for custom farm lists
function goToCustomFarmLists() {
    window.location.href = chrome.runtime.getURL("custom-farm-list.html");
}

// Make navigation function globally available
window.goToCustomFarmLists = goToCustomFarmLists;

// Integration with custom farm lists
function addToCustomFarmList(itemName, itemSource = null, itemDetails = null) {
    console.log('addToCustomFarmList called with:', itemName, itemSource);
    // Get current farm lists
    chrome.storage.local.get({customFarmLists: {}}, function(result) {
        const farmLists = result.customFarmLists;
        const listNames = Object.keys(farmLists);
        
        // Create a better selection dialog
        showImprovedListDialog(itemName, itemSource, itemDetails, farmLists, listNames);
    });
}

function showImprovedListDialog(itemName, itemSource, itemDetails, farmLists, listNames) {
    // Remove any existing dialog
    const existingDialog = document.getElementById('listSelectionDialog');
    if (existingDialog) {
        existingDialog.remove();
    }
    
    // Create improved dialog HTML
    const dialogHtml = `
        <div id="listSelectionDialog" style="
            position: fixed; 
            top: 0; left: 0; 
            width: 100%; height: 100%; 
            background: rgba(0,0,0,0.8); 
            z-index: 10000; 
            display: flex; 
            align-items: center; 
            justify-content: center;
        ">
            <div style="
                background: linear-gradient(#5b2c48 84%, #441832 100%), #5b2c48; 
                color: white; 
                padding: 30px; 
                border-radius: 10px; 
                max-width: 400px; 
                width: 90%;
                box-shadow: 0 0 20px rgba(0,0,0,0.8);
                border: 2px solid #716550;
            ">
                <h3 style="margin-top: 0; color: #efdfc2; text-align: center;">Add "${itemName}" to Farm List</h3>
                
                <div style="margin-bottom: 20px;">
                    ${listNames.length > 0 ? `
                        <label style="display: block; margin-bottom: 10px; color: #efdfc2; font-weight: bold;">Select List:</label>
                        <select id="listDropdown" style="
                            width: 100%; 
                            padding: 12px; 
                            background: #572844; 
                            color: white; 
                            border: 2px solid #716550; 
                            border-radius: 5px;
                            font-size: 16px;
                        ">
                            <option value="">-- Select an existing list --</option>
                            ${listNames.map(name => `
                                <option value="${name}">${name} (${farmLists[name].items.length} items)</option>
                            `).join('')}
                            <option value="__NEW__">+ Create New List</option>
                        </select>
                    ` : `
                        <p style="color: #efdfc2; text-align: center; margin-bottom: 20px;">No lists found. Create your first list:</p>
                        <input type="hidden" id="listDropdown" value="__NEW__">
                    `}
                </div>
                
                <div id="newListSection" style="display: none; margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 10px; color: #efdfc2; font-weight: bold;">New List Name:</label>
                    <input type="text" id="newListNameInput" placeholder="Enter list name..." style="
                        width: 100%; 
                        padding: 12px; 
                        background: #572844; 
                        color: white; 
                        border: 2px solid #716550; 
                        border-radius: 5px;
                        font-size: 16px;
                    ">
                </div>
                
                <div style="text-align: center; margin-top: 25px;">
                    <button id="confirmAddBtn" style="
                        background: linear-gradient(#4CAF50 84%, #45a049 100%), #4CAF50; 
                        color: white; 
                        border: none; 
                        padding: 12px 25px; 
                        border-radius: 5px; 
                        cursor: pointer;
                        font-size: 16px;
                        margin-right: 15px;
                        font-weight: bold;
                    ">Add to List</button>
                    <button id="cancelAddBtn" style="
                        background: linear-gradient(#f44336 84%, #da190b 100%), #f44336; 
                        color: white; 
                        border: none; 
                        padding: 12px 25px; 
                        border-radius: 5px; 
                        cursor: pointer;
                        font-size: 16px;
                    ">Cancel</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', dialogHtml);
    
    // Wait for the elements to be in the DOM before adding event listeners
    setTimeout(() => {
        // Add event listeners for buttons
        const confirmBtn = document.getElementById('confirmAddBtn');
        const cancelBtn = document.getElementById('cancelAddBtn');
        
        console.log('Looking for buttons:', confirmBtn, cancelBtn);
        
        if (confirmBtn) {
            confirmBtn.addEventListener('click', function() {
                console.log('Confirm button clicked');
                confirmAddToList(itemName, itemSource, itemDetails);
            });
        } else {
            console.error('Confirm button not found');
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                console.log('Cancel button clicked');
                closeListDialog();
            });
        } else {
            console.error('Cancel button not found');
        }
        
        // Add event listener for dropdown change
        const dropdown = document.getElementById('listDropdown');
        const newListSection = document.getElementById('newListSection');
        
        if (dropdown) {
            dropdown.addEventListener('change', function() {
                console.log('Dropdown changed to:', this.value);
                if (this.value === '__NEW__') {
                    newListSection.style.display = 'block';
                    const newListInput = document.getElementById('newListNameInput');
                    if (newListInput) {
                        newListInput.focus();
                    }
                } else {
                    newListSection.style.display = 'none';
                }
            });
            
            // Show new list section immediately if no lists exist
            if (listNames.length === 0) {
                newListSection.style.display = 'block';
                const newListInput = document.getElementById('newListNameInput');
                if (newListInput) {
                    newListInput.focus();
                }
            }
        }
        
        // Add click event listener to dialog background to close when clicking outside
        const dialog = document.getElementById('listSelectionDialog');
        if (dialog) {
            dialog.addEventListener('click', function(e) {
                // Only close if clicking the background, not the content
                if (e.target === dialog) {
                    closeListDialog();
                }
            });
        }
        
    }, 100); // Small delay to ensure DOM is ready
}

function confirmAddToList(itemName, itemSource, itemDetails) {
    const dropdown = document.getElementById('listDropdown');
    const newListNameInput = document.getElementById('newListNameInput');
    
    let selectedList = dropdown.value;
    
    // If creating new list
    if (selectedList === '__NEW__' || selectedList === '') {
        const newListName = newListNameInput.value.trim();
        if (!newListName) {
            alert('Please enter a list name');
            return;
        }
        
        // Create new list and add item
        chrome.storage.local.get({customFarmLists: {}}, function(result) {
            const farmLists = result.customFarmLists;
            
            if (farmLists[newListName]) {
                alert('A list with this name already exists');
                return;
            }
            
            // Create new list
            farmLists[newListName] = {
                items: [],
                created: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };
            
            // Add item to new list
            addItemToList(farmLists, newListName, itemName, itemSource, itemDetails);
        });
    } else {
        // Add to existing list
        chrome.storage.local.get({customFarmLists: {}}, function(result) {
            addItemToList(result.customFarmLists, selectedList, itemName, itemSource, itemDetails);
        });
    }
}

function addItemToList(farmLists, listName, itemName, itemSource, itemDetails) {
    // Check if item already exists
    const existingItem = farmLists[listName].items.find(item => 
        item.name.toLowerCase() === itemName.toLowerCase()
    );
    
    if (existingItem) {
        alert(`"${itemName}" is already in the "${listName}" list`);
        closeListDialog();
        return;
    }
    
    // Extract tags from itemDetails if available
    let tags = [];
    if (itemDetails) {
        if (itemDetails.isAc) tags.push('AC');
        if (itemDetails.isLegend) tags.push('Legend');
        if (itemDetails.isSeasonal) tags.push('Seasonal');
        if (itemDetails.dropType) tags.push(itemDetails.dropType);
    }
    
    // Add item to the list
    const newItem = {
        name: itemName,
        source: itemSource || 'Added from To Farm page',
        notes: '',
        obtained: false,
        added: new Date().toISOString(),
        tags: tags,
        status: 'in-progress' // New status field
    };
    
    farmLists[listName].items.push(newItem);
    farmLists[listName].lastModified = new Date().toISOString();
    
    // Save updated lists
    chrome.storage.local.set({customFarmLists: farmLists}, function() {
        alert(`"${itemName}" added to "${listName}" list successfully!`);
        closeListDialog();
    });
}

function closeListDialog() {
    const dialog = document.getElementById('listSelectionDialog');
    if (dialog) {
        dialog.remove();
    }
}

// Make all dialog-related functions globally available immediately
window.addToCustomFarmList = addToCustomFarmList;
window.confirmAddToList = confirmAddToList;
window.closeListDialog = closeListDialog;
window.goToCustomFarmLists = goToCustomFarmLists;


if (window.location.href.includes("tofarm.html")) {
	
	document.addEventListener('DOMContentLoaded', function(event) {
		
		
		var dropFilter = document.getElementById("bossdrop")
		dropFilter.src = drop_icon
		
		var dropFilter = document.getElementById("mergeshopdrop")
		dropFilter.src = mergeshop_icon
		
		var dropFilter = document.getElementById("questdrop")
		dropFilter.src = quest_icon
		
		// Add event listener for Custom Lists button
		const customListsBtn = document.getElementById('customListsBtn');
		if (customListsBtn) {
			customListsBtn.addEventListener('click', function() {
				goToCustomFarmLists();
			});
		}
		
		process_ToFarm_Page()
		
		document.getElementById('Filter_AcItem').addEventListener('click',
			reProcess_ToFarm_Page);
		document.getElementById('Filter_LegendItem').addEventListener('click',
			reProcess_ToFarm_Page);		
		document.getElementById('Filter_NormalItem').addEventListener('click',
			reProcess_ToFarm_Page);
		document.getElementById('Filter_SeasonalItem').addEventListener('click',
			reProcess_ToFarm_Page);	
		document.getElementById('Filter_MonsterDrop').addEventListener('click',
			reProcess_ToFarm_Page);	
		document.getElementById('Filter_MergeDrop').addEventListener('click',
			reProcess_ToFarm_Page);	
		document.getElementById('Filter_QuestDrop').addEventListener('click',
			reProcess_ToFarm_Page);
		
	})	
}
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
	
	if (item_details[1][1][0] == "Drop" || item_details[1][1][0] == "Quest" || item_details[1][1][0] == "Merge") {
		if  (item_details[1][1][1] !== "") {
			td_2.innerHTML = "<a href='http://aqwwiki.wikidot.com/"+item_details[1][1][2]+"'>"+item_details[1][1][1]+"</a>"
			
		} else {
			td_2.innerHTML = item_details[1][1][1][0]
		}
	} else {
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
		addToCustomFarmList(item_name, sourceInfo);
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
const drop_icon = chrome.runtime.getURL("images/monster_drop.png")
const quest_icon = chrome.runtime.getURL("images/quest_icon.png")
const mergeshop_icon = chrome.runtime.getURL("images/mergeshop_icon.png")

// Navigation function for custom farm lists
function goToCustomFarmLists() {
    window.location.href = chrome.runtime.getURL("custom-farm-list.html");
}

// Make navigation function globally available
window.goToCustomFarmLists = goToCustomFarmLists;

// Integration with custom farm lists
function addToCustomFarmList(itemName, itemSource = null) {
    console.log('addToCustomFarmList called with:', itemName, itemSource);
    // Get current farm lists
    chrome.storage.local.get({customFarmLists: {}}, function(result) {
        const farmLists = result.customFarmLists;
        const listNames = Object.keys(farmLists);
        
        // Create a modal-like dialog for better UX
        showListSelectionDialog(itemName, itemSource, farmLists, listNames);
    });
}

function showListSelectionDialog(itemName, itemSource, farmLists, listNames) {
    // Remove any existing dialog
    const existingDialog = document.getElementById('listSelectionDialog');
    if (existingDialog) {
        existingDialog.remove();
    }
    
    // Create dialog HTML
    const dialogHtml = `
        <div id="listSelectionDialog" style="
            position: fixed; 
            top: 0; left: 0; 
            width: 100%; height: 100%; 
            background: rgba(0,0,0,0.7); 
            z-index: 10000; 
            display: flex; 
            align-items: center; 
            justify-content: center;
        ">
            <div style="
                background: #2a2a2a; 
                color: white; 
                padding: 30px; 
                border-radius: 10px; 
                max-width: 500px; 
                width: 90%;
                box-shadow: 0 0 20px rgba(0,0,0,0.5);
            ">
                <h3 style="margin-top: 0; color: #4CAF50;">Add "${itemName}" to Farm List</h3>
                
                ${listNames.length > 0 ? `
                    <div style="margin-bottom: 20px;">
                        <h4>Select Existing List:</h4>
                        <select id="existingListSelect" style="
                            width: 100%; 
                            padding: 10px; 
                            background: #444; 
                            color: white; 
                            border: 1px solid #666; 
                            border-radius: 5px;
                            margin-bottom: 10px;
                        ">
                            <option value="">-- Select a list --</option>
                            ${listNames.map(name => `
                                <option value="${name}">${name} (${farmLists[name].items.length} items)</option>
                            `).join('')}
                        </select>
                        <button onclick="addToSelectedList('${itemName.replace(/'/g, "\\'")}', '${(itemSource || '').replace(/'/g, "\\'")}');" style="
                            background: #4CAF50; 
                            color: white; 
                            border: none; 
                            padding: 10px 20px; 
                            border-radius: 5px; 
                            cursor: pointer;
                            width: 100%;
                            margin-bottom: 15px;
                        ">Add to Selected List</button>
                    </div>
                    
                    <div style="text-align: center; margin: 20px 0; color: #888;">
                        <span>-- OR --</span>
                    </div>
                ` : ''}
                
                <div style="margin-bottom: 20px;">
                    <h4>Create New List:</h4>
                    <input type="text" id="newListName" placeholder="Enter new list name..." style="
                        width: 100%; 
                        padding: 10px; 
                        background: #444; 
                        color: white; 
                        border: 1px solid #666; 
                        border-radius: 5px;
                        margin-bottom: 10px;
                    ">
                    <button onclick="createNewListAndAdd('${itemName.replace(/'/g, "\\'")}', '${(itemSource || '').replace(/'/g, "\\'")}');" style="
                        background: #008CBA; 
                        color: white; 
                        border: none; 
                        padding: 10px 20px; 
                        border-radius: 5px; 
                        cursor: pointer;
                        width: 100%;
                    ">Create List & Add Item</button>
                </div>
                
                <div style="text-align: center;">
                    <button onclick="closeListDialog()" style="
                        background: #f44336; 
                        color: white; 
                        border: none; 
                        padding: 10px 20px; 
                        border-radius: 5px; 
                        cursor: pointer;
                    ">Cancel</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', dialogHtml);
}

function addToSelectedList(itemName, itemSource) {
    const selectedList = document.getElementById('existingListSelect').value;
    if (!selectedList) {
        alert('Please select a list');
        return;
    }
    
    performAddToList(itemName, itemSource, selectedList);
}

function createNewListAndAdd(itemName, itemSource) {
    const newListName = document.getElementById('newListName').value.trim();
    if (!newListName) {
        alert('Please enter a list name');
        return;
    }
    
    // Check if list already exists
    chrome.storage.local.get({customFarmLists: {}}, function(result) {
        if (result.customFarmLists[newListName]) {
            alert('A list with this name already exists');
            return;
        }
        
        // Create new list
        const farmLists = result.customFarmLists;
        farmLists[newListName] = {
            items: [],
            created: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        chrome.storage.local.set({customFarmLists: farmLists}, function() {
            performAddToList(itemName, itemSource, newListName);
        });
    });
}

function performAddToList(itemName, itemSource, listName) {
    chrome.storage.local.get({customFarmLists: {}}, function(result) {
        const farmLists = result.customFarmLists;
        
        // Check if item already exists in the list
        const existingItem = farmLists[listName].items.find(item => 
            item.name.toLowerCase() === itemName.toLowerCase()
        );
        
        if (existingItem) {
            alert(`"${itemName}" is already in the "${listName}" list`);
            closeListDialog();
            return;
        }
        
        // Add item to the list
        const newItem = {
            name: itemName,
            source: itemSource || 'Added from To Farm page',
            notes: '',
            obtained: false,
            added: new Date().toISOString()
        };
        
        farmLists[listName].items.push(newItem);
        farmLists[listName].lastModified = new Date().toISOString();
        
        // Save updated lists
        chrome.storage.local.set({customFarmLists: farmLists}, function() {
            alert(`"${itemName}" added to "${listName}" list successfully!`);
            closeListDialog();
        });
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
window.addToSelectedList = addToSelectedList;
window.createNewListAndAdd = createNewListAndAdd;
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
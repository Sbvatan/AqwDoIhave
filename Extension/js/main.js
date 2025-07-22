/* Main.js */ 

const bank_icon = chrome.runtime.getURL("images/in_bank.png")
const inv_icon = chrome.runtime.getURL("images/in_inventory.png")
const price_icon = chrome.runtime.getURL("images/price_icon.png");
const drop_icon = chrome.runtime.getURL("images/monster_drop.png")
const collectionchest_icon = chrome.runtime.getURL("images/collectionchest_icon.png")
const inventory_update_icon = chrome.runtime.getURL("images/update_inventory.png")
const tofarm_icon = chrome.runtime.getURL("images/WICF_button.png")

const mergeshop_icon = chrome.runtime.getURL("images/mergeshop_icon.png")
const quest_icon = chrome.runtime.getURL("images/quest_icon.png")
const shop_icon = chrome.runtime.getURL("images/shop_icon.png")
const treasurechest_icon = chrome.runtime.getURL("images/treasurechest_icon.png")
const whellofdoom_icon = chrome.runtime.getURL("images/whellofdoom_icon.png")
const normal_icon = chrome.runtime.getURL("images/normal_icon.png")

const wiki_searchpage = "aqwwiki.wikidot.com/search-items"
var found = 0 
var totalItemsProcessed = 0  // Track items actually processed by ProcessWikiItem
var filterMergeAc = false 

// Helper function to load JSON data
function getJson(theUrl) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false ); 
	xmlHttp.send(null);
    return JSON.parse(xmlHttp.responseText)
}

// Load wiki exclude suffixes for item analysis
var wiki_exclude_suffixes = getJson(chrome.runtime.getURL("data/wiki_exclude_suffixes.json")) 


// WIP stuff 
function resetFilterMerge() {
	var elementList = document.querySelectorAll("tr")
	
	for (var x = 0; x < elementList.length; x++) { 
		if (elementList[x].querySelectorAll("td").length == 3) { 
			elementList[x].hidden = false  
		}
	}
}


function TagFilterMerge(normal,ac,legend) {
	var hideNormal = !normal 
	var hideAc = !ac 
	var hideLegend = !legend 
	
	var elementList = document.querySelectorAll("tr")
	
	for (var x = 0; x < elementList.length; x++) { 
		if (elementList[x].querySelectorAll("td").length == 3) {
			
			checkAc = elementList[x].innerHTML.includes("acsmall.png")
			checkLegend = elementList[x].innerHTML.includes("legendsmall.png")
			checkNormal = !checkAc & !checkLegend
			
			//alert(checkAc+"  "+checkLegend+"  "+checkNormal+"\n"+hideAc+"  "+hideLegend+"  "+hideNormal+"\n")
			

			if (hideLegend == false & hideAc == false & hideNormal == true) {
				if (checkNormal == true) {
					elementList[x].hidden = true 
				} 
				if (checkAc == true & checkLegend == false) {
					elementList[x].hidden = true 
				} 
				if (checkAc == false & checkLegend == true) {
					elementList[x].hidden = true 
				} 
				
			} else if (hideLegend == false & hideAc == true & hideNormal == true) {
				if (checkLegend == false) {
					elementList[x].hidden = true 
				}
			} else if (hideLegend == true & hideAc == true & hideNormal == true) {

			} else if (hideLegend == true & hideAc == false & hideNormal == true) {
				if (!checkAc == true) {
					elementList[x].hidden = true 
				}
			} else if (hideLegend == false & hideAc == true & hideNormal == false) {
				if (checkAc == true | checkNormal == true) {
					elementList[x].hidden = true 
				}
			} else if (hideLegend == true & hideAc == false & hideNormal == false) {
				if (!checkAc == true | checkLegend == true) {
					elementList[x].hidden = true 
				}
				
			} else if (hideLegend == true & hideAc == true & hideNormal == false) {
				if (checkAc == true | checkLegend == true) {
					elementList[x].hidden = true 
				}
				
			} 
			
			
		}
	}
	
}




// Wait and Process acount data
function waitForTableToLoad(){
		if(typeof document.getElementById("listinvFull").innerHTML.length !== "undefined"){
			if(document.getElementById("listinvFull").innerHTML.length >= 2000){
				processAcount();
			} 
			else {
				setTimeout(waitForTableToLoad, 250);
			}	
		} 
		else {
			setTimeout(waitForTableToLoad, 250);
	}
}

function goto_ToFarm() {
	document.location.href = chrome.runtime.getURL("tofarm.html")
}

function goto_CustomFarmList() {
	document.location.href = chrome.runtime.getURL("custom-farm-list.html")
}


function processAcountBackground() {
	var prevurl = document.location.href 
	
	
	chrome.storage.local.set({"background": prevurl}, function() {});
	document.location.href = "https://account.aq.com/AQW/Inventory"
}

function addToFarm_button() {
	const header = document.getElementById("side-bar")
	var ToFarm = document.createElement("button") 
	ToFarm.onclick = function() { goto_ToFarm(); return false; }
	ToFarm.style = "background-color: Transparent;border: none;" 
	ToFarm.innerHTML = " <img style='height:35px;' src="+tofarm_icon+"></img>"
	header.prepend(ToFarm)
}

function addUpdateInventory_button() {
	const Title = document.getElementById("page-title")
	var styles = `
    #UpdateInventory:hover {
		filter: contrast(120%) brightness(1.25);; 
	}`
	var styleSheet = document.createElement("style")
	styleSheet.innerText = styles
	document.head.appendChild(styleSheet)
	
	const updateInventory = document.createElement("button") 
	const updateInventoryImg = document.createElement("img");
	updateInventory.onclick = () => processAcountBackground();
	updateInventory.style.backgroundColor = "Transparent";
	updateInventory.style.border = "none";
	updateInventoryImg.id = "UpdateInventory";
	updateInventoryImg.style.height = "35px";
	updateInventoryImg.src = inventory_update_icon;
	
	updateInventory.appendChild(updateInventoryImg);
	Title.appendChild(updateInventory)
	

}

var itemAnalysisData = {
	ownedItems: [],
	notOwnedItems: [],
	allProcessedItems: []
};

function showItemAnalysisPopup() {
	// Remove any existing dialog
	const existingDialog = document.getElementById('itemAnalysisDialog');
	if (existingDialog) {
		existingDialog.remove();
	}
	
	const ownedCount = itemAnalysisData.ownedItems.length;
	const notOwnedCount = itemAnalysisData.notOwnedItems.length;
	
	// Create the popup dialog
	const dialogHtml = `
		<div id="itemAnalysisDialog" style="
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
				padding: 20px; 
				border-radius: 10px; 
				max-width: 90%; 
				max-height: 90%;
				width: 800px;
				height: 600px;
				box-shadow: 0 0 20px rgba(0,0,0,0.8);
				border: 2px solid #716550;
				overflow: hidden;
				display: flex;
				flex-direction: column;
			">
				<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
					<h3 style="margin: 0; color: #efdfc2;">Item Analysis</h3>
					<button id="closeAnalysisBtn" style="
						background: #f44336; 
						color: white; 
						border: none; 
						padding: 8px 15px; 
						border-radius: 5px; 
						cursor: pointer;
						font-size: 16px;
					">×</button>
				</div>
				
				<div style="display: flex; margin-bottom: 20px;">
					<button id="ownedTab" class="analysis-tab active" data-tab="owned" style="
						background: #4CAF50; 
						color: white; 
						border: none; 
						padding: 10px 20px; 
						border-radius: 5px 5px 0 0; 
						cursor: pointer;
						font-size: 16px;
						margin-right: 2px;
					">Items You Own (${ownedCount})</button>
					<button id="notOwnedTab" class="analysis-tab" data-tab="notowned" style="
						background: #572844; 
						color: white; 
						border: none; 
						padding: 10px 20px; 
						border-radius: 5px 5px 0 0; 
						cursor: pointer;
						font-size: 16px;
					">Items You Don't Own (${notOwnedCount})</button>
				</div>
				
				<div id="analysisContent" style="
					flex: 1; 
					overflow-y: auto; 
					background: rgba(0,0,0,0.3); 
					padding: 15px; 
					border-radius: 5px;
				">
					<!-- Content will be populated here -->
				</div>
			</div>
		</div>
	`;
	
	document.body.insertAdjacentHTML('beforeend', dialogHtml);
	
	// Add event listeners
	setTimeout(() => {
		document.getElementById('closeAnalysisBtn').addEventListener('click', closeItemAnalysis);
		document.getElementById('ownedTab').addEventListener('click', () => switchAnalysisTab('owned'));
		document.getElementById('notOwnedTab').addEventListener('click', () => switchAnalysisTab('notowned'));
		
		// Close on background click
		document.getElementById('itemAnalysisDialog').addEventListener('click', function(e) {
			if (e.target === this) closeItemAnalysis();
		});
		
		// Show owned items by default
		switchAnalysisTab('owned');
	}, 100);
}

function switchAnalysisTab(tabType) {
	// Update tab appearance
	document.querySelectorAll('.analysis-tab').forEach(tab => {
		tab.style.background = '#572844';
		tab.classList.remove('active');
	});
	
	const activeTab = document.querySelector(`[data-tab="${tabType}"]`);
	activeTab.style.background = '#4CAF50';
	activeTab.classList.add('active');
	
	// Update content
	const content = document.getElementById('analysisContent');
	const items = tabType === 'owned' ? itemAnalysisData.ownedItems : itemAnalysisData.notOwnedItems;
	
	if (items.length === 0) {
		content.innerHTML = `<p style="color: #b3a082; text-align: center; font-size: 18px; margin-top: 50px;">
			${tabType === 'owned' ? 'No items found that you own on this page.' : 'No items found that you don\'t own on this page.'}
		</p>`;
		return;
	}
	
	let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">';
	
	items.forEach(item => {
		const wikiUrl = `http://aqwwiki.wikidot.com/${item.name.replace(/\s+/g, '-').toLowerCase()}`;
		
		// Generate tag icons
		let tagIcons = '';
		if (item.isAc) {
			tagIcons += `<img src="http://aqwwiki.wdfiles.com/local--files/image-tags/aclarge.png" title="AC Item" style="height: 20px; margin-right: 5px;">`;
		}
		if (item.isLegend) {
			tagIcons += `<img src="http://aqwwiki.wdfiles.com/local--files/image-tags/legendlarge.png" title="Legend Item" style="height: 20px; margin-right: 5px;">`;
		}
		if (item.isSeasonal) {
			tagIcons += `<img src="http://aqwwiki.wdfiles.com/local--files/image-tags/seasonallarge.png" title="Seasonal Item" style="height: 20px; margin-right: 5px;">`;
		}
		if (!item.isAc && !item.isLegend) {
			tagIcons += `<img src="${normal_icon}" title="Normal Item" style="height: 20px; margin-right: 5px;">`;
		}
		
		// Add source icons if available
		if (item.source) {
			if (item.source.includes('Drop')) {
				tagIcons += `<img src="${drop_icon}" title="Monster Drop" style="height: 20px; margin-right: 5px;">`;
			}
			if (item.source.includes('Quest')) {
				tagIcons += `<img src="${quest_icon}" title="Quest Reward" style="height: 20px; margin-right: 5px;">`;
			}
			if (item.source.includes('Merge')) {
				tagIcons += `<img src="${mergeshop_icon}" title="Merge Shop" style="height: 20px; margin-right: 5px;">`;
			}
		}
		
		const statusColor = tabType === 'owned' ? '#4CAF50' : '#f44336';
		const statusText = tabType === 'owned' ? 'Owned' : 'Not Owned';
		
		html += `
			<div style="
				background: rgba(0,0,0,0.4); 
				padding: 15px; 
				border-radius: 8px; 
				border: 1px solid #716550;
				transition: all 0.3s ease;
			" onmouseover="this.style.background='rgba(0,0,0,0.6)'" onmouseout="this.style.background='rgba(0,0,0,0.4)'">
				<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
					<a href="${wikiUrl}" target="_blank" style="
						color: #4da6ff; 
						text-decoration: none; 
						font-weight: bold; 
						font-size: 16px;
						flex: 1;
						margin-right: 10px;
						word-break: break-word;
					" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">
						${item.name}
					</a>
					<div style="
						background: ${statusColor}; 
						color: white; 
						padding: 3px 8px; 
						border-radius: 3px; 
						font-size: 12px;
						white-space: nowrap;
					">
						${statusText}
					</div>
				</div>
				<div style="margin-bottom: 10px;">
					${tagIcons}
				</div>
				${item.location && tabType === 'owned' ? `<div style="color: #4CAF50; font-size: 14px; margin-bottom: 5px;">
					<strong>Location:</strong> ${item.location}
				</div>` : ''}
				${item.source ? `<div style="color: #b3a082; font-size: 14px; margin-bottom: 5px;">
					<strong>Source:</strong> ${item.source}
				</div>` : ''}
				${item.category ? `<div style="color: #b3a082; font-size: 14px;">
					<strong>Category:</strong> ${item.category}
				</div>` : ''}
			</div>
		`;
	});
	
	html += '</div>';
	content.innerHTML = html;
}

function closeItemAnalysis() {
	const dialog = document.getElementById('itemAnalysisDialog');
	if (dialog) {
		dialog.remove();
	}
}

function processItemForAnalysis(nodeList, arrayOffset, x, Items, Buy, Category, Where, Type) {
    // Use the EXACT same logic as ProcessWikiItem - no additional filtering
    let nodeText = nodeList[arrayOffset+x].innerHTML.replace("'","'").trim();
    let originalNodeText = nodeList[arrayOffset+x].textContent.trim();
    
    // Skip items with blank/empty names
    if (!originalNodeText || originalNodeText.length === 0) {
        console.log("Skipping blank item");
        return;
    }
    
    // Use Wiki Excluded Suffixes json to remove unused suffixes (same as ProcessWikiItem)
    for (var i = 0; i < wiki_exclude_suffixes["Excluded"].length; i++) {
        nodeText = nodeText.replace(wiki_exclude_suffixes["Excluded"][i],"")
    }
    nodeText = nodeText.toLowerCase();
    
    let nodeLink = nodeList[arrayOffset+x].href;
    
    // Use EXACTLY the same filtering logic as ProcessWikiItem
    let isRep = nodeLink && !nodeLink.includes("-faction");
    
    if (isRep) {
        // Enhanced filtering to remove obvious non-items
        const isObviousNonItem = 
            !nodeLink.includes("http://aqwwiki.wikidot.com/") ||
            originalNodeText.toLowerCase().includes("edit this panel") ||
            originalNodeText.toLowerCase().includes("list of all tags") ||
            originalNodeText.toLowerCase().includes("alina's twitter") ||
            originalNodeText.toLowerCase().includes("aqworlds wiki") ||
            originalNodeText.toLowerCase().includes("merge shops") ||
            originalNodeText.toLowerCase().includes("shops") ||
            originalNodeText.toLowerCase().includes("(npc)") ||
            originalNodeText.toLowerCase().includes("(location)") ||
            originalNodeText.toLowerCase().includes("(shop)") ||
            originalNodeText.toLowerCase().includes("(quest)") ||
            originalNodeText.toLowerCase().includes("(monster)") ||
            originalNodeText.toLowerCase().includes("category:") ||
            originalNodeText.toLowerCase().includes("source:") ||
            (originalNodeText.toLowerCase() === "world") ||
            (originalNodeText.toLowerCase() === "lim") ||
            nodeLink.includes("system:") ||
            nodeLink.includes("/tag/") ||
            nodeLink.includes("wikidot.com/nav:") ||
            nodeLink.includes("wikidot.com/forum:") ||
            // Filter very short text (likely not actual item names)
            originalNodeText.trim().length < 2 ||
            // Filter links that don't lead to actual item pages
            !nodeLink.match(/^http:\/\/aqwwiki\.wikidot\.com\/[a-z0-9-]+$/);
            
        if (isObviousNonItem) {
            console.log("Skipping non-item:", originalNodeText);
            return; // Skip obvious non-items
        }
        
        // Check for duplicates - skip if we already processed this item
        const isDuplicate = itemAnalysisData.allProcessedItems.some(item => 
            item.name.toLowerCase() === originalNodeText.toLowerCase() || 
            item.link === nodeLink
        );
        
        if (isDuplicate) {
            console.log("Skipping duplicate item:", originalNodeText);
            return;
        }
        
        // COMPREHENSIVE DEBUGGING FOR OWNED ITEMS
        console.log("=== PROCESSING ITEM ===");
        console.log("Original text:", originalNodeText);
        console.log("Cleaned text:", nodeText);
        console.log("Link:", nodeLink);
        console.log("Items array length:", Items.length);
        
        // Check if Items array is valid
        if (!Items || !Array.isArray(Items) || Items.length === 0) {
            console.log("❌ ERROR: Items array is invalid:", Items);
        } else {
            console.log("✅ Items array is valid with", Items.length, "items");
        }
        
        // Test multiple variations for owned items
        const ownedChecks = {
            'nodeText': Items.includes(nodeText),
            'originalNodeText': Items.includes(originalNodeText),
            'originalLowerCase': Items.includes(originalNodeText.toLowerCase()),
            'originalWithoutSpaces': Items.includes(originalNodeText.replace(/\s+/g, '')),
            'nodeTextWithoutSpaces': Items.includes(nodeText.replace(/\s+/g, ''))
        };
        
        console.log("Ownership checks:", ownedChecks);
        
        // Find any partial matches in the inventory
        const partialMatches = Items.filter(item => 
            item.toLowerCase().includes(nodeText.toLowerCase()) || 
            nodeText.toLowerCase().includes(item.toLowerCase())
        );
        
        if (partialMatches.length > 0) {
            console.log("🔍 Partial matches found:", partialMatches);
        }
        
        // Final ownership determination
        const isOwned = Object.values(ownedChecks).some(check => check === true);
        
        console.log("Final isOwned result:", isOwned);
        
        if (isOwned) {
            console.log("🎉 OWNED ITEM CONFIRMED:", originalNodeText);
        } else {
            console.log("❌ Item not owned:", originalNodeText);
        }

        // Detect item tags from HTML - check the current element and its parent
        const currentHtml = nodeList[arrayOffset+x].innerHTML;
        const parentHtml = nodeList[arrayOffset+x].parentNode ? nodeList[arrayOffset+x].parentNode.innerHTML : '';
        
        const isAc = currentHtml.includes("acsmall.png") || currentHtml.includes("aclarge.png") || 
                     parentHtml.includes("acsmall.png") || parentHtml.includes("aclarge.png");
        const isLegend = currentHtml.includes("legendsmall.png") || currentHtml.includes("legendlarge.png") || 
                         parentHtml.includes("legendsmall.png") || parentHtml.includes("legendlarge.png");
        const isSeasonal = currentHtml.includes("seasonalsmall.png") || currentHtml.includes("seasonallarge.png") || 
                           parentHtml.includes("seasonalsmall.png") || parentHtml.includes("seasonallarge.png");
        
        // Try to get source information from sibling elements
        let source = '';
        try {
            const parentNode = nodeList[arrayOffset+x].parentNode;
            if (parentNode) {
                const parentText = parentNode.textContent;
                if (parentText.includes('Drop')) source = 'Monster Drop';
                else if (parentText.includes('Quest')) source = 'Quest Reward';
                else if (parentText.includes('Merge')) source = 'Merge Shop';
                else if (parentText.includes('Shop')) source = 'Shop';
            }
        } catch (e) {
            // Ignore errors
        }
        
        // Get where the item is located if owned
        let location = '';
        if (isOwned) {
            // Find the index using the same logic as ownership check
            let itemIndex = -1;
            for (const [checkType, checkResult] of Object.entries(ownedChecks)) {
                if (checkResult) {
                    if (checkType === 'nodeText') {
                        itemIndex = Items.indexOf(nodeText);
                    } else if (checkType === 'originalNodeText') {
                        itemIndex = Items.indexOf(originalNodeText);
                    } else if (checkType === 'originalLowerCase') {
                        itemIndex = Items.indexOf(originalNodeText.toLowerCase());
                    }
                    // Add more cases as needed
                    break;
                }
            }
            
            if (itemIndex >= 0 && Where && Where[itemIndex]) {
                location = Where[itemIndex];
                console.log("Found location for owned item:", location);
            }
        }
        
        const itemData = {
            name: originalNodeText,
            link: nodeLink,
            isOwned: isOwned,
            isAc: isAc,
            isLegend: isLegend,
            isSeasonal: isSeasonal,
            source: source,
            location: location,
            category: window.location.pathname.split('/').pop() || 'Unknown'
        };
        
        console.log("Final itemData:", itemData);
        
        // Add to analysis data
        itemAnalysisData.allProcessedItems.push(itemData);
        
        if (isOwned) {
            itemAnalysisData.ownedItems.push(itemData);
            console.log("✅ Added to owned items array. Total owned now:", itemAnalysisData.ownedItems.length);
        } else {
            itemAnalysisData.notOwnedItems.push(itemData);
            console.log("➡️ Added to not-owned items array. Total not-owned now:", itemAnalysisData.notOwnedItems.length);
        }
    }
}

function setFilterAc() {
	chrome.storage.local.get({mergeFilterAc: false}, function(result){
		chrome.storage.local.set({"mergeFilterAc": !result.mergeFilterAc}, function() {});
		document.getElementById("AcFilter").checked = !result.mergeFilterAc
	})
	FilterEvent()
}

function setFilterNormal() {
	chrome.storage.local.get({mergeFilterNormal: false}, function(result){
		chrome.storage.local.set({"mergeFilterNormal": !result.mergeFilterNormal}, function() {});
		document.getElementById("NormalFilter").checked = !result.mergeFilterNormal
	})
	FilterEvent()
}

function setFilterLegend() {
	chrome.storage.local.get({mergeFilterLegend: false}, function(result){
		chrome.storage.local.set({"mergeFilterLegend": !result.mergeFilterLegend}, function() {});
		document.getElementById("LegendFilter").checked = !result.mergeFilterLegend
	})
	FilterEvent()
}



function processAcount() {
	
	var data = ProcessAccountItems();
	
	// Save Items to local Storage 
	chrome.storage.local.set({"aqwitems": data[0]}, function() {});
	chrome.storage.local.set({"aqwwhere": data[1]}, function() {});
	chrome.storage.local.set({"aqwtype": data[2]}, function() {});
	chrome.storage.local.set({"aqwbuy": data[3]}, function() {});
	chrome.storage.local.set({"aqwcategory": data[4]}, function() {});
	
	chrome.storage.local.get({background: false}, function(result){
		if (result.background !== false && document.location.href == "https://account.aq.com/AQW/Inventory") {
			if (result.background.includes("http://aqwwiki.wikidot.com/")) { // Redirect Only Aqw Wiki Pages  
				document.location.href = result.background
			}
			chrome.storage.local.set({"background": false}, function() {});
		} 
		
	});
	
}




// Account Page Handling 
if (window.location.href == "https://account.aq.com/AQW/Inventory") {
	// page load 
	document.addEventListener('DOMContentLoaded', function(event) {
		
	// Wait function for table load 
	waitForTableToLoad()
	
	})
	
	
	
// Wiki Page Handling 
} else {

	// Adds theme if enabled 
	chrome.storage.local.get({darkmode: 0}, function(result){
		if(result.darkmode) {
			addCss(chrome.runtime.getURL("themes/dark.css"));
		}
	});
	
	addCss(chrome.runtime.getURL("themes/progressbar.css"));
	// page load 
	document.addEventListener('DOMContentLoaded', function(event) {
	
	// Removes width bar [Not even usefull]
	var Body = document.getElementsByTagName('body')[0]
	Body.style = Body.style +";overflow-x: hidden;";


	// Get title of Wiki page (Name of category basically) 
	const Title = document.getElementById("page-title")
	const Content = document.getElementById("page-content")
	
	// Creates Found amount element near title. 
	var found_info = document.createElement("a") 
	found_info.innerHTML = "- Found 0 Items"
	found_info.style = "font-weight: bold;color:green;cursor:pointer;text-decoration:none;"
	found_info.title = "Click to open Item Analysis"
	found_info.onclick = function() { showItemAnalysisPopup(); return false; }
	Title.appendChild(found_info)
	
	
	
	
	
	
	addUpdateInventory_button()
	addToFarm_button()
	
	
	// Selects all <a> elements 
	// [It is best method, as it is compatible with other browsers]
	var nodeList = document.querySelectorAll("a")
	
	// How much <a> elements to skip 
	const arrayOffset = 190
	
	let arrayList = Array.from(nodeList).slice(arrayOffset) // About 200 is alright
	
	// Site detect vars 
	
	try{
		var isMonster = document.body.parentElement.innerHTML.includes("/system:page-tags/tag/monster");
	} 
	catch(err){var isMonster = false}
	
	try{
		var isShop =    document.body.parentElement.innerHTML.includes("(Shop)");
	} 
	catch(err){var isShop = false}
	

	// if shop is a merge shop 
	try{
		var isMerge = document.body.innerHTML.includes('/system:page-tags/tag/mergeshop'); 
	} 
	catch(err){var isMerge = false}

	// Is Quest Page 
	try{
		var isQuest = document.body.innerHTML.includes('/system:page-tags/tag/quest'); 
	} 
	catch(err){var isQuest = false}
	
	
	// Exclude search pages for false positives 
	if (window.location.href.includes(wiki_searchpage)) {
		var isMerge = false 
		var isQuest = false 
		var isShop = false 
		var isMonster = false 
	}
	

	if (isMerge) {
		window.addEventListener('load', function () {
			async function _add() {
				var element = document.getElementsByClassName("yui-nav")[0];
				
				
				var liMergeFilters = document.createElement("li")
				liMergeFilters.id = "MergeFilter"
				liMergeFilters.onclick = null 
				liMergeFilters.innerHTML = `<b class="grayBox" id="pad"  >Filters ></b>
				<input id="NormalFilter" type='checkbox' style="margin-left:5px;"> </input>
				<img src="`+normal_icon+`" alt="normal_icon.png" class="image">
				
				<input id="AcFilter" type='checkbox' style="margin-left:5px;"> </input>
				<img src="http://aqwwiki.wdfiles.com/local--files/image-tags/acsmall.png" alt="acsmall.png" class="image">
				<input id="LegendFilter" type='checkbox' style="margin-left:5px;"> </input>
				<img src="http://aqwwiki.wdfiles.com/local--files/image-tags/legendsmall.png" alt="legendsmall.png" class="image">
				
				`
				
				element.append(liMergeFilters)
				
				
				
				filterAcInput = document.getElementById("AcFilter")
				filterAcInput.onclick = function(){setFilterAc();resetFilterMerge();TagFilterMerge(filterNormalInput.checked, filterAcInput.checked, filterLegendInput.checked);return false; }
		
				filterNormalInput = document.getElementById("NormalFilter")
				filterNormalInput.onclick = function(){setFilterNormal();resetFilterMerge();TagFilterMerge(filterNormalInput.checked, filterAcInput.checked, filterLegendInput.checked);return false; }
				
				filterLegendInput = document.getElementById("LegendFilter")
				filterLegendInput.onclick = function(){setFilterLegend();resetFilterMerge();TagFilterMerge(filterNormalInput.checked, filterAcInput.checked, filterLegendInput.checked);return false; }
		
		
				chrome.storage.local.get({mergeFilterNormal: false}, function(result){
					filterNormalInput.checked = result.mergeFilterNormal
					chrome.storage.local.get({mergeFilterLegend: false}, function(result){
						filterLegendInput.checked = result.mergeFilterLegend
						chrome.storage.local.get({mergeFilterAc: false}, function(result){
							filterAcInput.checked = result.mergeFilterAc
							TagFilterMerge(filterNormalInput.checked, filterAcInput.checked, filterLegendInput.checked)
						})
						
					})
					
				})
				
				
				
				
				
				
				
				
			}
			setTimeout(_add,500); 
			// Don't ask it just sometimes doesn't work if timeout isn't specified and then is at beginning of list 
			// timeout fixes that edge case, no idea why it happens negative time loading?? idk.
			// It only appeared when changing css file (Possible that in relase this bug doesn't appears)
			
		})
		
		

	}
			
			
	// Item lists 
	try{
		var isList = document.body.parentElement.innerHTML.includes("Go to"); 
	} 
	catch(err){var isList = false}
	
	try{
		var isLocation = document.body.parentElement.innerHTML.includes("/join"); 
	} 
	catch(err){var isLocation = false}
	
	


	
	// get stored data
	// If WIP in options is enabled.
	chrome.storage.local.get({wipmoreinfo: 1}, function(result){WIP_moreinfo = result.wipmoreinfo;})

	// Get account data (Just not items) 
	chrome.storage.local.get({aqwbuy: []}, function(result){Buy = result.aqwbuy;});
	chrome.storage.local.get({aqwcategory: []}, function(result){Category = result.aqwcategory;});
	chrome.storage.local.get({aqwwhere: []}, function(result){Where = result.aqwwhere;});
	chrome.storage.local.get({aqwtype: []}, function(result){Type = result.aqwtype;});
	
	chrome.storage.local.get({mergeFilterAc: []}, function(result){mergeFilterAc = result.mergeFilterAc;});
	chrome.storage.local.get({mergeFilterNormal: []}, function(result){mergeFilterNormal = result.mergeFilterNormal;});
	chrome.storage.local.get({mergeFilterLegend: []}, function(result){mergeFilterLegend = result.mergeFilterLegend;});
	


	
	
	
	
	
		// Get items and process it 
		chrome.storage.local.get({aqwitems: []}, function(result){
            var Items = result.aqwitems;
            var foundItems = []; // Array to store found item names
            
            // Debug: Log the Items array
            console.log("Total items in inventory:", Items.length);
            console.log("First 10 items:", Items.slice(0, 10));
            
            // Reset the counter for items processed by ProcessWikiItem and analysis data
            totalItemsProcessed = 0;
            itemAnalysisData.ownedItems = [];
            itemAnalysisData.notOwnedItems = [];
            itemAnalysisData.allProcessedItems = [];
            
            if (isMerge) {
                DisplayCostMergeShop(Items, mergeFilterNormal, mergeFilterAc, mergeFilterLegend)
                FilterEvent = updateCostMergeShop.bind(null, Items, mergeFilterNormal, mergeFilterAc, mergeFilterLegend)
                


            }

            
            // Iterate over nodelist with array offset applied 
            for (var x = 0; x < arrayList.length; x++) {
                
                // Store the current found count before processing
                var prevFound = found;
                
                ProcessWikiItem(nodeList, arrayOffset, Items, Buy, Category, Where, Type, x, isMerge, isList, isQuest, isMonster) 
                
                // If found count increased, log what ProcessWikiItem found
                if (found > prevFound) {
                    var itemName = arrayList[x].textContent.trim();
                    console.log("*** ProcessWikiItem FOUND OWNED ITEM:", itemName, "Link:", arrayList[x].href);
                }
                
                // Process item for analysis (collect data for popup)
                processItemForAnalysis(nodeList, arrayOffset, x, Items, Buy, Category, Where, Type);
                
                // Build foundItems array from our analysis data for tooltip
                if (itemAnalysisData.ownedItems.length > foundItems.length) {
                    // New owned item was added
                    const latestOwnedItem = itemAnalysisData.ownedItems[itemAnalysisData.ownedItems.length - 1];
                    if (!foundItems.includes(latestOwnedItem.name)) {
                        foundItems.push(latestOwnedItem.name);
                    }
                }
                
                // Wip process (Can be enabled in options of Extension.
                if (WIP_moreinfo) {
            
                    ProcessAnyWikiItem(nodeList, arrayOffset, Buy, Category, Where, Type, x, isMonster, isQuest, isMerge)
                    
                }
            
            
            }
            
            // Debug output
            console.log("=== FINAL RESULTS ===");
            console.log("ProcessWikiItem found:", found, "owned items");
            console.log("ProcessWikiItem total processed:", totalItemsProcessed);
            console.log("Analysis function - Owned:", itemAnalysisData.ownedItems.length);
            console.log("Analysis function - Not owned:", itemAnalysisData.notOwnedItems.length);
            console.log("Analysis function - Total:", itemAnalysisData.allProcessedItems.length);
            
            // Use our analysis data for the display (more accurate than ProcessWikiItem)
            const ownedCount = itemAnalysisData.ownedItems.length;
            const totalItemsCount = itemAnalysisData.allProcessedItems.length;
            
            // Displays found amount with hover tooltip showing found items
            found_info.innerHTML = "- Found " + ownedCount + " / " + totalItemsCount + " Items" // Use our analysis counts
            
            // Build tooltip from our analysis data
            const ownedItemNames = itemAnalysisData.ownedItems.map(item => item.name);
            found_info.title = ownedItemNames.length > 0 ? 
                "Items you have:\n" + ownedItemNames.join("\n") + "\n\nClick to open Item Analysis" : 
                "No items found\n\nClick to open Item Analysis";
                
            // Save found items and current page for custom farm list integration
            chrome.storage.local.set({lastFoundItems: ownedItemNames}, function() {});
            chrome.storage.local.set({lastWikiPage: window.location.href}, function() {});
            
    })
	
	})
	
	
}

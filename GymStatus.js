// Configuration management
const CONFIG_KEY = "selectedStudio";

// Function to get saved studio configuration
function getSavedStudio() {
    try {
        return Keychain.contains(CONFIG_KEY) ? JSON.parse(Keychain.get(CONFIG_KEY)) : null;
    } catch (e) {
        return null;
    }
}

// Function to save studio configuration
function saveStudio(studio) {
    Keychain.set(CONFIG_KEY, JSON.stringify(studio));
}

// Function to fetch all studios
async function fetchAllStudios() {
    let req = new Request("https://www.ai-fitness.de/connect/v2/studio");
    req.method = "get";
    req.headers = {
        "Accept": "application/json, text/plain, */*",
        "User-Agent": "Scriptable/1.0 (iOS; Scriptable Widget)"
    };
    
    try {
        return await req.loadJSON();
    } catch (e) {
        console.log("Error fetching studios: " + e);
        return [];
    }
}

// Function to show studio selection
async function showStudioSelection(studios) {
    let alert = new Alert();
    alert.title = "Select AI Fitness Studio";
    alert.message = "Choose your preferred studio:";
    
    // Sort studios by name
    studios.sort((a, b) => a.studioName.localeCompare(b.studioName));
    
    // Add studio options
    for (let studio of studios) {
        let displayName = studio.studioName;
        if (studio.address && studio.address.city) {
            displayName += ` (${studio.address.city})`;
        }
        alert.addAction(displayName);
    }
    
    alert.addCancelAction("Cancel");
    
    let response = await alert.presentAlert();
    
    if (response === -1) {
        // User cancelled
        return null;
    }
    
    return studios[response];
}

// Main execution
async function main() {
    // If running in widget, use saved configuration
    if (config.runsInWidget) {
        let savedStudio = getSavedStudio();
        
        if (!savedStudio) {
            console.log("No studio configured. Please run this script in the app first to select a studio.");
            return;
        }
        
        // Use saved studio for widget
        await fetchAndDisplayUtilization(savedStudio);
        return;
    }
    
    // If running in app, always show studio selection
    console.log("Fetching available studios...");
    
    let studios = await fetchAllStudios();
    
    if (studios.length === 0) {
        console.log("No studios found or error occurred.");
        return;
    }
    
    console.log(`Found ${studios.length} studios. Please select one:`);
    
    let selectedStudio = await showStudioSelection(studios);
    
    if (selectedStudio) {
        saveStudio(selectedStudio);
        console.log(`Selected: ${selectedStudio.studioName}`);
        
        // Fetch and display utilization for selected studio
        await fetchAndDisplayUtilization(selectedStudio);
    } else {
        console.log("No studio selected.");
    }
}

// Function to fetch and display utilization data
async function fetchAndDisplayUtilization(studio) {
    let studioId = studio.id;
    let studioName = studio.studioName;
    
    let req = new Request("https://www.ai-fitness.de/connect/v1/studio/" + studioId + "/utilization");
    req.method = "get";
    req.headers = {
        "Accept": "application/json, text/plain, */*",
        "User-Agent": "Scriptable/1.0 (iOS; Scriptable Widget)"
    };

    try {
        let res = await req.loadJSON();

        // Find the current time slot
        let currentItem = null;
        for (let item of res.items) {
            if (item.isCurrent) {
                currentItem = item;
                break;
            }
        }

        let percentage, timeSlot;
        if (currentItem) {
            percentage = currentItem.percentage;
            timeSlot = currentItem.startTime + " - " + currentItem.endTime;
        } else {
            percentage = 0;
            timeSlot = "Gym is closed";
        }

        if (config.runsInWidget) {
            let widget = createWidget(studioName + ' ist zu:', `${percentage}% gefüllt \n${timeSlot}`);
            Script.setWidget(widget);
        } else {
            console.log(studioName + ' ist zu: ' + percentage + '% gefüllt');
            console.log(`Zeit: ${timeSlot}`);
        }

        if (config.runsWithSiri) {
            Speech.speak(studioName + ' ist zu: ' + percentage + '% gefüllt');
        }
        
    } catch (e) {
        console.log("Error fetching utilization data: " + e);
        if (config.runsInWidget) {
            let widget = createWidget("Error", "Could not fetch data");
            Script.setWidget(widget);
        }
    }
}

// Widget creation function
function createWidget(title, subtitle) {
    let w = new ListWidget();
    
    let nextRefresh = Date.now() + 1000 * 60 * 15;
    w.refreshAfterDate = new Date(nextRefresh);
    
    // Create gradient background using AI Fitness brand colors
    let gradient = new LinearGradient();
    gradient.colors = [new Color("#e30613"), Color.dynamic(new Color("#ff6b6b"), new Color("#8b0000"))];
    gradient.locations = [0, 1];
    
    w.backgroundGradient = gradient;
    
    // Add padding
    w.setPadding(12, 12, 12, 12);
    
    // Create main stack
    let mainStack = w.addStack();
    mainStack.layoutVertically();
    mainStack.spacing = 8;
    
    // Title
    let titleTxt = mainStack.addText(title);
    titleTxt.textColor = Color.white();
    titleTxt.font = Font.boldSystemFont(16);
    titleTxt.minimumScaleFactor = 0.7;
    titleTxt.lineLimit = 2;
    
    mainStack.addSpacer(4);
    
    // Percentage display with larger font
    let percentageText = mainStack.addText(subtitle.split('\n')[0]);
    percentageText.textColor = Color.white();
    percentageText.font = Font.boldSystemFont(24);
    percentageText.textOpacity = 1;
    
    mainStack.addSpacer(2);
    
    // Time slot with smaller font
    let timeText = mainStack.addText(subtitle.split('\n')[1] || "");
    timeText.textColor = Color.dynamic(new Color("#59595d"), new Color("#dedede"));
    timeText.font = Font.systemFont(12);
    timeText.textOpacity = 0.9;
    
    // Add bottom spacer for better spacing
    mainStack.addSpacer(4);
    
    return w;
}

// Run the main function
await main();
Script.complete();

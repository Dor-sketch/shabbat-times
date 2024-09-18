document.addEventListener('DOMContentLoaded', function() {
    const updateButton = document.getElementById('updateButton');
    updateButton.addEventListener('click', updateTimes);

    // Load saved city and update times when the popup opens
    chrome.storage.local.get('city', function(data) {
        if (chrome.runtime.lastError) {
            console.error("Error retrieving city:", chrome.runtime.lastError);
        } else if (data.city) {
            document.getElementById('city').value = data.city;
        }
        updateTimes();
    });

    // Update all static text
    updateStaticText();
});

function updateStaticText() {
    document.getElementById('headerText').textContent = chrome.i18n.getMessage('shabbatTimes');
    document.getElementById('city').placeholder = chrome.i18n.getMessage('cityPlaceholder');
    document.getElementById('updateButton').textContent = chrome.i18n.getMessage('updateButton');
    document.getElementById('entrance-label').textContent = chrome.i18n.getMessage('shabbatEntrance') + ':';
    document.getElementById('exit-label').textContent = chrome.i18n.getMessage('shabbatExit') + ':';
}

async function getShabbatTimes(city) {
    const lang = chrome.i18n.getUILanguage().split('-')[0];
    const apiUrl = `https://www.hebcal.com/shabbat?cfg=json&city=${encodeURIComponent(city)}&lg=${lang}`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!data.items || !Array.isArray(data.items)) {
            throw new Error('Invalid response format');
        }
        const items = data.items;
        const entranceItem = items.find(item => item.category === "candles");
        const exitItem = items.find(item => item.category === "havdalah");

        // Helper function to extract time from title
        const extractTime = (title) => {
            const parts = title.split(': ');
            return parts.length > 1 ? parts[parts.length - 1] : title;
        };

        return {
            entrance: entranceItem ? extractTime(entranceItem.title) : chrome.i18n.getMessage('notFound'),
            exit: exitItem ? extractTime(exitItem.title) : chrome.i18n.getMessage('notFound')
        };
    } catch (error) {
        console.error("Error fetching Shabbat times:", error);
        throw error;
    }
}

async function updateTimes() {
    const city = document.getElementById('city').value || "Tel Aviv";
    const entranceTimeElement = document.getElementById('entrance-time');
    const exitTimeElement = document.getElementById('exit-time');
    const errorMessageElement = document.getElementById('error-message');

    try {
        errorMessageElement.textContent = '';
        entranceTimeElement.textContent = chrome.i18n.getMessage('loading');
        exitTimeElement.textContent = chrome.i18n.getMessage('loading');

        const times = await getShabbatTimes(city);

        // Update the display with localized labels
        document.getElementById('entrance-label').textContent = chrome.i18n.getMessage('shabbatEntrance') + ':';
        document.getElementById('exit-label').textContent = chrome.i18n.getMessage('shabbatExit') + ':';

        entranceTimeElement.textContent = times.entrance;
        exitTimeElement.textContent = times.exit;

        // Save the city for next time
        chrome.storage.local.set({ city: city }, () => {
            if (chrome.runtime.lastError) {
                console.error("Error saving city:", chrome.runtime.lastError);
            }
        });

        // Update the header with the next Friday's date
        updateHeader();
    } catch (error) {
        entranceTimeElement.textContent = chrome.i18n.getMessage('error');
        exitTimeElement.textContent = chrome.i18n.getMessage('error');
        errorMessageElement.textContent = `${chrome.i18n.getMessage('errorLoading')}: ${error.message}`;
        console.error("Error updating times:", error);
    }
}

function getNextFriday(date) {
    const dayOfWeek = date.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
    const nextFriday = new Date(date);
    nextFriday.setDate(date.getDate() + daysUntilFriday);
    return nextFriday;
}

function updateHeader() {
    const d = new Date();
    const nextFriday = getNextFriday(d);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formatter = new Intl.DateTimeFormat(chrome.i18n.getUILanguage(), options);
    document.getElementById('headerText').textContent = `${chrome.i18n.getMessage('shabbatTimesFor')} ${formatter.format(nextFriday)}`;
}
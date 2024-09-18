document.addEventListener('DOMContentLoaded', function() {
    const updateButton = document.getElementById('updateButton');
    updateButton.addEventListener('click', updateTimes);

    // Update times when the popup opens
    updateTimes();
});

async function getShabbatTimes(city) {
    const apiUrl = `https://www.hebcal.com/shabbat?cfg=json&city=${encodeURIComponent(city)}&lg=he`;
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
        return {
            entrance: entranceItem ? entranceItem.title.split(": ")[1] : "לא נמצא",
            exit: exitItem ? exitItem.title.split(": ")[1] : "לא נמצא"
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
        entranceTimeElement.textContent = 'טוען...';
        exitTimeElement.textContent = 'טוען...';

        const times = await getShabbatTimes(city);
        entranceTimeElement.textContent = times.entrance;
        exitTimeElement.textContent = times.exit;

        // Update the header with the next Friday's date
        updateHeader();
    } catch (error) {
        entranceTimeElement.textContent = 'שגיאה';
        exitTimeElement.textContent = 'שגיאה';
        errorMessageElement.textContent = `שגיאה בטעינת הנתונים: ${error.message}`;
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
    const formatter = new Intl.DateTimeFormat('he-IL', options);
    document.querySelector('h1').textContent = `זמני שבת ליום ${formatter.format(nextFriday)}`;
}
chrome.runtime.onInstalled.addListener(() => {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchCityName(latitude, longitude);
      },
      (error) => {
        console.warn("Geolocation error:", error.message);
        setDefaultCity();
      },
      { timeout: 10000 } // Set a 10-second timeout
    );
  } else {
    console.warn("Geolocation not available");
    setDefaultCity();
  }
});

function setDefaultCity() {
  chrome.storage.local.set({ city: "Tel Aviv" }, () => {
    if (chrome.runtime.lastError) {
      console.error("Error setting default city:", chrome.runtime.lastError);
    } else {
      console.log("Default city set to Tel Aviv");
    }
  });
}

async function fetchCityName(latitude, longitude) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=en`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const city = data.address.city || data.address.town || data.address.village || "Tel Aviv";
    chrome.storage.local.set({ city }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error saving city:", chrome.runtime.lastError);
      } else {
        console.log("City set to", city);
      }
    });
  } catch (error) {
    console.error("Error fetching city name:", error);
    setDefaultCity();
  }
}
document.addEventListener("DOMContentLoaded", () => {
  // Event fired when the DOM is fully loaded
  console.log("ironhack-project2 JS imported successfully!");

  const searchInput = document.getElementById('search');
  const searchForm = document.getElementById('searchForm');

  if (searchInput && searchForm) {
    // Add event listener for input in the search field
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim(); // Get the input value and trim unnecessary whitespace
      searchItems(query); // Call the search function with the input value
    });

    // Add event listener for submit in the search form
    searchForm.addEventListener('submit', (event) => {
      event.preventDefault(); // Prevent default form behavior
      const query = searchInput.value.trim(); // Get the input value and trim unnecessary whitespace
      searchItems(query); // Call the search function with the input value
    });
  }
});

async function searchItems(query) {
  if (!query) return; // Skip if the input is empty

  try {
    const response = await fetch(`/search?q=${query}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const {users} = await response.json();
    console.log(users);
    const results = document.getElementById('results');
    results.innerHTML = ''; // Clear previous results

    if (users.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No users found'; // Message if no users are found (Not working)
      results.appendChild(li);
    } else {
      // Create an <li> for each user found (or at least it should...)
      users.forEach(user => {
        const li = document.createElement('li');
        li.textContent = `${user.username} - ${user.country}`;
        results.appendChild(li);
      });
    }
  } catch (error) {
    console.error('Error fetching or parsing data:', error.message);
    // You can add code here to display a user-friendly error message on the page
  }
}

function getLanguageName(langCode) {
  return langList[langCode];
}

function getLanguageCode(langName) {
  for (let code in langList) {
    if (langList[code] == langName) return code;
  }
}

function formatDate(birthdate) {
  let date = new Date(birthdate);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const day = date.getUTCDate();
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();

  const ordinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };

  return `${day}${ordinalSuffix(day)} ${month} ${year}`;
}

function getUserAge(birthdate) {
  const date = new Date(birthdate);
  const today = new Date();

  let age = today.getFullYear() - date.getFullYear();
  const monthDifference = today.getMonth() - date.getMonth();
  const dayDifference = today.getDate() - date.getDate();

  if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
    age--;
  }

  return age;
}

const langList = {
  'es': 'Spanish',
  'it': 'Italian',
  'pt': 'Portuguese',
  'fr': 'French',
  'de': 'German',
  'ru': 'Russian',
  'nl': 'Dutch',
  'zh': 'Chinese',
  'hu': 'Hungarian',
  'he': 'Hebrew',
  'ar': 'Arabic',
  'pl': 'Polish',
  'ro': 'Romanian',
  'jp': 'Japanese',
  'kr': 'Korean',
};

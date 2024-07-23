// Debounce function to limit the rate at which a function can fire.
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    // Clear the previous timeout
    clearTimeout(timeout);
    // Set a new timeout
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById('search'); // Get the search input element
  const searchForm = document.getElementById('searchForm'); // Get the search form element

  if (searchInput && searchForm) { // Ensure both elements exist
    // Create a debounced version of the search function
    const debouncedSearch = debounce(() => {
      const query = searchInput.value.trim(); // Get the trimmed value of the search input
      searchItems(query); // Call searchItems with the query
    }, 300); // 300 milliseconds debounce delay

    // Add input event listener to the search input
    searchInput.addEventListener('input', debouncedSearch);

    // Add submit event listener to the search form
    searchForm.addEventListener('submit', (event) => {
      event.preventDefault(); // Prevent the form from submitting normally
      const query = searchInput.value.trim(); // Get the trimmed value of the search input
      searchItems(query); // Call searchItems with the query
    });
  }
});

async function searchItems(query) {
  const results = document.getElementById('results'); // Get the results container element
  results.innerHTML = ''; // Clear any previous results

  if (!query) return; // If the query is empty, exit the function

  try {
    // Make an asynchronous fetch request to the search endpoint with the query
    const response = await fetch(`/search?q=${query}`);
    if (!response.ok) {
      throw new Error('Network response was not ok'); // Handle non-200 HTTP responses
    }
    const { users } = await response.json(); // Parse the JSON response

    // If no users were found, display a message
    if (users.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No users or languages found';
      li.classList.add('overlay-li', 'list-group-item');
      results.appendChild(li);
    } else {
      // Iterate through the users and create list items for each one
      users.forEach(user => {
        const li = document.createElement('li');
        li.classList.add('overlay-li', 'list-group-item', 'd-flex', 'align-items-center');

        const img = document.createElement('img');
        img.src = user.profilePic || '/Profile-PNG-File.png'; // Use default image if profilePic is missing
        img.alt = `${user.username}'s profile picture`;
        img.classList.add('rounded-circle', 'me-3');
        img.style.width = '50px';
        img.style.height = '50px';

        const userInfo = document.createElement('span');
        userInfo.textContent = `${user.username} - ${user.country}`;

        li.appendChild(img); // Add image to the list item
        li.appendChild(userInfo); // Add user info to the list item
        results.appendChild(li); // Add the list item to the results container
      });
    }
  } catch (error) {
    // Log any errors that occur during fetch or JSON parsing
    console.error('Error fetching or parsing data:', error.message);
  }
}
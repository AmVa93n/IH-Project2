// Debounce function to limit how frequently a function is called
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout); // Cancel any previously scheduled execution
    timeout = setTimeout(() => func.apply(context, args), wait); // Schedule a new execution after the specified delay
  };
}

// Waits for the DOM to be fully loaded before executing the code
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById('search'); // Gets the search input element
  const searchForm = document.getElementById('searchForm'); // Gets the search form

  if (searchInput) {
    searchInput.value = ''; // Clears the value of the search input
    searchInput.setAttribute('autocomplete', 'off'); // Disables browser autocomplete
  }

  if (searchInput && searchForm) {
    // Creates a debounced version of the search function with a 300ms delay
    const debouncedSearch = debounce(() => {
      const query = searchInput.value.trim(); // Gets and trims the value of the input
      searchItems(query); // Calls the search function with the input value
    }, 300);

    // Adds an event listener to the search input to trigger the debounced search function
    searchInput.addEventListener('input', debouncedSearch);

    // Adds an event listener to the form submission
    searchForm.addEventListener('submit', (event) => {
      event.preventDefault(); // Prevents the default form submission behavior
      const query = searchInput.value.trim(); // Gets and trims the value of the input
      searchItems(query); // Calls the search function with the input value
    });
  }
});

// Async function to search for items based on the query
async function searchItems(query) {
  const results = document.getElementById('results'); // Gets the element where results will be displayed
  results.innerHTML = ''; // Clears previous results

  if (!query) return; // If the query is empty, do nothing

  try {
    const response = await fetch(`/search?q=${query}`); // Makes a request to the API with the query
    if (!response.ok) {
      throw new Error('Network response was not ok'); // Throws an error if the network response is not ok
    }
    const { users } = await response.json(); // Parses the response as JSON and extracts the users array

    if (users.length === 0) {
      // If no users are found, display a message indicating no results
      const li = document.createElement('li');
      li.textContent = 'No users or languages found';
      li.classList.add('overlay-li', 'list-group-item');
      results.appendChild(li);
    } else {
      // If users are found, create list items for each user
      users.forEach(user => {
        const li = document.createElement('li');
        li.classList.add('overlay-li', 'list-group-item', 'd-flex', 'align-items-center');

        // Create the link element
        const link = document.createElement('a');
        link.href = `/users/${user._id}`; // Update the URL to the correct route
        link.classList.add('d-flex', 'align-items-center', 'w-100', 'text-decoration-none', 'text-dark');

        // Create and configure the user image
        const img = document.createElement('img');
        img.src = user.profilePic ? `/uploads/${user.profilePic}` : '/images/Profile-PNG-File.png'; // Sets the profile picture or a default image
        img.alt = `${user.username}'s profile picture`; // Sets the alt text for the image
        img.classList.add('rounded-circle', 'me-3');
        img.style.width = '50px';
        img.style.height = '50px';

        // Create and configure the user info text
        const userInfo = document.createElement('span');
        userInfo.textContent = `${user.username} - ${user.country}`; // Sets the text with the user's name and country

        // Add the image and user info to the link
        link.appendChild(img);
        link.appendChild(userInfo);

        // Add the link to the list item
        li.appendChild(link);

        // Add the list item to the results container
        results.appendChild(li);
      });
    }
  } catch (error) {
    console.error('Error fetching or parsing data:', error.message); // Logs errors to the console
  }
}
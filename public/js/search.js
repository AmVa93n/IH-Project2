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
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById('search');
  const searchForm = document.getElementById('searchForm');

  if (searchInput && searchForm) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim();
      searchItems(query);
    });

    searchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const query = searchInput.value.trim();
      searchItems(query);
    });
  }
});

async function searchItems(query) {
  if (!query) return;

  try {
    const response = await fetch(`/search?q=${query}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const { users } = await response.json();
    const results = document.getElementById('results');
    results.innerHTML = '';

    if (users.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No users or languages found';
      li.classList.add('overlay-li', 'list-group-item');
      results.appendChild(li);
    } else {
      users.forEach(user => {
        const li = document.createElement('li');
        li.classList.add('overlay-li', 'list-group-item', 'd-flex', 'align-items-center');

        const img = document.createElement('img');
        img.src = user.profilePic || 'public/Profile-PNG-File.png';
        img.alt = `${user.username}'s profile picture`;
        img.classList.add('rounded-circle', 'me-3');
        img.style.width = '50px';
        img.style.height = '50px';

        const userInfo = document.createElement('span');
        userInfo.textContent = `${user.username} - ${user.country}`;

        li.appendChild(img);
        li.appendChild(userInfo);
        results.appendChild(li);
      });
    }
  } catch (error) {
    console.error('Error fetching or parsing data:', error.message);
  }
}
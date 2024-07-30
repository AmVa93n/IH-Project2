document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/api/users');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const users = await response.json();

    const languageCounts = {};

    users.forEach(user => {
      user.lang_teach.forEach(lang => {
        if (!languageCounts[lang]) {
          languageCounts[lang] = 0;
        }
        languageCounts[lang]++;
      });
    });

    const resultsContainer = document.getElementById('results');

    Object.keys(languageCounts).forEach(lang => {
      const languageElement = document.createElement('div');
      languageElement.classList.add('language-info', 'mb-3');
      languageElement.innerHTML = `
        <img src="/images/${lang}.svg" alt="${lang}" class="country-flag">
        <h5>${lang.toUpperCase()}</h5>
        <p>Professores: ${languageCounts[lang]}</p>
      `;
      resultsContainer.appendChild(languageElement);
    });
  } catch (error) {
    console.error('Error fetching users:', error);
  }
});

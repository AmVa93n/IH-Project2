// https://developer.mozilla.org/en-US/docs/Web/API/Window/DOMContentLoaded_event
document.addEventListener("DOMContentLoaded", () => {
  //console.log("ironhack-project2 JS imported successfully!");
});

const langList = {
  'es': 'Spanish',
  'it': 'Italian',
  'pt': 'Portugese',
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
}

function getLanguageName(langCode) {
  return langList[langCode]
}

function getLanguageCode(langName) {
  for (let code in langList) {
    if (langList[code] == langName) return code
  }
}

function formatDate(birthdate) {
  let date = new Date(birthdate)
  const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
  ];

  const day = date.getUTCDate();
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();

  // Get the correct ordinal suffix for the day
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

  // Calculate the age
  let age = today.getFullYear() - date.getFullYear();
  const monthDifference = today.getMonth() - date.getMonth();
  const dayDifference = today.getDate() - date.getDate();

  // Adjust age if the birth date hasn't occurred yet this year
  if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
    age--;
  }

  return age;
}
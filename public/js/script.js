document.addEventListener("DOMContentLoaded", () => {
});

function getLanguageName(langCode) {
  return langList[langCode];
}

function getLanguageCode(langName) {
  for (let code in langList) {
    if (langList[code] == langName) return code;
  }
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function formatDate(birthdate) {
  let date = new Date(birthdate);
  
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

function getMsgTime(timestamp) {
  const date = new Date(timestamp); // Parse the timestamp into a Date object
  return date.toLocaleTimeString().slice(0, 5)
}

function getMsgDate(timestamp) {
  const date = new Date(timestamp); // Parse the timestamp into a Date object
  const day = date.getDate()
  const month = months[date.getMonth()]
  return day + " " + month
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

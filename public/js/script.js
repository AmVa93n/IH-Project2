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
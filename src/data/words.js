// Mots courants souvent mal orthographiés, classés par niveau. fr = traduction de secours.
export const LEVELS = [
  { id: 'A', label: 'A1–A2', hint: 'Débutant' },
  { id: 'B', label: 'B1–B2', hint: 'Intermédiaire' },
  { id: 'C', label: 'C1', hint: 'Avancé' },
]

const w = (word, fr) => ({ w: word.toLowerCase(), fr })

export const WORDS = {
  A: [
    w('friend', 'ami'), w('people', 'gens'), w('because', 'parce que'),
    w('beautiful', 'beau'), w('school', 'école'), w('family', 'famille'),
    w('different', 'différent'), w('tomorrow', 'demain'), w('weather', 'météo'),
    w('breakfast', 'petit-déjeuner'), w('answer', 'réponse'), w('country', 'pays'),
    w('Wednesday', 'mercredi'), w('vegetable', 'légume'),
  ],
  B: [
    w('receive', 'recevoir'), w('believe', 'croire'), w('necessary', 'nécessaire'),
    w('environment', 'environnement'), w('government', 'gouvernement'), w('separate', 'séparer'),
    w('definitely', 'certainement'), w('knowledge', 'connaissance'), w('address', 'adresse'),
    w('schedule', 'emploi du temps'), w('comfortable', 'confortable'), w('achievement', 'réussite'),
    w('experience', 'expérience'), w('success', 'succès'),
  ],
  C: [
    w('accommodate', 'loger, accueillir'), w('conscientious', 'consciencieux'), w('occurrence', 'occurrence'),
    w('rhythm', 'rythme'), w('entrepreneur', 'entrepreneur'), w('surveillance', 'surveillance'),
    w('pronunciation', 'prononciation'), w('questionnaire', 'questionnaire'), w('miscellaneous', 'divers'),
    w('perseverance', 'persévérance'), w('sovereignty', 'souveraineté'), w('bureaucracy', 'bureaucratie'),
    w('unnecessary', 'inutile'), w('privilege', 'privilège'),
  ],
}

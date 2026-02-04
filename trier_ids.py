import json

# Ordre logique des phases pour le tri
# Tu peux modifier cet ordre si tes phases ont des noms différents
ORDRE_PHASES = {
    "Poules": 1,
    "32èmes": 2,
    "16èmes": 3,
    "8èmes": 4,
    "Quarts": 5,
    "Demis": 6,
    "Finale": 7,
    "Autre": 8
}

def reorganiser_ids():
    # 1. Charger le fichier
    nom_fichier = 'data.json' # Assure-toi que c'est le bon nom
    with open(nom_fichier, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"Nombre de matchs avant tri : {len(data['matchs'])}")

    # 2. Définir la clé de tri (Date puis Phase)
    def cle_de_tri(match):
        # Critère 1 : La date (ex: "2024-09")
        date = match.get('date', '9999-99')
        
        # Critère 2 : La phase (convertie en nombre grâce au dictionnaire)
        nom_phase = match.get('phase', '')
        # Si la phase n'est pas connue, on la met à la fin (99)
        rang_phase = ORDRE_PHASES.get(nom_phase, 99)
        
        return (date, rang_phase)

    # 3. Appliquer le tri
    # Python trie d'abord par le premier élément du tuple (date), 
    # puis par le second (rang_phase) si les dates sont identiques.
    data['matchs'].sort(key=cle_de_tri)

    # 4. Réattribuer les ID de 1 à N
    for index, match in enumerate(data['matchs']):
        match['id'] = index + 1

    # 5. Sauvegarder dans un nouveau fichier
    fichier_sortie = 'data.json'
    with open(fichier_sortie, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Succès ! Les matchs sont triés et les IDs vont de 1 à {len(data['matchs'])}.")
    print(f"Nouveau fichier créé : {fichier_sortie}")

if __name__ == "__main__":
    reorganiser_ids()
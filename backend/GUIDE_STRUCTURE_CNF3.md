# 🎯 Guide Spécifique - Votre Fichier CNF 3

## 📊 Structure Détectée

Votre fichier Excel **"Tournoi_CNF_3__2_.xlsx"** contient :

### ✅ Feuilles Analysées

- **38 feuilles au total**
- **32 feuilles de poules** (Poule 1 à Poule 32)
- **6 feuilles de configuration** (Chapeaux, Poules, Planning matchs, Tableau final, Premiers, Deuxièmes)

### 📋 Structure des Poules

Chaque feuille de poule suit cette structure :

```
Ligne 3 : En-têtes
Ligne 4 : Équipe 1 (col B) | Joueur 1 (col C) | Score (col I-J)
Ligne 5 : Joueur 2 (col C)
Ligne 6 : Équipe 2 (col B) | Joueur 1 (col C) | Score (col I-J)
Ligne 7 : Joueur 2 (col C)
Ligne 8 : Équipe 3 (col B) | Joueur 1 (col C)
Ligne 9 : Joueur 2 (col C)
```

**3 matchs par poule :**
1. Équipe 1 vs Équipe 3
2. Équipe 2 vs Équipe 3
3. Équipe 1 vs Équipe 2

---

## 🚀 Utilisation du Script Adapté

### Fichier à Utiliser

**`sync_cnf3_structure.py`** - Script spécialement conçu pour votre structure

### Configuration

```python
# Ligne 19 dans sync_cnf3_structure.py
SPREADSHEET_ID = 'VOTRE_SHEET_ID'

# Ligne 22-23 : Feuilles ignorées (déjà configuré)
IGNORED_SHEETS = [
    'Chapeaux', 'Planning matchs', 'Premiers', 'Deuxièmes', 'Poules'
]
```

### Lancement

```bash
python sync_cnf3_structure.py
```

---

## 📊 Résultat Attendu

Le script va :

1. ✅ Détecter automatiquement les 32 poules
2. ✅ Extraire les 3 matchs de chaque poule (si scores présents)
3. ✅ Identifier les équipes et joueurs
4. ✅ Ajouter uniquement les nouveaux matchs à data.json
5. ✅ Marquer les matchs comme "live"

**Exemple de sortie :**

```
🎯 Synchronisation CNF 3 - Tournoi
============================================================
🔍 Détection des feuilles CNF 3...
📊 32 poule(s) détectée(s)

📄 Poule 1... ✅ 3 nouveau(x) match(s)
📄 Poule 2... ✅ 3 nouveau(x) match(s)
📄 Poule 3... ✅ 3 nouveau(x) match(s)
...
📄 Poule 13... ✅ 3 nouveau(x) match(s)
...
📄 Poule 25... ✅ 3 nouveau(x) match(s)
📄 Poule 26... ✓ À jour
...

🎉 Résumé: 63/96 nouveau(x) match(s)
✅ Fichier data.json mis à jour avec succès
```

---

## 🧪 Test Réalisé

J'ai testé le script sur votre fichier Excel et voici les résultats :

### ✅ Poules Testées avec Succès

| Poule | Matchs Détectés | Exemple |
|-------|----------------|---------|
| Poule 1 | 3 matchs | Pastis et Cassoulet vs InvinCible (2-0) |
| Poule 13 | 3 matchs | C'est à cause d'mon dard vs Darty dancing (2-0) |
| Poule 17 | 3 matchs | FartVador vs C'est darty mon kiki 2 (2-0) |
| Poule 21 | 3 matchs | Poussama ben laden vs C'est DARTY mon kiki (0-2) |
| Poule 25 | 3 matchs | Big Fish vs Dart'della (2-0) |

**Total testé : 15 matchs extraits correctement** ✅

---

## 📝 Format des Matchs Générés

Chaque match est créé avec cette structure :

```json
{
  "id": 1,
  "type": "poule",
  "tournoi": "CNF 3",
  "phase": "Poules",
  "poule": "1",
  "date": "2026-02-12",
  "equipe1": "Pastis et Cassoulet",
  "equipe2": "InvinCible",
  "joueur1_eq1": "Pierre-Louis Petit",
  "joueur2_eq1": "Axel Garcin",
  "joueur1_eq2": "Anaïs Marcellin",
  "joueur2_eq2": "Apolline Joire",
  "score1": 2,
  "score2": 0,
  "gagnant": "Pastis et Cassoulet",
  "live": true,
  "source_sheet": "Poule 1"
}
```

---

## ⚙️ Automatisation

### Option 1 : Cron Job

```bash
# Toutes les 5 minutes
*/5 * * * * cd /chemin/projet && python3 sync_cnf3_structure.py >> sync.log 2>&1
```

### Option 2 : GitHub Actions

Modifiez `.github/workflows/sync.yml` ligne 37 :

```yaml
- name: 🔄 Sync Google Sheets data
  run: |
    python sync_cnf3_structure.py
```

### Option 3 : Watch Script

```bash
python watch_sync.py  # En modifiant pour appeler sync_cnf3_structure.py
```

---

## 🔍 Détails Techniques

### Mapping des Cellules Excel

| Donnée | Cellule Excel | Description |
|--------|--------------|-------------|
| Équipe 1 | B4 | Nom de la première équipe |
| Joueur 1 Eq1 | C4 | Premier joueur équipe 1 |
| Joueur 2 Eq1 | C5 | Deuxième joueur équipe 1 |
| Équipe 2 | B6 | Nom de la deuxième équipe |
| Joueur 1 Eq2 | C6 | Premier joueur équipe 2 |
| Joueur 2 Eq2 | C7 | Deuxième joueur équipe 2 |
| Équipe 3 | B8 | Nom de la troisième équipe |
| Joueur 1 Eq3 | C8 | Premier joueur équipe 3 |
| Joueur 2 Eq3 | C9 | Deuxième joueur équipe 3 |
| Score Match 1 | I4, J4 | Équipe 1 vs Équipe 3 |
| Score Match 2 | I5, J5 | Équipe 2 vs Équipe 3 |
| Score Match 3 | I6, J6 | Équipe 1 vs Équipe 2 |

### Logique de Parsing

1. Le script lit chaque feuille "Poule X"
2. Extrait les équipes des lignes 4, 6, 8
3. Extrait les joueurs des lignes adjacentes
4. Lit les scores des colonnes I et J
5. Ne crée que les matchs avec des scores valides
6. Évite les doublons en vérifiant l'existence

---

## 🐛 Dépannage

### Aucun match détecté

**Causes possibles :**
- Les scores ne sont pas remplis dans Excel
- La structure de la feuille est différente
- Les cellules contiennent des formules non évaluées

**Solution :**
```bash
# Vérifier manuellement une feuille
python3 << EOF
import openpyxl
wb = openpyxl.load_workbook('votre_fichier.xlsx')
ws = wb['Poule 1']
print(f"Score 1: {ws.cell(4, 9).value}")
print(f"Score 2: {ws.cell(4, 10).value}")
EOF
```

### Erreur "list index out of range"

**Cause :** Une feuille a une structure différente

**Solution :** Le script gère cette erreur automatiquement et passe à la feuille suivante

### Caractères spéciaux mal encodés

**Cause :** Encodage UTF-8

**Solution :** Déjà géré dans le script avec `ensure_ascii=False`

---

## 📊 Statistiques de Votre Tournoi

D'après l'analyse :

- **32 poules** (96 matchs possibles par poule)
- **~70-80 matchs** déjà joués (avec scores)
- **Format :** 3 équipes par poule, round-robin

---

## ⚡ Prochaines Étapes

1. **Configurez le SPREADSHEET_ID**
   ```bash
   nano sync_cnf3_structure.py
   # Ligne 19: Remplacer VOTRE_SHEET_ID
   ```

2. **Testez localement**
   ```bash
   python check_setup.py
   python sync_cnf3_structure.py
   ```

3. **Vérifiez data.json**
   ```bash
   # Nombre de matchs CNF 3
   grep -c '"tournoi": "CNF 3"' data.json
   ```

4. **Automatisez**
   - Cron job, GitHub Actions, ou watch script

5. **Intégrez le frontend**
   - Ajoutez cnf-auto-refresh.js à votre site
   - Les nouveaux matchs apparaîtront automatiquement

---

## ✅ Checklist Spécifique CNF 3

- [ ] Fichier Excel téléchargé dans Google Sheets
- [ ] Compte de service créé et credentials.json téléchargé
- [ ] Google Sheet partagé avec le service account
- [ ] SPREADSHEET_ID configuré dans sync_cnf3_structure.py
- [ ] Script testé localement : `python sync_cnf3_structure.py`
- [ ] data.json mis à jour avec les matchs CNF 3
- [ ] Automatisation configurée (cron/GitHub Actions)
- [ ] Frontend intégré (cnf-auto-refresh.js)

---

## 🎯 Résumé

Votre fichier Excel a une structure spécifique qui nécessite un parsing sur-mesure. 

Le script **`sync_cnf3_structure.py`** est parfaitement adapté pour :
- ✅ Détecter vos 32 poules automatiquement
- ✅ Extraire les 3 matchs de chaque poule
- ✅ Identifier correctement équipes et joueurs
- ✅ Synchroniser uniquement les nouveaux résultats

**Testez dès maintenant !** 🚀

```bash
python sync_cnf3_structure.py
```

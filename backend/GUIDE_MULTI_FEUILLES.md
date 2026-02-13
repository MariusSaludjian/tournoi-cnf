# 📊 Guide Multi-Feuilles - Google Sheets avec plusieurs onglets

## 🎯 Votre Situation

Vous avez un fichier Excel/Google Sheets avec **plusieurs feuilles** (onglets) contenant des résultats de matchs.

**✅ C'est parfait !** Le système est fait pour gérer plusieurs feuilles.

---

## 🔧 Trois Options Disponibles

### Option 1 : Script Standard (2 feuilles spécifiques)

**Utilisez:** `sync_google_sheets.py`

**Pour:** Synchroniser uniquement 2 feuilles spécifiques

**Configuration:**
```python
# Dans sync_google_sheets.py, ligne 153
sheet_names = ["Poules", "Tableau final"]

# Remplacez par VOS noms de feuilles:
sheet_names = ["Phase de Poules", "Playoffs"]
```

### Option 2 : Script Multi-Feuilles (TOUTES les feuilles) ⭐ RECOMMANDÉ

**Utilisez:** `sync_multi_sheets.py` (nouveau fichier créé)

**Pour:** Synchroniser automatiquement TOUTES les feuilles de votre fichier

**Avantages:**
- ✅ Détecte automatiquement tous les onglets
- ✅ Pas besoin de modifier le code
- ✅ Ignore les feuilles indésirables (Config, Archive, etc.)

**Configuration:**
```python
# Dans sync_multi_sheets.py, ligne 21
IGNORED_SHEETS = ['Config', 'Brouillon', 'Template', 'Archive']

# Ajoutez les noms des feuilles que vous voulez IGNORER
```

### Option 3 : Liste Personnalisée

**Utilisez:** `sync_google_sheets.py` avec modification

**Configuration:**
```python
# Ligne 153, listez TOUTES vos feuilles
sheet_names = [
    "Poule A",
    "Poule B", 
    "Poule C",
    "Quarts",
    "Demi-finales",
    "Finale"
]
```

---

## 📋 Structure Requise pour Chaque Feuille

**Chaque feuille doit avoir ces colonnes (dans cet ordre):**

| Poule | Équipe 1 | Joueur 1 Eq1 | Joueur 2 Eq1 | Équipe 2 | Joueur 1 Eq2 | Joueur 2 Eq2 | Score 1 | Score 2 |
|-------|----------|--------------|--------------|----------|--------------|--------------|---------|---------|

**Notes:**
- La **première ligne** doit être l'en-tête
- Les **scores vides** = match non joué (sera ignoré)
- Le système détectera automatiquement la phase selon le nom de la feuille

---

## 🚀 Utilisation du Script Multi-Feuilles

### 1. Installation (identique)

```bash
pip install -r requirements.txt
```

### 2. Configuration

```bash
# Éditer sync_multi_sheets.py
# Ligne 19: Remplacer SPREADSHEET_ID
SPREADSHEET_ID = 'votre-id-ici'

# Ligne 21: Ajouter feuilles à ignorer (optionnel)
IGNORED_SHEETS = ['Config', 'Archive']
```

### 3. Lancement

```bash
python sync_multi_sheets.py
```

**Sortie attendue:**
```
🔍 Détection des feuilles disponibles...
📊 5 feuille(s) détectée(s): Poule A, Poule B, Quarts, Demis, Finale

📄 Synchronisation de 'Poule A'...
  ✨ Team A vs Team B (2-1)
  ✨ Team C vs Team D (2-0)
  ✅ 2 nouveau(x) match(s) ajouté(s)

📄 Synchronisation de 'Poule B'...
  ✓ Aucun nouveau match dans cette feuille

...

🎉 Résumé: 8/15 nouveau(x) match(s) ajouté(s)
```

---

## 🎨 Détection Automatique des Phases

Le script détecte automatiquement la phase selon le **nom de la feuille**:

| Nom de la feuille | Phase détectée |
|-------------------|----------------|
| "Poule A", "Groupe 1", "Pool A" | → **Poules** |
| "Finale" | → **Finale** |
| "Demi-finale", "Demi" | → **Demi-finales** |
| "Quart", "1/4" | → **Quarts de finale** |
| "Huitieme", "1/8" | → **Huitièmes de finale** |
| Autre nom | → Nom de la feuille |

**Personnalisation:**
Modifiez la fonction `_determine_phase()` lignes 152-171 dans `sync_multi_sheets.py`

---

## 💡 Exemples de Configuration

### Exemple 1 : Tournoi avec Poules + Tableau

**Feuilles dans votre Excel:**
- Poule 1
- Poule 2
- Poule 3
- Quarts
- Demi-finales
- Finale

**Solution:** Utilisez `sync_multi_sheets.py` sans modification

```python
IGNORED_SHEETS = []  # Synchronise tout
```

### Exemple 2 : Plusieurs Tournois dans le même fichier

**Feuilles:**
- CNF3_Poules
- CNF3_Finale
- CNF2_Archive (à ignorer)
- Config (à ignorer)

**Solution:**
```python
IGNORED_SHEETS = ['CNF2_Archive', 'Config']
```

### Exemple 3 : Feuilles spécifiques uniquement

**Vous voulez synchroniser seulement "Poule A" et "Finale":**

**Solution:** Utilisez `sync_google_sheets.py`
```python
sheet_names = ["Poule A", "Finale"]
```

---

## 🔄 Automatisation Multi-Feuilles

### Cron Job

```bash
# Toutes les 5 minutes
*/5 * * * * cd /chemin/projet && python3 sync_multi_sheets.py >> sync.log 2>&1
```

### GitHub Actions

Modifiez `.github/workflows/sync.yml`:

```yaml
# Ligne 37, remplacez:
python sync_google_sheets.py

# Par:
python sync_multi_sheets.py
```

### Watch Script

Créez `watch_multi_sheets.py`:

```python
#!/usr/bin/env python3
import time
import schedule
import subprocess

def run_sync():
    subprocess.run(['python3', 'sync_multi_sheets.py'])

schedule.every(5).minutes.do(run_sync)
run_sync()  # Exécution immédiate

while True:
    schedule.run_pending()
    time.sleep(1)
```

---

## 🐛 Résolution de Problèmes

### "Aucune feuille trouvée"
**Cause:** SPREADSHEET_ID incorrect ou credentials invalides  
**Solution:** 
```bash
python check_setup.py
```

### Certaines feuilles sont ignorées
**Cause:** Elles sont dans `IGNORED_SHEETS`  
**Solution:** Retirez-les de la liste ligne 21

### Mauvaise détection de phase
**Cause:** Nom de feuille non reconnu  
**Solution:** Modifiez `_determine_phase()` pour ajouter votre cas

### Erreur "IndexError: list index out of range"
**Cause:** Une feuille n'a pas le bon nombre de colonnes  
**Solution:** Vérifiez que toutes les feuilles ont 9 colonnes minimum

---

## 📊 Comparaison des Scripts

| Fonctionnalité | sync_google_sheets.py | sync_multi_sheets.py |
|----------------|----------------------|---------------------|
| Feuilles fixes | ✅ 2 feuilles | ❌ |
| Détection auto | ❌ | ✅ Toutes les feuilles |
| Liste ignorées | ❌ | ✅ Configurable |
| Détection phase | ❌ Manuelle | ✅ Automatique |
| Traçabilité | ❌ | ✅ Source sheet |

---

## ✅ Checklist

Avant de commencer:

- [ ] J'ai plusieurs feuilles dans mon Google Sheet
- [ ] Chaque feuille a la même structure (9 colonnes)
- [ ] J'ai décidé quelle option utiliser
- [ ] J'ai configuré `SPREADSHEET_ID`
- [ ] J'ai (optionnel) configuré `IGNORED_SHEETS`
- [ ] J'ai testé avec `python sync_multi_sheets.py`

---

## 🎯 Résumé

**Votre Excel avec plusieurs feuilles = ✅ Parfait !**

1. **Utilisez `sync_multi_sheets.py`** pour tout synchroniser automatiquement
2. **Configurez `IGNORED_SHEETS`** pour ignorer certaines feuilles
3. **Lancez** et le script fera le reste !

Le système détectera automatiquement vos feuilles, identifiera les phases, et synchronisera tous vos matchs. 🎉

---

**Des questions ? Consultez le `GUIDE_SYNCHRONISATION.md` complet**

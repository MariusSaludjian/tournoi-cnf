# 🎯 Package Complet : Synchronisation Automatique CNF 3

## 📦 Contenu du Package

Ce package contient tous les fichiers nécessaires pour synchroniser automatiquement vos résultats de matchs depuis un Google Sheet vers votre site web de fléchettes.

### 🐍 Scripts Python (Backend)

1. **`sync_google_sheets.py`** (Principal) ⭐
   - Script de synchronisation Google Sheets → data.json
   - Récupère les nouveaux matchs
   - Met à jour automatiquement votre fichier de données
   
2. **`watch_sync.py`** (Surveillance)
   - Lance la synchronisation automatiquement toutes les 5 minutes
   - Surveille en continu les changements
   
3. **`check_setup.py`** (Diagnostic)
   - Vérifie que tout est correctement configuré
   - Teste votre configuration avant de commencer

### 🌐 Scripts Frontend (Site Web)

4. **`cnf-auto-refresh.js`** (Module principal) ⭐
   - Détecte automatiquement les nouveaux matchs
   - Affiche des notifications en temps réel
   - Met à jour la page Live automatiquement
   
5. **`cnf-auto-refresh.css`** (Styles)
   - Animations pour les notifications
   - Styles pour les badges et indicateurs
   - Design responsive mobile/desktop
   
6. **`integration_app_js.js`** (Guide d'intégration)
   - Exemples de code pour intégrer dans votre app.js
   - Snippets prêts à copier-coller
   - Instructions détaillées

### ⚙️ Configuration

7. **`requirements.txt`**
   - Liste des dépendances Python
   - À installer avec `pip install -r requirements.txt`

8. **`github_workflow_sync.yml`**
   - Workflow GitHub Actions pour automatisation cloud
   - Synchronisation automatique toutes les 5 minutes
   - Pas besoin de serveur local

9. **`template_google_sheet.csv`**
   - Template de structure pour votre Google Sheet
   - Exemple de format attendu

### 📖 Documentation

10. **`GUIDE_SYNCHRONISATION.md`** (Guide complet) ⭐⭐⭐
    - Configuration détaillée Google Cloud
    - Guide pas à pas avec captures d'écran
    - Toutes les options d'automatisation
    - Dépannage complet
    - **⚠️ À LIRE EN PREMIER**

11. **`README_SYNC.md`** (Démarrage rapide)
    - Résumé des étapes essentielles
    - Commandes principales
    - Architecture du système

## 🚀 Comment Démarrer ?

### Option 1 : Démarrage Rapide (5 minutes)

```bash
# 1. Installer les dépendances
pip install -r requirements.txt

# 2. Configurer le Google Sheet API (voir GUIDE_SYNCHRONISATION.md section 1)

# 3. Éditer sync_google_sheets.py ligne 18
# Remplacer SPREADSHEET_ID par votre ID

# 4. Vérifier la configuration
python check_setup.py

# 5. Tester
python sync_google_sheets.py
```

### Option 2 : Lecture Guidée (15-20 minutes)

1. **Lire** `README_SYNC.md` pour comprendre le système
2. **Suivre** `GUIDE_SYNCHRONISATION.md` étape par étape
3. **Exécuter** `check_setup.py` pour vérifier
4. **Intégrer** le frontend avec `integration_app_js.js`

## 📋 Checklist d'Installation

- [ ] Lire le `GUIDE_SYNCHRONISATION.md`
- [ ] Créer un projet Google Cloud
- [ ] Activer les APIs (Google Sheets + Drive)
- [ ] Créer un compte de service
- [ ] Télécharger `credentials.json`
- [ ] Partager le Google Sheet avec le service account
- [ ] Installer les dépendances Python
- [ ] Configurer le `SPREADSHEET_ID`
- [ ] Exécuter `check_setup.py`
- [ ] Tester avec `sync_google_sheets.py`
- [ ] Intégrer le frontend (`cnf-auto-refresh.js` + `.css`)
- [ ] Automatiser (cron, GitHub Actions, ou watch_sync.py)

## 🎯 Architecture du Système

```
Google Sheets (Source)
    ↓
sync_google_sheets.py (Récupère les données)
    ↓
data.json (Stockage local)
    ↓
cnf-auto-refresh.js (Détecte les changements)
    ↓
Site Web (Affiche en temps réel)
```

## 🔄 Flux de Données

1. Vous ajoutez des résultats dans Google Sheets
2. Le script Python synchronise (auto ou manuel)
3. Le fichier `data.json` est mis à jour
4. Le site détecte les changements toutes les 30 sec
5. Une notification apparaît pour les nouveaux matchs
6. Les utilisateurs voient les résultats en direct

## 💡 Cas d'Usage

### Cas 1 : Tournoi en cours
- Utilisez `watch_sync.py` pour une surveillance continue
- Les résultats apparaissent en temps réel sur le site
- Les spectateurs reçoivent des notifications

### Cas 2 : Mise à jour manuelle
- Exécutez `sync_google_sheets.py` après avoir ajouté des résultats
- Vérification immédiate des nouveaux matchs

### Cas 3 : Hébergement GitHub Pages
- Configurez GitHub Actions avec `github_workflow_sync.yml`
- Synchronisation automatique toutes les 5 minutes
- Pas de serveur nécessaire

## 🛠️ Personnalisation

### Modifier l'intervalle de synchronisation

**Pour watch_sync.py:**
```python
# Ligne 54 dans watch_sync.py
schedule.every(5).minutes.do(run_sync)  # Changer 5 par votre valeur
```

**Pour GitHub Actions:**
```yaml
# Ligne 6 dans github_workflow_sync.yml
- cron: '*/5 * * * *'  # Changer */5 par votre valeur
```

**Pour l'auto-refresh du site:**
```javascript
// Dans votre app.js
const cnfAutoRefresh = new CNFAutoRefresh(30000);  // 30 sec, modifiable
```

### Personnaliser les notifications

Éditez `cnf-auto-refresh.js` lignes 125-160 pour modifier:
- Le message de notification
- La durée d'affichage
- Les sons
- Les animations

### Adapter la structure du Sheet

Si votre Google Sheet a une structure différente, modifiez la fonction `parse_match_data()` dans `sync_google_sheets.py` (lignes 66-130).

## 🐛 Dépannage Rapide

**Problème:** "credentials.json introuvable"  
**Solution:** Le fichier doit être dans le même dossier que sync_google_sheets.py

**Problème:** "Permission denied"  
**Solution:** Vérifiez que vous avez partagé le Sheet avec l'email du service account

**Problème:** Aucun match ajouté  
**Solution:** Vérifiez l'ordre des colonnes et que les scores sont des nombres

**Problème:** Le site ne se rafraîchit pas  
**Solution:** Ouvrez la console (F12) et vérifiez que cnf-auto-refresh.js est chargé

Pour plus de détails → Voir `GUIDE_SYNCHRONISATION.md` section "Dépannage"

## 📚 Ressources

- **Documentation Google Sheets API:** https://developers.google.com/sheets
- **Google Cloud Console:** https://console.cloud.google.com/
- **Guide gspread:** https://docs.gspread.org/

## 🎉 Prochaines Étapes

Après l'installation réussie:

1. **Tester** avec quelques matchs
2. **Vérifier** que les notifications fonctionnent
3. **Automatiser** avec votre méthode préférée
4. **Profiter** de votre système live !

## 💬 Support

En cas de problème:
1. Exécutez `python check_setup.py`
2. Consultez le `GUIDE_SYNCHRONISATION.md`
3. Vérifiez les logs (`sync.log`)
4. Regardez la console du navigateur (F12)

## 🏆 Fonctionnalités

✅ Synchronisation automatique Google Sheets  
✅ Détection des nouveaux matchs en temps réel  
✅ Notifications visuelles  
✅ Badge sur l'onglet Live  
✅ Animations et effets  
✅ Compatible mobile et desktop  
✅ Aucune base de données requise  
✅ Fonctionne avec GitHub Pages  
✅ Facile à configurer et personnaliser  

---

**🎯 Bon tournoi avec le CNF 3 !**

*Créé avec ❤️ pour le Club Nantais de Fléchettes*

# 🎯 Synchronisation Automatique Google Sheets → Site CNF 3

Système automatisé pour mettre à jour votre site web de fléchettes en temps réel depuis un Google Sheet.

## 🚀 Démarrage Rapide

### 1. Installation

```bash
# Installer les dépendances Python
pip install -r requirements.txt
```

### 2. Configuration Google Sheets API

1. **Créer un projet Google Cloud** sur [console.cloud.google.com](https://console.cloud.google.com/)
2. **Activer les APIs** : Google Sheets API + Google Drive API
3. **Créer un compte de service** et télécharger le fichier `credentials.json`
4. **Partager votre Google Sheet** avec l'email du service account

📖 **Guide détaillé** : Voir `GUIDE_SYNCHRONISATION.md`

### 3. Configurer le projet

```bash
# Éditer sync_google_sheets.py
# Ligne 18: Remplacer SPREADSHEET_ID par votre ID de Sheet
SPREADSHEET_ID = 'votre-id-ici'

# Vérifier la configuration
python check_setup.py
```

### 4. Lancer la synchronisation

```bash
# Synchronisation manuelle
python sync_google_sheets.py

# Surveillance continue (toutes les 5 minutes)
python watch_sync.py
```

## 📁 Fichiers Créés

### Scripts Python
- **`sync_google_sheets.py`** - Script principal de synchronisation
- **`watch_sync.py`** - Surveillance continue avec intervalles
- **`check_setup.py`** - Vérification de la configuration
- **`requirements.txt`** - Dépendances Python

### Frontend
- **`cnf-auto-refresh.js`** - Module d'auto-refresh pour le site
- **`cnf-auto-refresh.css`** - Styles pour les notifications et animations

### Configuration
- **`github_workflow_sync.yml`** - Workflow GitHub Actions
- **`template_google_sheet.csv`** - Template de structure Google Sheet

### Documentation
- **`GUIDE_SYNCHRONISATION.md`** - Guide complet (configuration, utilisation, dépannage)

## 📊 Structure du Google Sheet

Votre Google Sheet doit avoir ces colonnes (dans cet ordre):

| Poule | Équipe 1 | Joueur 1 Eq1 | Joueur 2 Eq1 | Équipe 2 | Joueur 1 Eq2 | Joueur 2 Eq2 | Score 1 | Score 2 |
|-------|----------|--------------|--------------|----------|--------------|--------------|---------|---------|
| 1     | Team A   | Alice        | Bob          | Team B   | Charlie      | David        | 2       | 1       |

Voir `template_google_sheet.csv` pour un exemple complet.

## 🌐 Intégration Frontend

### 1. Ajouter les fichiers au site

```html
<!-- Dans index.html, avant </body> -->
<link rel="stylesheet" href="cnf-auto-refresh.css">
<script src="cnf-auto-refresh.js"></script>
```

### 2. Initialiser l'auto-refresh

```javascript
// Dans app.js, après le chargement de data.json
fetch('data.json')
  .then(response => response.json())
  .then(data => {
    window.data = data;
    
    // Initialiser l'auto-refresh
    cnfAutoRefresh.init(data);
    
    // Le reste de votre code...
  });
```

## 🤖 Automatisation

### Option 1: Cron Job (Linux/Mac)

```bash
# Toutes les 5 minutes
*/5 * * * * cd /chemin/vers/projet && python3 sync_google_sheets.py >> sync.log 2>&1
```

### Option 2: GitHub Actions

1. Copier `github_workflow_sync.yml` vers `.github/workflows/sync.yml`
2. Ajouter le secret `GOOGLE_CREDENTIALS` dans les paramètres GitHub
3. Le workflow s'exécutera automatiquement toutes les 5 minutes

## 🎨 Fonctionnalités Frontend

✅ **Auto-refresh** - Recharge les données toutes les 30 secondes  
✅ **Notifications** - Alerte visuelle pour les nouveaux matchs  
✅ **Badge Live** - Compteur sur l'onglet "Live"  
✅ **Animations** - Effets visuels pour les nouveaux résultats  
✅ **Responsive** - Compatible mobile et desktop  

## 🔧 Commandes Utiles

```bash
# Vérifier la configuration
python check_setup.py

# Synchronisation manuelle
python sync_google_sheets.py

# Surveillance continue
python watch_sync.py

# Recalculer les ELO (si nécessaire)
python recalculer_elo_cnf3.py
```

## 📝 Workflow Complet

1. **Ajouter des résultats** dans votre Google Sheet
2. **Le script synchronise** automatiquement (toutes les 5 min)
3. **data.json est mis à jour** avec les nouveaux matchs
4. **Le site détecte** les changements (toutes les 30 sec)
5. **Une notification apparaît** pour les nouveaux matchs
6. **L'utilisateur voit** les résultats en live

## 🐛 Dépannage

### Le script ne trouve pas credentials.json
```bash
# Le fichier doit être dans le même dossier que sync_google_sheets.py
ls -la credentials.json
```

### Permission denied sur Google Sheet
```bash
# Vérifier l'email du service account
cat credentials.json | grep client_email

# Partager le Sheet avec cet email
```

### Aucun match n'est ajouté
- Vérifier l'ordre des colonnes dans le Sheet
- Les scores doivent être des nombres
- Laisser vide les matchs non joués

### Le site ne se rafraîchit pas
- Vérifier la console du navigateur (F12)
- S'assurer que `cnf-auto-refresh.js` est chargé
- Vérifier que `data.json` change bien

## 📚 Documentation Complète

Pour plus de détails, consultez **`GUIDE_SYNCHRONISATION.md`** qui contient:
- Configuration détaillée de Google Cloud
- Exemples de structure de Sheet
- Toutes les options d'automatisation
- Guide de dépannage complet
- Intégration frontend détaillée

## 🎯 Support

Si vous rencontrez des problèmes:
1. Exécutez `python check_setup.py` pour diagnostiquer
2. Vérifiez les logs (`sync.log` si vous utilisez cron)
3. Consultez la console du navigateur (F12) pour les erreurs frontend
4. Relisez le `GUIDE_SYNCHRONISATION.md`

## ✨ Fonctionnalités Futures

- [ ] Support des tableaux finaux
- [ ] Notifications push
- [ ] Interface d'administration
- [ ] Export des statistiques
- [ ] API REST

---

**Créé avec ❤️ pour le Club Nantais de Fléchettes**

🎯 Bon tournoi !

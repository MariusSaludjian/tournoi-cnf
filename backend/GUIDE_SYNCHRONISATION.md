# 🎯 Guide de Synchronisation Automatique Google Sheets → Site CNF 3

Ce guide vous explique comment synchroniser automatiquement vos résultats de matchs depuis un Google Sheet vers votre site web.

---

## 📋 Table des matières

1. [Configuration Google Sheets API](#1-configuration-google-sheets-api)
2. [Structure du Google Sheet](#2-structure-du-google-sheet)
3. [Installation et Configuration](#3-installation-et-configuration)
4. [Utilisation](#4-utilisation)
5. [Automatisation](#5-automatisation)
6. [Mise à jour du site pour le Live](#6-mise-à-jour-du-site-pour-le-live)

---

## 1. Configuration Google Sheets API

### Étape 1.1 : Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Nommez-le par exemple "CNF-Sync"

### Étape 1.2 : Activer l'API Google Sheets

1. Dans le menu, allez dans **"APIs & Services" > "Library"**
2. Recherchez **"Google Sheets API"**
3. Cliquez sur **"Enable"**
4. Faites de même pour **"Google Drive API"**

### Étape 1.3 : Créer un compte de service

1. Allez dans **"APIs & Services" > "Credentials"**
2. Cliquez sur **"Create Credentials" > "Service Account"**
3. Donnez un nom (ex: "cnf-sync-bot")
4. Cliquez sur **"Create and Continue"**
5. Dans "Role", sélectionnez **"Editor"**
6. Cliquez sur **"Done"**

### Étape 1.4 : Télécharger les credentials

1. Dans la liste des comptes de service, cliquez sur celui que vous venez de créer
2. Allez dans l'onglet **"Keys"**
3. Cliquez sur **"Add Key" > "Create new key"**
4. Choisissez le format **JSON**
5. Le fichier `credentials.json` sera téléchargé
6. **⚠️ IMPORTANT**: Placez ce fichier dans le même dossier que votre `sync_google_sheets.py`

### Étape 1.5 : Partager votre Google Sheet

1. Ouvrez le fichier `credentials.json`
2. Copiez l'adresse email du service account (format: `xxx@xxx.iam.gserviceaccount.com`)
3. Ouvrez votre Google Sheet
4. Cliquez sur **"Partager"**
5. Partagez avec l'email du service account en lui donnant les droits de **"Lecteur"**

---

## 2. Structure du Google Sheet

### Format attendu pour la feuille "Poules"

Votre Google Sheet doit avoir les colonnes suivantes (la première ligne doit être l'en-tête):

| Poule | Équipe 1 | Joueur 1 Eq1 | Joueur 2 Eq1 | Équipe 2 | Joueur 1 Eq2 | Joueur 2 Eq2 | Score 1 | Score 2 |
|-------|----------|--------------|--------------|----------|--------------|--------------|---------|---------|
| 1     | Team A   | Alice        | Bob          | Team B   | Charlie      | David        | 2       | 1       |
| 1     | Team B   | Charlie      | David        | Team C   | Eve          | Frank        | 0       | 2       |
| 2     | Team D   | George       | Henry        | Team E   | Ivy          | Jack         | 2       | 0       |

**Notes importantes:**
- Les colonnes doivent être dans cet ordre exact
- Les scores doivent être des nombres (laissez vide si le match n'est pas encore joué)
- Le script ignorera les lignes sans score ou les lignes vides

### Format pour la feuille "Tableau final"

Même structure que pour les poules, mais vous pouvez adapter la colonne "Poule" pour indiquer la phase (ex: "Quart", "Demi", "Finale")

---

## 3. Installation et Configuration

### Étape 3.1 : Installer les dépendances Python

```bash
pip install -r requirements.txt
```

### Étape 3.2 : Configurer le script

Éditez le fichier `sync_google_sheets.py` et modifiez:

```python
# Ligne 18: Remplacez par l'ID de votre Google Sheet
SPREADSHEET_ID = 'VOTRE_SHEET_ID'
```

**Pour trouver l'ID de votre Sheet:**
- Ouvrez votre Google Sheet
- L'URL ressemble à: `https://docs.google.com/spreadsheets/d/VOTRE_SHEET_ID/edit`
- Copiez la partie `VOTRE_SHEET_ID`

### Étape 3.3 : Vérifier vos fichiers

Assurez-vous d'avoir:
```
votre-dossier/
├── sync_google_sheets.py
├── requirements.txt
├── credentials.json  ← Téléchargé depuis Google Cloud
├── data.json         ← Votre fichier de données existant
└── recalculer_elo_cnf3.py (optionnel)
```

---

## 4. Utilisation

### Synchronisation manuelle

Pour synchroniser manuellement:

```bash
python sync_google_sheets.py
```

Le script va:
1. ✅ Se connecter à votre Google Sheet
2. ✅ Récupérer les nouveaux matchs
3. ✅ Mettre à jour `data.json`
4. ✅ Marquer les nouveaux matchs comme "live"

### Recalculer les ELO après synchronisation

Après avoir ajouté de nouveaux matchs:

```bash
python recalculer_elo_cnf3.py
```

---

## 5. Automatisation

### Option A : Cron Job (Linux/Mac)

Pour exécuter le script toutes les 5 minutes:

```bash
# Ouvrir le crontab
crontab -e

# Ajouter cette ligne (adapter le chemin):
*/5 * * * * cd /chemin/vers/votre/projet && python3 sync_google_sheets.py >> sync.log 2>&1
```

### Option B : Task Scheduler (Windows)

1. Ouvrez le **Planificateur de tâches**
2. Créez une nouvelle tâche
3. Dans "Déclencheurs", configurez une répétition toutes les 5 minutes
4. Dans "Actions", ajoutez:
   - Programme: `python`
   - Arguments: `sync_google_sheets.py`
   - Dossier de départ: Le chemin vers votre projet

### Option C : GitHub Actions (Recommandé pour l'hébergement)

Si votre site est hébergé sur GitHub Pages, créez `.github/workflows/sync.yml`:

```yaml
name: Sync Google Sheets

on:
  schedule:
    - cron: '*/5 * * * *'  # Toutes les 5 minutes
  workflow_dispatch:  # Permet le déclenchement manuel

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: pip install -r requirements.txt
      
      - name: Sync data
        env:
          GOOGLE_CREDENTIALS: ${{ secrets.GOOGLE_CREDENTIALS }}
        run: |
          echo "$GOOGLE_CREDENTIALS" > credentials.json
          python sync_google_sheets.py
      
      - name: Commit changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add data.json
          git commit -m "Auto-sync: Update match results" || echo "No changes"
          git push
```

**Configuration:**
1. Allez dans les Settings de votre repo GitHub
2. Dans "Secrets and variables" > "Actions"
3. Créez un secret `GOOGLE_CREDENTIALS`
4. Collez le contenu de votre `credentials.json`

---

## 6. Mise à jour du site pour le Live

### Option 1 : Auto-refresh du data.json (Simple)

Modifiez votre `app.js` pour recharger automatiquement les données:

```javascript
// Ajouter au début de app.js
let AUTO_REFRESH_INTERVAL = 30000; // 30 secondes

// Fonction pour recharger les données
async function refreshData() {
    try {
        const response = await fetch('data.json?t=' + new Date().getTime());
        const newData = await response.json();
        
        // Vérifie s'il y a de nouvelles données
        if (JSON.stringify(newData) !== JSON.stringify(data)) {
            data = newData;
            // Rafraîchir l'affichage de la page actuelle
            const currentPage = document.querySelector('.page.active').id;
            if (currentPage === 'live') {
                displayLiveMatches();
            }
            console.log('✅ Données mises à jour');
        }
    } catch (error) {
        console.error('Erreur lors du refresh:', error);
    }
}

// Lancer le refresh automatique
setInterval(refreshData, AUTO_REFRESH_INTERVAL);
```

### Option 2 : Notification des nouveaux matchs

Ajoutez cette fonction pour notifier l'utilisateur:

```javascript
function checkForNewMatches() {
    const newMatches = data.matchs.filter(m => m.live === true);
    
    if (newMatches.length > 0) {
        // Afficher une notification
        showNotification(`${newMatches.length} nouveau(x) match(s) !`);
        
        // Badge sur l'onglet Live
        const liveTab = document.querySelector('[data-page="live"]');
        if (liveTab && !liveTab.querySelector('.badge')) {
            const badge = document.createElement('span');
            badge.className = 'badge';
            badge.textContent = newMatches.length;
            liveTab.appendChild(badge);
        }
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #00ff88;
        color: #000;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,255,136,0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
```

### CSS pour les animations

Ajoutez dans votre `styles.css`:

```css
@keyframes slideIn {
    from {
        transform: translateX(400px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOut {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(400px);
        opacity: 0;
    }
}

.badge {
    background: #ff0044;
    color: white;
    border-radius: 50%;
    padding: 2px 6px;
    font-size: 11px;
    margin-left: 5px;
    font-weight: bold;
}
```

---

## 🎉 C'est terminé !

Votre système de synchronisation est maintenant opérationnel. Les résultats de vos matchs seront automatiquement:

✅ Récupérés depuis Google Sheets  
✅ Ajoutés à votre data.json  
✅ Affichés en temps réel sur votre site  
✅ Marqués comme "LIVE" pour les derniers matchs  

---

## 🔧 Dépannage

### Erreur "credentials.json introuvable"
- Vérifiez que le fichier est bien dans le même dossier que le script
- Le nom doit être exactement `credentials.json`

### Erreur "Permission denied"
- Vérifiez que vous avez bien partagé le Google Sheet avec l'email du service account
- L'email se trouve dans le fichier `credentials.json` (champ "client_email")

### Aucun match n'est ajouté
- Vérifiez que les colonnes de votre Sheet sont dans le bon ordre
- Assurez-vous que les scores sont bien des nombres (pas de texte)
- Vérifiez que les noms des feuilles sont corrects ("Poules", "Tableau final")

### Les matchs n'apparaissent pas en "Live"
- Vérifiez que le site recharge bien le `data.json`
- Ouvrez la console du navigateur pour voir les erreurs
- Assurez-vous que l'auto-refresh est bien activé dans `app.js`

---

## 📞 Support

Si vous rencontrez des problèmes, vérifiez:
1. Les logs du script (`sync.log` si vous utilisez cron)
2. La console du navigateur (F12)
3. Que le fichier `data.json` se met bien à jour

---

**Créé avec ❤️ pour le Club Nantais de Fléchettes**

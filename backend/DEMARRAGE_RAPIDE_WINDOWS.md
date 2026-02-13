# Guide Demarrage Rapide - Windows

## PROBLEME D'ENCODAGE RESOLU !

Tous les scripts ont ete corriges pour fonctionner sur Windows.
Les emojis ont ete remplaces par du texte simple.

---

## ETAPES D'INSTALLATION

### 1. Installer les dependances

```cmd
pip install -r requirements.txt
```

### 2. Configurer le SPREADSHEET_ID

Editez `sync_cnf3_complet.py` ligne 23 :

```python
SPREADSHEET_ID = 'VOTRE_SHEET_ID'
```

Pour trouver l'ID :
- Ouvrez votre Google Sheet
- URL : https://docs.google.com/spreadsheets/d/VOTRE_SHEET_ID/edit
- Copiez la partie VOTRE_SHEET_ID

### 3. Placer le fichier credentials.json

1. Telechargez credentials.json depuis Google Cloud Console
2. Placez-le dans le meme dossier que sync_cnf3_complet.py

### 4. Verifier la configuration

```cmd
python check_setup.py
```

Vous devriez voir :
```
============================================================
  CNF 3 - Verification de la configuration
============================================================

1. FICHIERS REQUIS
------------------------------------------------------------
[OK] Script complet (RECOMMANDE): sync_cnf3_complet.py
[OK] Fichier de donnees: data.json
[OK] Credentials Google Cloud: credentials.json

...

[OK] Fichiers
[OK] Credentials
[OK] Packages Python
[OK] Configuration

Tout est pret!
```

### 5. Lancer la synchronisation

```cmd
python sync_cnf3_complet.py
```

---

## SORTIE ATTENDUE

```
[CNF3] Synchronisation CNF 3 - Avec Calcul ELO
============================================================
[RECHERCHE] Detection des feuilles CNF 3...
[INFO] 32 poule(s) detectee(s)

[FEUILLE] Poule 1...
  [NOUVEAU] Pastis et Cassoulet vs InvinCible: 2-0
     ELO: +15.3 pts par joueur

[FEUILLE] Poule 2... [OK] A jour

...

[SUCCESS] 15 nouveau(x) match(s) synchronise(s)
[OK] Fichier data.json mis a jour avec succes
============================================================
[OK] Termine
```

---

## AUTOMATISATION (OPTIONNEL)

### Option 1 : Task Scheduler Windows

1. Ouvrez "Planificateur de taches"
2. Cliquez "Creer une tache"
3. Nom : "Sync CNF3"
4. Declencheurs : Toutes les 5 minutes
5. Actions :
   - Programme : python
   - Arguments : sync_cnf3_complet.py
   - Dossier : C:\chemin\vers\votre\projet

### Option 2 : Script Batch

Creez `sync_auto.bat` :

```batch
@echo off
cd /d "%~dp0"
python sync_cnf3_complet.py >> sync.log 2>&1
```

Lancez ce fichier toutes les 5 minutes avec Task Scheduler.

---

## DEPANNAGE

### Erreur : "No module named 'gspread'"

```cmd
pip install -r requirements.txt
```

### Erreur : "credentials.json introuvable"

Le fichier doit etre dans le meme dossier que le script.

### Erreur : "Permission denied"

Verifiez que vous avez partage le Google Sheet avec l'email du service account.
L'email se trouve dans credentials.json (champ "client_email").

### Erreur : "SPREADSHEET_ID non configure"

Editez sync_cnf3_complet.py ligne 23 et remplacez 'VOTRE_SHEET_ID' par votre ID.

---

## VERIFICATION RAPIDE

```cmd
# 1. Verifier Python
python --version

# 2. Verifier les packages
pip list | findstr gspread

# 3. Tester la config
python check_setup.py

# 4. Lancer la sync
python sync_cnf3_complet.py
```

---

## STRUCTURE DES FICHIERS

```
votre-projet/
├── sync_cnf3_complet.py      <- Script principal (UTILISER CELUI-CI)
├── check_setup.py             <- Verification
├── requirements.txt           <- Dependances
├── credentials.json           <- Credentials Google (A TELECHARGER)
├── data.json                  <- Vos donnees
└── sync.log                   <- Logs (cree automatiquement)
```

---

## POINTS IMPORTANTS

1. TOUJOURS utiliser `sync_cnf3_complet.py` (il calcule l'ELO automatiquement)
2. Le fichier credentials.json ne doit JAMAIS etre commite sur Git
3. Verifiez que votre Google Sheet est partage avec le service account
4. Les matchs sont ajoutes dans data.json -> matchs_cnf3

---

## PROCHAINES ETAPES

1. [OK] Installer les dependances
2. [OK] Configurer SPREADSHEET_ID
3. [OK] Placer credentials.json
4. [OK] Verifier avec check_setup.py
5. [OK] Tester avec sync_cnf3_complet.py
6. [ ] Automatiser (optionnel)
7. [ ] Integrer le frontend (cnf-auto-refresh.js)

---

Consultez GUIDE_SYNCHRONISATION.md pour plus de details.

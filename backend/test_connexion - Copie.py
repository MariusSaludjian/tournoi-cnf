# -*- coding: utf-8 -*-
"""
Script de test de connexion a Google Sheets
Permet de verifier que tout est correctement configure
"""

import gspread
from google.oauth2.service_account import Credentials

SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/drive.readonly'
]

# REMPLACEZ PAR VOTRE ID
SPREADSHEET_ID = '1xsJZmdlmki84wcxKzU5PilK37dAir_rD6uSm1hKB6jI'

print("="*60)
print("  TEST DE CONNEXION GOOGLE SHEETS")
print("="*60)

try:
    print("\n1. Chargement des credentials...")
    credentials = Credentials.from_service_account_file(
        'credentials.json', 
        scopes=SCOPES
    )
    print("   [OK] Credentials charges")
    
    # Afficher l'email du service account
    with open('credentials.json', 'r', encoding='utf-8') as f:
        import json
        creds_data = json.load(f)
        print(f"   Service account: {creds_data['client_email']}")
    
    print("\n2. Connexion a Google Sheets...")
    client = gspread.authorize(credentials)
    print("   [OK] Connexion etablie")
    
    print("\n3. Ouverture du fichier...")
    print(f"   SPREADSHEET_ID: {SPREADSHEET_ID}")
    
    if SPREADSHEET_ID == 'VOTRE_SHEET_ID':
        print("\n   [ERREUR] SPREADSHEET_ID non configure!")
        print("   Editez ce fichier et remplacez 'VOTRE_SHEET_ID'")
        print("\n   Pour trouver votre ID:")
        print("   1. Ouvrez votre Google Sheet")
        print("   2. URL: https://docs.google.com/spreadsheets/d/VOTRE_ID/edit")
        print("   3. Copiez la partie entre /d/ et /edit")
        exit(1)
    
    spreadsheet = client.open_by_key(SPREADSHEET_ID)
    print(f"   [OK] Fichier ouvert: {spreadsheet.title}")
    
    print("\n4. Liste des feuilles:")
    sheets = spreadsheet.worksheets()
    for i, sheet in enumerate(sheets, 1):
        rows = sheet.row_count
        cols = sheet.col_count
        print(f"   {i}. {sheet.title} ({rows} lignes x {cols} colonnes)")
    
    print(f"\n   Total: {len(sheets)} feuille(s) detectee(s)")
    
    print("\n" + "="*60)
    print("  [SUCCESS] TOUT FONCTIONNE!")
    print("="*60)
    print("\nVous pouvez maintenant lancer:")
    print("  python sync_cnf3_complet.py")
    
except FileNotFoundError:
    print("\n[ERREUR] Fichier credentials.json non trouve")
    print("Le fichier doit etre dans le meme dossier que ce script")
    
except gspread.exceptions.APIError as e:
    error_str = str(e)
    print(f"\n[ERREUR] Erreur API Google: {error_str}")
    
    if '404' in error_str:
        print("\n>>> Google Sheet NON TROUVE (404) <<<")
        print("\nSolutions:")
        print("1. Verifiez le SPREADSHEET_ID (est-il correct?)")
        print("2. Le fichier existe-t-il dans Google Sheets?")
        print("3. Avez-vous upload votre fichier Excel sur Google Drive?")
        
    elif '403' in error_str or 'permission' in error_str.lower():
        print("\n>>> ACCES REFUSE (403) <<<")
        print("\nSolution:")
        print("1. Ouvrez credentials.json")
        print("2. Copiez le 'client_email'")
        print("3. Partagez votre Google Sheet avec cet email")
        print("4. Donnez les droits 'Lecteur' ou 'Editeur'")
        
    else:
        print("\nErreur inattendue. Verifiez:")
        print("- Que l'API Google Sheets est activee")
        print("- Que credentials.json est valide")
        
except Exception as e:
    print(f"\n[ERREUR] Erreur inattendue: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*60)

#!/usr/bin/env python3
"""
Script de synchronisation automatique Google Sheets → data.json
Récupère les résultats du tournoi CNF 3 depuis Google Sheets et met à jour le site web
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Any
import gspread
from google.oauth2.service_account import Credentials

# Configuration
SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/drive.readonly'
]
DATA_FILE = 'data.json'
CREDENTIALS_FILE = 'credentials.json'  # Fichier de credentials Google Cloud

# ID de votre Google Sheet (à récupérer depuis l'URL)
# Format URL: https://docs.google.com/spreadsheets/d/VOTRE_SHEET_ID/edit
SPREADSHEET_ID = '1xsJZmdlmki84wcxKzU5PilK37dAir_rD6uSm1hKB6jI'  # À REMPLACER

class GoogleSheetsSync:
    def __init__(self):
        """Initialise la connexion à Google Sheets"""
        self.credentials = self._get_credentials()
        self.client = gspread.authorize(self.credentials)
        self.data = self._load_data()
        
    def _get_credentials(self):
        """Charge les credentials Google Cloud"""
        if not os.path.exists(CREDENTIALS_FILE):
            raise FileNotFoundError(
                f"Fichier {CREDENTIALS_FILE} introuvable. "
                "Veuillez télécharger les credentials depuis Google Cloud Console."
            )
        return Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=SCOPES)
    
    def _load_data(self) -> Dict:
        """Charge le fichier data.json existant"""
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {"joueurs": [], "matchs": []}
    
    def _save_data(self):
        """Sauvegarde le fichier data.json"""
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, ensure_ascii=False, indent=2)
        print(f"[OK] Fichier {DATA_FILE} mis à jour avec succès")
    
    def get_sheet_data(self, sheet_name: str) -> List[List[Any]]:
        """Récupère les données d'une feuille Google Sheets"""
        try:
            sheet = self.client.open_by_key(SPREADSHEET_ID)
            worksheet = sheet.worksheet(sheet_name)
            return worksheet.get_all_values()
        except Exception as e:
            print(f"[ERREUR] Erreur lors de la récupération de la feuille '{sheet_name}': {e}")
            return []
    
    def parse_match_data(self, sheet_name: str) -> List[Dict]:
        """
        Parse les données d'une feuille de matchs
        
        Format attendu du Google Sheet (exemple):
        | Poule | Équipe 1 | Joueur 1 Eq1 | Joueur 2 Eq1 | Équipe 2 | Joueur 1 Eq2 | Joueur 2 Eq2 | Score 1 | Score 2 |
        """
        rows = self.get_sheet_data(sheet_name)
        if not rows:
            return []
        
        # La première ligne contient les en-têtes
        headers = rows[0]
        matchs = []
        
        # Trouve le prochain ID disponible
        max_id = max([m.get('id', 0) for m in self.data.get('matchs', [])], default=0)
        
        for i, row in enumerate(rows[1:], start=1):
            if len(row) < 9 or not row[0]:  # Ligne vide ou incomplète
                continue
            
            try:
                # Extraction des données (adapter selon votre format de sheet)
                poule = row[0]
                equipe1 = row[1]
                joueur1_eq1 = row[2]
                joueur2_eq1 = row[3]
                equipe2 = row[4]
                joueur1_eq2 = row[5]
                joueur2_eq2 = row[6]
                score1 = int(row[7]) if row[7] else None
                score2 = int(row[8]) if row[8] else None
                
                # Ne traite que les matchs avec un score
                if score1 is None or score2 is None:
                    continue
                
                # Détermine le gagnant
                gagnant = equipe1 if score1 > score2 else equipe2
                
                # Crée l'objet match
                match = {
                    "id": max_id + i,
                    "type": "poule",
                    "tournoi": "CNF 3",
                    "phase": "Poules",
                    "poule": int(poule) if poule.isdigit() else poule,
                    "date": datetime.now().strftime("%Y-%m-%d"),
                    "equipe1": equipe1,
                    "equipe2": equipe2,
                    "joueur1_eq1": joueur1_eq1,
                    "joueur2_eq1": joueur2_eq1,
                    "joueur1_eq2": joueur1_eq2,
                    "joueur2_eq2": joueur2_eq2,
                    "score1": score1,
                    "score2": score2,
                    "gagnant": gagnant,
                    "live": True  # Marque comme nouveau match
                }
                
                matchs.append(match)
                
            except (ValueError, IndexError) as e:
                print(f"[ATTENTION]  Erreur ligne {i+1}: {e}")
                continue
        
        return matchs
    
    def match_exists(self, new_match: Dict) -> bool:
        """Vérifie si un match existe déjà dans les données"""
        for match in self.data.get('matchs', []):
            if (match.get('equipe1') == new_match['equipe1'] and
                match.get('equipe2') == new_match['equipe2'] and
                match.get('tournoi') == new_match['tournoi'] and
                match.get('poule') == new_match.get('poule')):
                return True
        return False
    
    def sync_matches(self, sheet_names: List[str] = None):
        """
        Synchronise les matchs depuis les feuilles Google Sheets
        
        Args:
            sheet_names: Liste des noms de feuilles à synchroniser
                        Si None, utilise ["Poules", "Tableau final"]
        """
        if sheet_names is None:
            sheet_names = ["Poules", "Tableau final"]
        
        nouveaux_matchs = 0
        
        for sheet_name in sheet_names:
            print(f"[INFO] Synchronisation de la feuille '{sheet_name}'...")
            matchs = self.parse_match_data(sheet_name)
            
            for match in matchs:
                if not self.match_exists(match):
                    self.data['matchs'].append(match)
                    nouveaux_matchs += 1
                    print(f"  [NOUVEAU] Nouveau match: {match['equipe1']} vs {match['equipe2']} ({match['score1']}-{match['score2']})")
        
        if nouveaux_matchs > 0:
            self._save_data()
            print(f"\n[SUCCESS] {nouveaux_matchs} nouveau(x) match(s) ajouté(s)")
            return True
        else:
            print("\n✓ Aucun nouveau match à ajouter")
            return False
    
    def mark_old_matches_as_not_live(self):
        """Retire le flag 'live' des anciens matchs"""
        for match in self.data.get('matchs', []):
            if match.get('live'):
                match['live'] = False
        self._save_data()


def main():
    """Fonction principale"""
    print("[CNF3] Démarrage de la synchronisation Google Sheets → CNF 3")
    print("=" * 60)
    
    try:
        sync = GoogleSheetsSync()
        
        # Synchronise les matchs
        has_new_data = sync.sync_matches()
        
        # Si de nouvelles données, tu peux aussi recalculer les ELO
        if has_new_data:
            print("\n[INFO] Conseil: N'oubliez pas de recalculer les ELO avec:")
            print("   python recalculer_elo_cnf3.py")
        
        print("\n" + "=" * 60)
        print("[OK] Synchronisation terminée avec succès")
        
    except Exception as e:
        print(f"\n[ERREUR] Erreur lors de la synchronisation: {e}")
        raise


if __name__ == "__main__":
    main()

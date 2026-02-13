#!/usr/bin/env python3
"""
Script de synchronisation automatique - Version multi-feuilles
Synchronise TOUTES les feuilles du Google Sheet automatiquement
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
CREDENTIALS_FILE = 'credentials.json'
SPREADSHEET_ID = '1xsJZmdlmki84wcxKzU5PilK37dAir_rD6uSm1hKB6jI'  # À REMPLACER

# Feuilles à IGNORER (optionnel)
IGNORED_SHEETS = ['Config', 'Brouillon', 'Template', 'Archive']


class GoogleSheetsMultiSync:
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
    
    def get_all_sheet_names(self) -> List[str]:
        """Récupère tous les noms de feuilles du Google Sheet"""
        try:
            spreadsheet = self.client.open_by_key(SPREADSHEET_ID)
            all_sheets = [ws.title for ws in spreadsheet.worksheets()]
            
            # Filtre les feuilles ignorées
            filtered_sheets = [
                sheet for sheet in all_sheets 
                if sheet not in IGNORED_SHEETS
            ]
            
            return filtered_sheets
        except Exception as e:
            print(f"[ERREUR] Erreur lors de la récupération des feuilles: {e}")
            return []
    
    def get_sheet_data(self, sheet_name: str) -> List[List[Any]]:
        """Récupère les données d'une feuille Google Sheets"""
        try:
            sheet = self.client.open_by_key(SPREADSHEET_ID)
            worksheet = sheet.worksheet(sheet_name)
            return worksheet.get_all_values()
        except Exception as e:
            print(f"[ERREUR] Erreur lors de la récupération de '{sheet_name}': {e}")
            return []
    
    def parse_match_data(self, sheet_name: str) -> List[Dict]:
        """Parse les données d'une feuille de matchs"""
        rows = self.get_sheet_data(sheet_name)
        if not rows or len(rows) < 2:
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
                # Extraction des données
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
                
                # Détermine la phase selon le nom de la feuille
                phase = self._determine_phase(sheet_name)
                
                # Crée l'objet match
                match = {
                    "id": max_id + i,
                    "type": "poule" if "poule" in sheet_name.lower() else "elimination",
                    "tournoi": "CNF 3",
                    "phase": phase,
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
                    "live": True,
                    "source_sheet": sheet_name  # Pour traçabilité
                }
                
                matchs.append(match)
                
            except (ValueError, IndexError) as e:
                print(f"[ATTENTION]  Erreur feuille '{sheet_name}' ligne {i+1}: {e}")
                continue
        
        return matchs
    
    def _determine_phase(self, sheet_name: str) -> str:
        """Détermine la phase du tournoi selon le nom de la feuille"""
        sheet_lower = sheet_name.lower()
        
        if "poule" in sheet_lower or "groupe" in sheet_lower or "pool" in sheet_lower:
            return "Poules"
        elif "finale" in sheet_lower and "demi" not in sheet_lower:
            return "Finale"
        elif "demi" in sheet_lower:
            return "Demi-finales"
        elif "quart" in sheet_lower:
            return "Quarts de finale"
        elif "huitieme" in sheet_lower or "1/8" in sheet_lower:
            return "Huitièmes de finale"
        elif "seizieme" in sheet_lower or "1/16" in sheet_lower:
            return "Seizièmes de finale"
        else:
            return sheet_name  # Utilise le nom de la feuille
    
    def match_exists(self, new_match: Dict) -> bool:
        """Vérifie si un match existe déjà dans les données"""
        for match in self.data.get('matchs', []):
            if (match.get('equipe1') == new_match['equipe1'] and
                match.get('equipe2') == new_match['equipe2'] and
                match.get('tournoi') == new_match['tournoi'] and
                match.get('poule') == new_match.get('poule')):
                return True
        return False
    
    def sync_all_sheets(self):
        """Synchronise toutes les feuilles du Google Sheet"""
        print("[RECHERCHE] Détection des feuilles disponibles...")
        
        sheet_names = self.get_all_sheet_names()
        
        if not sheet_names:
            print("[ERREUR] Aucune feuille trouvée")
            return False
        
        print(f"[INFO] {len(sheet_names)} feuille(s) détectée(s): {', '.join(sheet_names)}")
        print()
        
        nouveaux_matchs = 0
        total_matchs = 0
        
        for sheet_name in sheet_names:
            print(f"[FEUILLE] Synchronisation de '{sheet_name}'...")
            matchs = self.parse_match_data(sheet_name)
            
            sheet_new_matches = 0
            for match in matchs:
                total_matchs += 1
                if not self.match_exists(match):
                    self.data['matchs'].append(match)
                    nouveaux_matchs += 1
                    sheet_new_matches += 1
                    print(f"  [NOUVEAU] {match['equipe1']} vs {match['equipe2']} ({match['score1']}-{match['score2']})")
            
            if sheet_new_matches == 0:
                print(f"  ✓ Aucun nouveau match dans cette feuille")
            else:
                print(f"  [OK] {sheet_new_matches} nouveau(x) match(s) ajouté(s)")
            print()
        
        if nouveaux_matchs > 0:
            self._save_data()
            print(f"[SUCCESS] Résumé: {nouveaux_matchs}/{total_matchs} nouveau(x) match(s) ajouté(s)")
            return True
        else:
            print("✓ Aucun nouveau match à ajouter")
            return False


def main():
    """Fonction principale"""
    print("[CNF3] Synchronisation Multi-Feuilles CNF 3")
    print("=" * 60)
    
    try:
        sync = GoogleSheetsMultiSync()
        
        # Synchronise toutes les feuilles
        has_new_data = sync.sync_all_sheets()
        
        # Si de nouvelles données, suggère de recalculer les ELO
        if has_new_data:
            print("\n[INFO] Conseil: N'oubliez pas de recalculer les ELO avec:")
            print("   python recalculer_elo_cnf3.py")
        
        print("\n" + "=" * 60)
        print("[OK] Synchronisation terminée avec succès")
        
    except Exception as e:
        print(f"\n[ERREUR] Erreur lors de la synchronisation: {e}")
        import traceback
        traceback.print_exc()
        raise


if __name__ == "__main__":
    main()

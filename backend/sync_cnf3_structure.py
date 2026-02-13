#!/usr/bin/env python3
"""
Script de synchronisation spécifique pour le tournoi CNF 3
Adapté à la structure du fichier Tournoi_CNF_3__2_.xlsx
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

# Feuilles à ignorer (ne contiennent pas de résultats de matchs)
IGNORED_SHEETS = [
    'Chapeaux', 'Planning matchs', 'Premiers', 'Deuxièmes', 'Poules'
]


class CNF3Sync:
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
        """Récupère tous les noms de feuilles utiles"""
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
        """Récupère les données d'une feuille"""
        try:
            sheet = self.client.open_by_key(SPREADSHEET_ID)
            worksheet = sheet.worksheet(sheet_name)
            return worksheet.get_all_values()
        except Exception as e:
            print(f"[ERREUR] Erreur lors de la récupération de '{sheet_name}': {e}")
            return []
    
    def parse_poule_sheet(self, sheet_name: str, rows: List[List[Any]]) -> List[Dict]:
        """
        Parse une feuille de poule (Poule 1, Poule 2, etc.)
        Structure spécifique du fichier CNF 3
        """
        matchs = []
        
        if len(rows) < 4:
            return matchs
        
        # Extraire le numéro de poule du nom de la feuille
        poule_num = sheet_name.replace('Poule ', '').strip()
        
        # Ligne 4 : première équipe
        # Ligne 6 : deuxième équipe  
        # Ligne 8 : troisième équipe
        
        try:
            # Équipes et joueurs (lignes 4, 6, 8)
            equipe1 = rows[3][1] if len(rows[3]) > 1 else None  # B4
            joueur1_eq1 = rows[3][2] if len(rows[3]) > 2 else None  # C4
            joueur2_eq1 = rows[4][2] if len(rows) > 4 and len(rows[4]) > 2 else None  # C5
            
            equipe2 = rows[5][1] if len(rows) > 5 and len(rows[5]) > 1 else None  # B6
            joueur1_eq2 = rows[5][2] if len(rows) > 5 and len(rows[5]) > 2 else None  # C6
            joueur2_eq2 = rows[6][2] if len(rows) > 6 and len(rows[6]) > 2 else None  # C7
            
            equipe3 = rows[7][1] if len(rows) > 7 and len(rows[7]) > 1 else None  # B8
            joueur1_eq3 = rows[7][2] if len(rows) > 7 and len(rows[7]) > 2 else None  # C8
            joueur2_eq3 = rows[8][2] if len(rows) > 8 and len(rows[8]) > 2 else None  # C9
            
            # Scores (colonnes 9 et 10, lignes 4, 5, 6)
            # Match 1 vs 3 (ligne 4)
            match1_score1 = self._parse_score(rows[3][8]) if len(rows[3]) > 8 else None  # I4
            match1_score2 = self._parse_score(rows[3][9]) if len(rows[3]) > 9 else None  # J4
            
            # Match 2 vs 3 (ligne 5)
            match2_score1 = self._parse_score(rows[4][8]) if len(rows) > 4 and len(rows[4]) > 8 else None  # I5
            match2_score2 = self._parse_score(rows[4][9]) if len(rows) > 4 and len(rows[4]) > 9 else None  # J5
            
            # Match 1 vs 2 (ligne 6)
            match3_score1 = self._parse_score(rows[5][8]) if len(rows) > 5 and len(rows[5]) > 8 else None  # I6
            match3_score2 = self._parse_score(rows[5][9]) if len(rows) > 5 and len(rows[5]) > 9 else None  # J6
            
            max_id = max([m.get('id', 0) for m in self.data.get('matchs', [])], default=0)
            
            # Match 1 : Équipe 1 vs Équipe 3
            if match1_score1 is not None and match1_score2 is not None and equipe1 and equipe3:
                matchs.append({
                    "id": max_id + len(matchs) + 1,
                    "type": "poule",
                    "tournoi": "CNF 3",
                    "phase": "Poules",
                    "poule": poule_num,
                    "date": datetime.now().strftime("%Y-%m-%d"),
                    "equipe1": equipe1,
                    "equipe2": equipe3,
                    "joueur1_eq1": joueur1_eq1 or "",
                    "joueur2_eq1": joueur2_eq1 or "",
                    "joueur1_eq2": joueur1_eq3 or "",
                    "joueur2_eq2": joueur2_eq3 or "",
                    "score1": match1_score1,
                    "score2": match1_score2,
                    "gagnant": equipe1 if match1_score1 > match1_score2 else equipe3,
                    "live": True,
                    "source_sheet": sheet_name
                })
            
            # Match 2 : Équipe 2 vs Équipe 3
            if match2_score1 is not None and match2_score2 is not None and equipe2 and equipe3:
                matchs.append({
                    "id": max_id + len(matchs) + 1,
                    "type": "poule",
                    "tournoi": "CNF 3",
                    "phase": "Poules",
                    "poule": poule_num,
                    "date": datetime.now().strftime("%Y-%m-%d"),
                    "equipe1": equipe2,
                    "equipe2": equipe3,
                    "joueur1_eq1": joueur1_eq2 or "",
                    "joueur2_eq1": joueur2_eq2 or "",
                    "joueur1_eq2": joueur1_eq3 or "",
                    "joueur2_eq2": joueur2_eq3 or "",
                    "score1": match2_score1,
                    "score2": match2_score2,
                    "gagnant": equipe2 if match2_score1 > match2_score2 else equipe3,
                    "live": True,
                    "source_sheet": sheet_name
                })
            
            # Match 3 : Équipe 1 vs Équipe 2
            if match3_score1 is not None and match3_score2 is not None and equipe1 and equipe2:
                matchs.append({
                    "id": max_id + len(matchs) + 1,
                    "type": "poule",
                    "tournoi": "CNF 3",
                    "phase": "Poules",
                    "poule": poule_num,
                    "date": datetime.now().strftime("%Y-%m-%d"),
                    "equipe1": equipe1,
                    "equipe2": equipe2,
                    "joueur1_eq1": joueur1_eq1 or "",
                    "joueur2_eq1": joueur2_eq1 or "",
                    "joueur1_eq2": joueur1_eq2 or "",
                    "joueur2_eq2": joueur2_eq2 or "",
                    "score1": match3_score1,
                    "score2": match3_score2,
                    "gagnant": equipe1 if match3_score1 > match3_score2 else equipe2,
                    "live": True,
                    "source_sheet": sheet_name
                })
                
        except Exception as e:
            print(f"[ATTENTION]  Erreur lors du parsing de '{sheet_name}': {e}")
        
        return matchs
    
    def _parse_score(self, value) -> int:
        """Parse un score depuis une cellule Excel"""
        if value is None or value == '':
            return None
        try:
            # Convertit en float puis en int
            return int(float(value))
        except (ValueError, TypeError):
            return None
    
    def match_exists(self, new_match: Dict) -> bool:
        """Vérifie si un match existe déjà"""
        for match in self.data.get('matchs', []):
            if (match.get('equipe1') == new_match['equipe1'] and
                match.get('equipe2') == new_match['equipe2'] and
                match.get('tournoi') == new_match['tournoi'] and
                str(match.get('poule')) == str(new_match.get('poule'))):
                return True
        return False
    
    def sync_all_sheets(self):
        """Synchronise toutes les feuilles"""
        print("[RECHERCHE] Détection des feuilles CNF 3...")
        
        sheet_names = self.get_all_sheet_names()
        
        if not sheet_names:
            print("[ERREUR] Aucune feuille trouvée")
            return False
        
        # Séparer les poules et le tableau final
        poule_sheets = [s for s in sheet_names if s.startswith('Poule ')]
        other_sheets = [s for s in sheet_names if not s.startswith('Poule ')]
        
        print(f"[INFO] {len(poule_sheets)} poule(s) détectée(s)")
        if other_sheets:
            print(f"[INFO] Autres feuilles: {', '.join(other_sheets)}")
        print()
        
        nouveaux_matchs = 0
        total_matchs = 0
        
        # Traiter les poules
        for sheet_name in sorted(poule_sheets):
            rows = self.get_sheet_data(sheet_name)
            if not rows:
                continue
            
            print(f"[FEUILLE] {sheet_name}...", end=' ')
            matchs = self.parse_poule_sheet(sheet_name, rows)
            
            sheet_new = 0
            for match in matchs:
                total_matchs += 1
                if not self.match_exists(match):
                    self.data['matchs'].append(match)
                    nouveaux_matchs += 1
                    sheet_new += 1
            
            if sheet_new > 0:
                print(f"[OK] {sheet_new} nouveau(x) match(s)")
            else:
                print("✓ À jour")
        
        # Traiter le tableau final (si présent et structure différente)
        if 'Tableau final' in other_sheets:
            print(f"\n[FEUILLE] Tableau final... [ATTENTION]  Structure différente, à développer si nécessaire")
        
        print()
        if nouveaux_matchs > 0:
            self._save_data()
            print(f"[SUCCESS] Résumé: {nouveaux_matchs}/{total_matchs} nouveau(x) match(s)")
            return True
        else:
            print("✓ Aucun nouveau match")
            return False


def main():
    """Fonction principale"""
    print("[CNF3] Synchronisation CNF 3 - Tournoi")
    print("=" * 60)
    
    try:
        sync = CNF3Sync()
        has_new_data = sync.sync_all_sheets()
        
        if has_new_data:
            print("\n[INFO] N'oubliez pas de recalculer les ELO:")
            print("   python recalculer_elo_cnf3.py")
        
        print("\n" + "=" * 60)
        print("[OK] Synchronisation terminée")
        
    except Exception as e:
        print(f"\n[ERREUR] Erreur: {e}")
        import traceback
        traceback.print_exc()
        raise


if __name__ == "__main__":
    main()

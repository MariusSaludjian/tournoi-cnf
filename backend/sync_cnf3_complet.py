#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de synchronisation CNF 3 OPTIMISE - Version Batch
Recupere TOUTES les feuilles en une seule requete pour eviter les rate limits
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Any
import gspread
from google.oauth2.service_account import Credentials
import time

# Configuration
SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/drive.readonly'
]
DATA_FILE = 'data.json'
CREDENTIALS_FILE = 'credentials.json'
SPREADSHEET_ID = '1xsJZmdlmki84wcxKzU5PilK37dAir_rD6uSm1hKB6jI'  # A REMPLACER

IGNORED_SHEETS = ['Chapeaux', 'Planning matchs', 'Premiers', 'Deuxiemes', 'Poules']

# Parametres ELO
K_FACTOR_DOUBLE = 24
PHASE_MULTIPLIERS = {
    # Poules
    "Poules": 1.0,
    # Phases finales - avec accents (noms produits par parse_tableau_final_sheet)
    "32èmes": 1.2, "16èmes": 1.4, "8èmes": 1.6,
    "Quarts": 1.8, "Demis": 2.2, "Finale": 3.0,
    # Alias sans accents (sécurité)
    "32emes": 1.2, "16emes": 1.4, "8emes": 1.6,
}

def calculer_nouveau_elo_complexe(elo_joueur, elo_adversaire, s_gagnes, s_perdus, phase):
    """Calcule le nouveau ELO"""
    est_victoire = s_gagnes > s_perdus
    score_reel = 1.0 if est_victoire else 0.0
    probabilite = 1.0 / (1.0 + 10.0 ** ((elo_adversaire - elo_joueur) / 400.0))
    phase_mult = PHASE_MULTIPLIERS.get(phase, 1.0)
    total_sets = s_gagnes + s_perdus
    if total_sets > 0:
        diff = abs(s_gagnes - s_perdus)
        score_mult = 1.0 + (diff / total_sets) * 0.5 
    else:
        score_mult = 1.0
    k_base = K_FACTOR_DOUBLE * 0.75
    changement = k_base * phase_mult * score_mult * (score_reel - probabilite)
    nouveau_elo = elo_joueur + changement
    return round(nouveau_elo, 1), changement

def mettre_a_jour_joueur_stats(joueur_data, sets_gagnes, sets_perdus, tournoi, nouveau_elo):
    """Met a jour les stats d'un joueur"""
    est_victoire = sets_gagnes > sets_perdus
    joueur_data['matchs_joues'] += 1
    joueur_data['sets_gagnes'] += sets_gagnes
    joueur_data['sets_perdus'] += sets_perdus
    if est_victoire:
        joueur_data['victoires'] += 1
    else:
        joueur_data['defaites'] += 1
    if tournoi not in joueur_data.get('tournois', []):
        joueur_data.setdefault('tournois', []).append(tournoi)
    joueur_data.setdefault('forme_recente', [])
    joueur_data['forme_recente'].append('V' if est_victoire else 'D')
    joueur_data['forme_recente'] = joueur_data['forme_recente'][-5:]
    joueur_data['elo'] = nouveau_elo
    joueur_data['elo_max'] = max(joueur_data.get('elo_max', 1500), nouveau_elo)
    joueur_data['elo_min'] = min(joueur_data.get('elo_min', 1500), nouveau_elo)
    total = joueur_data['matchs_joues']
    if total > 0:
        joueur_data['pourcentage_victoires'] = round((joueur_data['victoires'] / total) * 100, 1)
        denom = max(joueur_data['sets_perdus'], 1)
        joueur_data['ratio_sets'] = round(joueur_data['sets_gagnes'] / denom, 2)

def trouver_joueur(data, nom):
    for j in data['joueurs']:
        if j['nom'] == nom:
            return j
    return None

def ajouter_nouveau_joueur(data, nom):
    nouveau = {
        "nom": nom, "matchs_joues": 0, "victoires": 0, "defaites": 0,
        "sets_gagnes": 0, "sets_perdus": 0, "pourcentage_victoires": 0.0,
        "ratio_sets": 0.0, "elo": 1500.0, "elo_max": 1500.0, "elo_min": 1500.0,
        "tournois": [], "forme_recente": [], "photo": "photos/default.svg"
    }
    data['joueurs'].append(nouveau)
    print(f"  [NOUVEAU] Joueur cree: {nom}")
    return nouveau

class CNF3SyncOptimise:
    def __init__(self):
        self.credentials = self._get_credentials()
        self.client = gspread.authorize(self.credentials)
        self.data = self._load_data()
        
    def _get_credentials(self):
        if not os.path.exists(CREDENTIALS_FILE):
            raise FileNotFoundError(f"Fichier {CREDENTIALS_FILE} introuvable.")
        return Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=SCOPES)
    
    def _load_data(self) -> Dict:
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {"joueurs": [], "matchs": []}
    
    def _save_data(self):
        self.data["derniere_maj"] = datetime.now().strftime("%Y-%m-%d")
        nb_joueurs = len(self.data["joueurs"])
        nb_matchs_simples = len(self.data.get("matchs", []))
        nb_matchs_doubles = len(self.data.get("matchs_cnf3", []))
        total_sets = 0
        for m in self.data.get("matchs", []):
            total_sets += m.get("score1", 0) + m.get("score2", 0)
        for m in self.data.get("matchs_cnf3", []):
            total_sets += (m.get("score1") or 0) + (m.get("score2") or 0)
        self.data["stats_globales"] = {
            "total_joueurs": nb_joueurs,
            "total_matchs": nb_matchs_simples + nb_matchs_doubles,
            "total_sets": total_sets
        }
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, ensure_ascii=False, indent=2)
        print(f"[OK] Fichier {DATA_FILE} mis a jour avec succes")
    
    def get_all_sheets_data_batch(self):
        """OPTIMISATION : Recupere toutes les feuilles en batch"""
        try:
            spreadsheet = self.client.open_by_key(SPREADSHEET_ID)
            all_worksheets = spreadsheet.worksheets()
            
            # Filtre les poules
            poule_sheets = {}
            for ws in all_worksheets:
                if ws.title.startswith('Poule ') and ws.title not in IGNORED_SHEETS:
                    poule_sheets[ws.title] = ws.get_all_values()
            
            return poule_sheets
            
        except Exception as e:
            print(f"[ERREUR] Erreur lors de la recuperation batch: {e}")
            return {}

    def get_tableau_final_data(self):
        """Recupere les donnees de la feuille Tableau final"""
        try:
            spreadsheet = self.client.open_by_key(SPREADSHEET_ID)
            ws = spreadsheet.worksheet('Tableau final')
            return ws.get_all_values()
        except Exception as e:
            print(f"[ERREUR] Impossible de recuperer 'Tableau final': {e}")
            return []

    def _parse_score_tableau(self, value):
        if value is None or value == '':
            return None
        try:
            return int(float(value))
        except (ValueError, TypeError):
            return None

    def trouver_joueurs_equipe(self, nom_equipe: str):
        """Cherche les joueurs d'une equipe dans equipes ou poules_cnf3"""
        # Cherche dans equipes
        for eq in self.data.get('equipes', []):
            if eq.get('nom') == nom_equipe:
                j1 = eq.get('joueur1', '')
                j2 = eq.get('joueur2', '')
                return j1, j2
        # Cherche dans poules_cnf3
        for poule in self.data.get('poules_cnf3', []):
            for eq in poule.get('equipes', []):
                if eq.get('nom') == nom_equipe:
                    return eq.get('joueur1', ''), eq.get('joueur2', '')
        return '', ''

    def parse_tableau_final_sheet(self, rows: List[List[Any]]) -> List[Dict]:
        """
        Parse la feuille 'Tableau final'.
        Structure :
        - 32emes : col B(1)=seed, C(2)=equipe, E(4)=score - paires de lignes consecutives
        - 16emes : col H(7)=seed, I(8)=equipe, K(10)=score - paires
        - 8emes  : col N(13)=seed, O(14)=equipe, Q(16)=score
        - Quarts : col T(19)=seed, U(20)=equipe, W(22)=score
        - Demis  : col Z(25)=seed, AA(26)=equipe, AC(28)=score
        - Finale : col AF(31)=seed, AG(32)=equipe, AI(34)=score
        """
        matchs = []

        def extraire_equipes_phase(col_seed, col_team, col_score):
            """Extrait les donnees d'equipes pour une phase donnee"""
            equipes_phase = []
            for row in rows:
                if len(row) <= max(col_seed, col_team):
                    continue
                seed_val = row[col_seed] if col_seed < len(row) else None
                team_val = row[col_team] if col_team < len(row) else None
                score_val = row[col_score] if col_score < len(row) else None
                # Doit avoir un seed numerique et un nom d'equipe non vide
                if (seed_val is not None and str(seed_val).strip() != '' and
                        team_val is not None and str(team_val).strip() != ''):
                    try:
                        seed = int(float(str(seed_val)))
                        team = str(team_val).strip().replace('\n', ' ')
                        score = self._parse_score_tableau(score_val)
                        equipes_phase.append({'seed': seed, 'team': team, 'score': score})
                    except (ValueError, TypeError):
                        pass
            return equipes_phase

        def construire_matchs_phase(equipes, phase_name):
            """Groupe les equipes par paires pour former les matchs"""
            result = []
            i = 0
            while i + 1 < len(equipes):
                t1 = equipes[i]
                t2 = equipes[i + 1]
                s1 = t1['score']
                s2 = t2['score']
                gagnant = None
                if s1 is not None and s2 is not None:
                    gagnant = t1['team'] if s1 > s2 else t2['team']
                j1_eq1, j2_eq1 = self.trouver_joueurs_equipe(t1['team'])
                j1_eq2, j2_eq2 = self.trouver_joueurs_equipe(t2['team'])
                result.append({
                    'phase': phase_name,
                    'equipe1': t1['team'], 'seed1': t1['seed'],
                    'equipe2': t2['team'], 'seed2': t2['seed'],
                    'score1': s1, 'score2': s2,
                    'gagnant': gagnant,
                    'joueur1_eq1': j1_eq1, 'joueur2_eq1': j2_eq1,
                    'joueur1_eq2': j1_eq2, 'joueur2_eq2': j2_eq2,
                })
                i += 2
            return result

        # Colonnes pour chaque phase (0-indexed)
        phases_config = [
            ('32èmes',  1,  2,  4),   # B, C, E
            ('16èmes',  7,  8, 10),   # H, I, K
            ('8èmes',  13, 14, 16),   # N, O, Q
            ('Quarts', 19, 20, 22),   # T, U, W
            ('Demis',  25, 26, 28),   # Z, AA, AC
            ('Finale', 31, 32, 34),   # AF, AG, AI
        ]

        for phase_name, c_seed, c_team, c_score in phases_config:
            equipes = extraire_equipes_phase(c_seed, c_team, c_score)
            phase_matchs = construire_matchs_phase(equipes, phase_name)
            matchs.extend(phase_matchs)
            joues = len([m for m in phase_matchs if m['gagnant']])
            print(f"  [{phase_name}] {len(phase_matchs)} matchs detectes ({joues} joues)")

        return matchs

    def match_tableau_exists(self, new_match: Dict) -> bool:
        """Verifie si un match du tableau final existe deja"""
        for match in self.data.get('matchs_cnf3', []):
            if (match.get('type') == 'tableau' and
                    match.get('phase') == new_match['phase'] and
                    match.get('equipe1') == new_match['equipe1'] and
                    match.get('equipe2') == new_match['equipe2']):
                return True
        return False

    def match_tableau_score_changed(self, new_match: Dict) -> bool:
        """Verifie si le score d'un match tableau a change (nouveau score disponible)"""
        for match in self.data.get('matchs_cnf3', []):
            if (match.get('type') == 'tableau' and
                    match.get('phase') == new_match['phase'] and
                    match.get('equipe1') == new_match['equipe1'] and
                    match.get('equipe2') == new_match['equipe2']):
                # Match existe - verifier si un score vient d'apparaitre
                ancien_gagnant = match.get('gagnant')
                nouveau_gagnant = new_match.get('gagnant')
                if ancien_gagnant is None and nouveau_gagnant is not None:
                    return True
        return False

    def traiter_match_tableau(self, match_data: Dict):
        """Traite un match du tableau final avec calcul ELO"""
        if not match_data.get('gagnant'):
            return None  # Match pas encore joue
        
        j1 = trouver_joueur(self.data, match_data['joueur1_eq1']) or ajouter_nouveau_joueur(self.data, match_data['joueur1_eq1']) if match_data['joueur1_eq1'] else None
        j2 = trouver_joueur(self.data, match_data['joueur2_eq1']) or ajouter_nouveau_joueur(self.data, match_data['joueur2_eq1']) if match_data['joueur2_eq1'] else None
        j3 = trouver_joueur(self.data, match_data['joueur1_eq2']) or ajouter_nouveau_joueur(self.data, match_data['joueur1_eq2']) if match_data['joueur1_eq2'] else None
        j4 = trouver_joueur(self.data, match_data['joueur2_eq2']) or ajouter_nouveau_joueur(self.data, match_data['joueur2_eq2']) if match_data['joueur2_eq2'] else None

        s1 = match_data['score1']
        s2 = match_data['score2']
        phase = match_data['phase']

        delta_eq1 = 0
        if j1 and j2 and j3 and j4 and s1 is not None and s2 is not None:
            elo_eq1 = (j1['elo'] + j2['elo']) / 2
            elo_eq2 = (j3['elo'] + j4['elo']) / 2
            _, delta_eq1 = calculer_nouveau_elo_complexe(elo_eq1, elo_eq2, s1, s2, phase)
            delta_eq2 = -delta_eq1
            mettre_a_jour_joueur_stats(j1, s1, s2, "CNF 3", j1['elo'] + delta_eq1)
            mettre_a_jour_joueur_stats(j2, s1, s2, "CNF 3", j2['elo'] + delta_eq1)
            mettre_a_jour_joueur_stats(j3, s2, s1, "CNF 3", j3['elo'] + delta_eq2)
            mettre_a_jour_joueur_stats(j4, s2, s1, "CNF 3", j4['elo'] + delta_eq2)

        if 'matchs_cnf3' not in self.data:
            self.data['matchs_cnf3'] = []

        match_obj = {
            "id": len(self.data['matchs_cnf3']) + 1,
            "type": "tableau",
            "tournoi": "CNF 3",
            "phase": phase,
            "seed1": match_data.get('seed1'),
            "seed2": match_data.get('seed2'),
            "date": datetime.now().strftime("%Y-%m-%d"),
            "equipe1": match_data['equipe1'],
            "equipe2": match_data['equipe2'],
            "joueur1_eq1": match_data['joueur1_eq1'],
            "joueur2_eq1": match_data['joueur2_eq1'],
            "joueur1_eq2": match_data['joueur1_eq2'],
            "joueur2_eq2": match_data['joueur2_eq2'],
            "score1": s1,
            "score2": s2,
            "gagnant": match_data['gagnant'],
        }
        self.data['matchs_cnf3'].append(match_obj)
        return delta_eq1

    def mettre_a_jour_score_tableau(self, new_match: Dict):
        """Met a jour le score d'un match tableau existant et recalcule l'ELO"""
        for match in self.data.get('matchs_cnf3', []):
            if (match.get('type') == 'tableau' and
                    match.get('phase') == new_match['phase'] and
                    match.get('equipe1') == new_match['equipe1'] and
                    match.get('equipe2') == new_match['equipe2']):
                match['score1'] = new_match['score1']
                match['score2'] = new_match['score2']
                match['gagnant'] = new_match['gagnant']
                print(f"    [UPDATE] Score mis a jour: {match['equipe1']} {match['score1']}-{match['score2']} {match['equipe2']}")
                # Recalcul ELO pour ce match
                new_match['joueur1_eq1'] = match.get('joueur1_eq1', '')
                new_match['joueur2_eq1'] = match.get('joueur2_eq1', '')
                new_match['joueur1_eq2'] = match.get('joueur1_eq2', '')
                new_match['joueur2_eq2'] = match.get('joueur2_eq2', '')
                j1 = trouver_joueur(self.data, match.get('joueur1_eq1', ''))
                j2 = trouver_joueur(self.data, match.get('joueur2_eq1', ''))
                j3 = trouver_joueur(self.data, match.get('joueur1_eq2', ''))
                j4 = trouver_joueur(self.data, match.get('joueur2_eq2', ''))
                if j1 and j2 and j3 and j4:
                    elo_eq1 = (j1['elo'] + j2['elo']) / 2
                    elo_eq2 = (j3['elo'] + j4['elo']) / 2
                    _, delta = calculer_nouveau_elo_complexe(elo_eq1, elo_eq2, new_match['score1'], new_match['score2'], new_match['phase'])
                    mettre_a_jour_joueur_stats(j1, new_match['score1'], new_match['score2'], "CNF 3", j1['elo'] + delta)
                    mettre_a_jour_joueur_stats(j2, new_match['score1'], new_match['score2'], "CNF 3", j2['elo'] + delta)
                    mettre_a_jour_joueur_stats(j3, new_match['score2'], new_match['score1'], "CNF 3", j3['elo'] - delta)
                    mettre_a_jour_joueur_stats(j4, new_match['score2'], new_match['score1'], "CNF 3", j4['elo'] - delta)
                return True
        return False
    
    def _parse_score(self, value):
        if value is None or value == '':
            return None
        try:
            return int(float(value))
        except (ValueError, TypeError):
            return None
    
    def parse_poule_sheet(self, sheet_name: str, rows: List[List[Any]]) -> List[Dict]:
        matchs = []
        if len(rows) < 4:
            return matchs
        
        poule_num = sheet_name.replace('Poule ', '').strip()
        
        try:
            equipe1 = rows[3][1] if len(rows[3]) > 1 else None
            joueur1_eq1 = rows[3][2] if len(rows[3]) > 2 else None
            joueur2_eq1 = rows[4][2] if len(rows) > 4 and len(rows[4]) > 2 else None
            
            equipe2 = rows[5][1] if len(rows) > 5 and len(rows[5]) > 1 else None
            joueur1_eq2 = rows[5][2] if len(rows) > 5 and len(rows[5]) > 2 else None
            joueur2_eq2 = rows[6][2] if len(rows) > 6 and len(rows[6]) > 2 else None
            
            equipe3 = rows[7][1] if len(rows) > 7 and len(rows[7]) > 1 else None
            joueur1_eq3 = rows[7][2] if len(rows) > 7 and len(rows[7]) > 2 else None
            joueur2_eq3 = rows[8][2] if len(rows) > 8 and len(rows[8]) > 2 else None
            
            match1_score1 = self._parse_score(rows[3][8]) if len(rows[3]) > 8 else None
            match1_score2 = self._parse_score(rows[3][9]) if len(rows[3]) > 9 else None
            match2_score1 = self._parse_score(rows[4][8]) if len(rows) > 4 and len(rows[4]) > 8 else None
            match2_score2 = self._parse_score(rows[4][9]) if len(rows) > 4 and len(rows[4]) > 9 else None
            match3_score1 = self._parse_score(rows[5][8]) if len(rows) > 5 and len(rows[5]) > 8 else None
            match3_score2 = self._parse_score(rows[5][9]) if len(rows) > 5 and len(rows[5]) > 9 else None
            
            matches_data = [
                (equipe1, joueur1_eq1, joueur2_eq1, equipe3, joueur1_eq3, joueur2_eq3, match1_score1, match1_score2),
                (equipe2, joueur1_eq2, joueur2_eq2, equipe3, joueur1_eq3, joueur2_eq3, match2_score1, match2_score2),
                (equipe1, joueur1_eq1, joueur2_eq1, equipe2, joueur1_eq2, joueur2_eq2, match3_score1, match3_score2)
            ]
            
            for eq1, j1_eq1, j2_eq1, eq2, j1_eq2, j2_eq2, score1, score2 in matches_data:
                if score1 is not None and score2 is not None and eq1 and eq2:
                    matchs.append({
                        "poule": poule_num, "phase": "Poules",
                        "equipe1": eq1, "equipe2": eq2,
                        "joueur1_eq1": j1_eq1 or "", "joueur2_eq1": j2_eq1 or "",
                        "joueur1_eq2": j1_eq2 or "", "joueur2_eq2": j2_eq2 or "",
                        "score1": score1, "score2": score2,
                        "gagnant": eq1 if score1 > score2 else eq2,
                        "source_sheet": sheet_name
                    })
        except Exception as e:
            print(f"[ATTENTION] Erreur parsing '{sheet_name}': {e}")
        
        return matchs
    
    def match_exists(self, new_match: Dict) -> bool:
        for match in self.data.get('matchs_cnf3', []):
            if (match.get('equipe1') == new_match['equipe1'] and
                match.get('equipe2') == new_match['equipe2'] and
                str(match.get('poule')) == str(new_match.get('poule'))):
                return True
        return False
    
    def traiter_match(self, match_data: Dict):
        j1 = trouver_joueur(self.data, match_data['joueur1_eq1'])
        j2 = trouver_joueur(self.data, match_data['joueur2_eq1'])
        j3 = trouver_joueur(self.data, match_data['joueur1_eq2'])
        j4 = trouver_joueur(self.data, match_data['joueur2_eq2'])
        
        if not j1: j1 = ajouter_nouveau_joueur(self.data, match_data['joueur1_eq1'])
        if not j2: j2 = ajouter_nouveau_joueur(self.data, match_data['joueur2_eq1'])
        if not j3: j3 = ajouter_nouveau_joueur(self.data, match_data['joueur1_eq2'])
        if not j4: j4 = ajouter_nouveau_joueur(self.data, match_data['joueur2_eq2'])
        
        elo_eq1 = (j1['elo'] + j2['elo']) / 2
        elo_eq2 = (j3['elo'] + j4['elo']) / 2
        s1 = match_data['score1']
        s2 = match_data['score2']
        phase = match_data['phase']
        
        _, delta_eq1 = calculer_nouveau_elo_complexe(elo_eq1, elo_eq2, s1, s2, phase)
        delta_eq2 = -delta_eq1
        
        mettre_a_jour_joueur_stats(j1, s1, s2, "CNF 3", j1['elo'] + delta_eq1)
        mettre_a_jour_joueur_stats(j2, s1, s2, "CNF 3", j2['elo'] + delta_eq1)
        mettre_a_jour_joueur_stats(j3, s2, s1, "CNF 3", j3['elo'] + delta_eq2)
        mettre_a_jour_joueur_stats(j4, s2, s1, "CNF 3", j4['elo'] + delta_eq2)
        
        if 'matchs_cnf3' not in self.data:
            self.data['matchs_cnf3'] = []
        
        match_obj = {
            "id": len(self.data['matchs_cnf3']) + 1,
            "type": "poule", "tournoi": "CNF 3", "phase": phase,
            "poule": match_data['poule'],
            "date": datetime.now().strftime("%Y-%m-%d"),
            "equipe1": match_data['equipe1'], "equipe2": match_data['equipe2'],
            "joueur1_eq1": j1['nom'], "joueur2_eq1": j2['nom'],
            "joueur1_eq2": j3['nom'], "joueur2_eq2": j4['nom'],
            "score1": s1, "score2": s2, "gagnant": match_data['gagnant'],
            "live": True
        }
        
        self.data['matchs_cnf3'].append(match_obj)
        return delta_eq1, j1, j2, j3, j4
    
    def sync_all_sheets(self):
        """Synchronise toutes les feuilles en BATCH (optimise) + Tableau final"""
        print("[CNF3] Synchronisation CNF 3 - Version Optimisee Batch")
        print("="*60)
        print("[RECHERCHE] Recuperation de toutes les feuilles en une fois...")
        
        # Recupere TOUTES les poules en UNE SEULE requete
        all_poules_data = self.get_all_sheets_data_batch()
        
        if not all_poules_data:
            print("[ERREUR] Aucune feuille de poule trouvee")
            return False
        
        print(f"[OK] {len(all_poules_data)} poule(s) recuperee(s)")
        print()
        
        nouveaux_matchs = 0
        
        for sheet_name in sorted(all_poules_data.keys()):
            rows = all_poules_data[sheet_name]
            print(f"[FEUILLE] {sheet_name}...", end=' ')
            matchs = self.parse_poule_sheet(sheet_name, rows)
            
            sheet_new = 0
            for match_data in matchs:
                if not self.match_exists(match_data):
                    delta, j1, j2, j3, j4 = self.traiter_match(match_data)
                    nouveaux_matchs += 1
                    sheet_new += 1
                    print(f"\n  [NOUVEAU] {match_data['equipe1']} vs {match_data['equipe2']}: {match_data['score1']}-{match_data['score2']}")
                    print(f"     ELO: {delta:+.1f} pts par joueur")
            
            if sheet_new == 0:
                print("[OK] A jour")
        
        print()
        print("[TABLEAU] Synchronisation du Tableau final...")
        rows_tableau = self.get_tableau_final_data()
        
        if rows_tableau:
            matchs_tableau = self.parse_tableau_final_sheet(rows_tableau)
            nouveaux_tableau = 0
            updates_tableau = 0
            
            # ── Construire aussi tableau_cnf3 pour le visuel bracket ───────
            tableau_cnf3 = {k: [] for k in ['32emes','16emes','8emes','quarts','demis','finale']}
            PHASE_TO_KEY = {
                '32èmes': '32emes', '16èmes': '16emes', '8èmes': '8emes',
                'Quarts': 'quarts', 'Demis': 'demis', 'Finale': 'finale',
            }
            for m in matchs_tableau:
                key = PHASE_TO_KEY.get(m['phase'])
                if key:
                    tableau_cnf3[key].append({
                        'match_num': len(tableau_cnf3[key]) + 1,
                        'seed1': m.get('seed1'), 'equipe1': m['equipe1'], 'score1': m['score1'],
                        'seed2': m.get('seed2'), 'equipe2': m['equipe2'], 'score2': m['score2'],
                        'gagnant': m['gagnant'],
                    })
            self.data['tableau_cnf3'] = tableau_cnf3
            # ───────────────────────────────────────────────────────────────

            for match_data in matchs_tableau:
                if not self.match_tableau_exists(match_data):
                    if match_data.get('gagnant'):
                        # Match joue pour la premiere fois → ELO + stats
                        delta = self.traiter_match_tableau(match_data)
                        nouveaux_matchs += 1
                        nouveaux_tableau += 1
                        print(f"  [NOUVEAU] [{match_data['phase']}] {match_data['equipe1']} {match_data['score1']}-{match_data['score2']} {match_data['equipe2']}")
                    # Les matchs sans score NE sont PAS stockes dans matchs_cnf3
                    # (ils sont uniquement dans tableau_cnf3 pour le visuel)
                elif self.match_tableau_score_changed(match_data):
                    # Un score vient d'apparaitre → update ELO
                    self.mettre_a_jour_score_tableau(match_data)
                    nouveaux_matchs += 1
                    updates_tableau += 1
            
            if nouveaux_tableau > 0:
                print(f"[OK] Tableau final: {nouveaux_tableau} nouveau(x) match(s) joue(s)")
            if updates_tableau > 0:
                print(f"[OK] Tableau final: {updates_tableau} score(s) mis a jour et ELO recalcule")
            if nouveaux_tableau == 0 and updates_tableau == 0:
                print("[OK] Tableau final: a jour")
        
        print()
        # Toujours sauvegarder : tableau_cnf3 est mis a jour a chaque sync
        self._save_data()
        if nouveaux_matchs > 0:
            print(f"[SUCCESS] {nouveaux_matchs} match(s) mis a jour (ELO recalcule)")
            return True
        else:
            print("[OK] Aucun nouveau match de poule ou tableau")
            return False

def main():
    print("[CNF3] Synchronisation CNF 3 - Avec Calcul ELO (OPTIMISE)")
    print("="*60)
    
    try:
        sync = CNF3SyncOptimise()
        has_new_data = sync.sync_all_sheets()
        
        if has_new_data:
            print("\n[OK] Synchronisation terminee avec mise a jour ELO")
        
        print("\n" + "="*60)
        print("[OK] Termine")
        
    except Exception as e:
        print(f"\n[ERREUR] Erreur: {e}")
        import traceback
        traceback.print_exc()
        raise

if __name__ == "__main__":
    main()
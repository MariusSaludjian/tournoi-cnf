#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de synchronisation du TABLEAU FINAL CNF 3
Lit la feuille "Tableau final" depuis Google Sheets.

STRUCTURE DE LA FEUILLE (colonnes fixes, pas d'en-têtes par match) :
  32èmes  → col B (seed), C (équipe), E (score)
  16èmes  → col H (seed), I (équipe), K (score)
  8èmes   → col N (seed), O (équipe), Q (score)
  Quarts  → col T (seed), U (équipe), W (score)
  Demis   → col Z (seed), AA (équipe), AC (score)
  Finale  → col AF (seed), AG (équipe), AI (score)

Chaque match = 2 lignes consécutives (équipe1 puis équipe2).
Les matchs non joués ont un score vide → ignorés.
"""

import json
import os
import sys
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import gspread
from google.oauth2.service_account import Credentials

# ─── CONFIGURATION ────────────────────────────────────────────────────────────

SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/drive.readonly'
]

DATA_FILE        = 'data.json'
CREDENTIALS_FILE = 'credentials.json'
SPREADSHEET_ID   = '1xsJZmdlmki84wcxKzU5PilK37dAir_rD6uSm1hKB6jI'
SHEET_NAME       = 'Tableau final'

# Phases : (clé dans tableau_cnf3, label lisible, col_seed, col_equipe, col_score)
# Numéros de colonnes en base 1 (A=1, B=2, etc.)
PHASES = [
    ('32emes', '32èmes', 2,  3,  5),   # B, C, E
    ('16emes', '16èmes', 8,  9,  11),  # H, I, K
    ('8emes',  '8èmes',  14, 15, 17),  # N, O, Q
    ('quarts', 'Quarts', 20, 21, 23),  # T, U, W
    ('demis',  'Demis',  26, 27, 29),  # Z, AA, AC
    ('finale', 'Finale', 32, 33, 35),  # AF, AG, AI
]

# ─── PARAMÈTRES ELO ──────────────────────────────────────────────────────────

K_FACTOR = 24
PHASE_MULTIPLIERS = {
    '32èmes': 1.2, '16èmes': 1.4, '8èmes':  1.6,
    'Quarts': 1.8, 'Demis':  2.2, 'Finale': 3.0,
}

# ─── CALCUL ELO ───────────────────────────────────────────────────────────────

def calculer_delta_elo(elo_j, elo_adv, s_gagnes, s_perdus, phase):
    victoire   = s_gagnes > s_perdus
    proba      = 1.0 / (1.0 + 10.0 ** ((elo_adv - elo_j) / 400.0))
    mult_phase = PHASE_MULTIPLIERS.get(phase, 1.0)
    total      = s_gagnes + s_perdus
    mult_score = 1.0 + (abs(s_gagnes - s_perdus) / total * 0.5) if total else 1.0
    k          = K_FACTOR * 0.75
    return round(k * mult_phase * mult_score * ((1.0 if victoire else 0.0) - proba), 2)


def maj_stats_joueur(joueur, sets_gagnes, sets_perdus, nouveau_elo):
    joueur['matchs_joues'] += 1
    joueur['sets_gagnes']  += sets_gagnes
    joueur['sets_perdus']  += sets_perdus
    if sets_gagnes > sets_perdus:
        joueur['victoires'] += 1
        joueur.setdefault('forme_recente', []).append('V')
    else:
        joueur['defaites'] += 1
        joueur.setdefault('forme_recente', []).append('D')
    joueur['forme_recente'] = joueur['forme_recente'][-5:]
    joueur['elo']     = nouveau_elo
    joueur['elo_max'] = max(joueur.get('elo_max', 1500.0), nouveau_elo)
    joueur['elo_min'] = min(joueur.get('elo_min', 1500.0), nouveau_elo)
    total = joueur['matchs_joues']
    if total:
        joueur['pourcentage_victoires'] = round(joueur['victoires'] / total * 100, 1)
        joueur['ratio_sets'] = round(joueur['sets_gagnes'] / max(joueur['sets_perdus'], 1), 2)
    if 'CNF 3' not in joueur.get('tournois', []):
        joueur.setdefault('tournois', []).append('CNF 3')


# ─── CLASSE PRINCIPALE ────────────────────────────────────────────────────────

class TableauFinalSync:

    def __init__(self):
        self.creds  = self._get_credentials()
        self.client = gspread.authorize(self.creds)
        self.data   = self._load_data()
        self._team_players: Dict[str, Tuple[str, str]] = {}
        self._build_team_player_cache()

    # ── I/O ─────────────────────────────────────────────────────────────────

    def _get_credentials(self):
        if not os.path.exists(CREDENTIALS_FILE):
            raise FileNotFoundError(f'Fichier {CREDENTIALS_FILE} introuvable.')
        return Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=SCOPES)

    def _load_data(self):
        if not os.path.exists(DATA_FILE):
            raise FileNotFoundError(f'Fichier {DATA_FILE} introuvable.')
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)

    def _save_data(self):
        self.data['derniere_maj'] = datetime.now().strftime('%Y-%m-%d')
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, ensure_ascii=False, indent=2)
        print(f'[OK] {DATA_FILE} sauvegardé.')

    # ── Cache équipes → joueurs ──────────────────────────────────────────────

    def _build_team_player_cache(self):
        """Construit {nom_equipe: (joueur1, joueur2)} depuis matchs_cnf3 existants."""
        for m in self.data.get('matchs_cnf3', []):
            eq1 = (m.get('equipe1') or '').strip()
            eq2 = (m.get('equipe2') or '').strip()
            if eq1 and m.get('joueur1_eq1'):
                self._team_players[eq1] = (
                    m.get('joueur1_eq1', '').strip(),
                    m.get('joueur2_eq1', '').strip()
                )
            if eq2 and m.get('joueur1_eq2'):
                self._team_players[eq2] = (
                    m.get('joueur1_eq2', '').strip(),
                    m.get('joueur2_eq2', '').strip()
                )

    def _get_players(self, equipe):
        return self._team_players.get(equipe.strip(), ('', ''))

    # ── Joueurs ──────────────────────────────────────────────────────────────

    def _get_joueur(self, nom):
        if not nom or not nom.strip():
            return None
        nom = nom.strip()
        for j in self.data['joueurs']:
            if j['nom'] == nom:
                return j
        nouveau = {
            'nom': nom, 'matchs_joues': 0, 'victoires': 0, 'defaites': 0,
            'sets_gagnes': 0, 'sets_perdus': 0, 'pourcentage_victoires': 0.0,
            'ratio_sets': 0.0, 'elo': 1500.0, 'elo_max': 1500.0, 'elo_min': 1500.0,
            'tournois': ['CNF 3'], 'forme_recente': [], 'photo': 'photos/default.svg'
        }
        self.data['joueurs'].append(nouveau)
        print(f'  [NOUVEAU JOUEUR] {nom}')
        return nouveau

    # ── Lecture Google Sheets ────────────────────────────────────────────────

    def _get_sheet_rows(self):
        spreadsheet = self.client.open_by_key(SPREADSHEET_ID)
        try:
            ws = spreadsheet.worksheet(SHEET_NAME)
        except gspread.WorksheetNotFound:
            noms = ', '.join(w.title for w in spreadsheet.worksheets())
            raise RuntimeError(
                f'Feuille "{SHEET_NAME}" introuvable. Disponibles : {noms}'
            )
        return ws.get_all_values()  # Liste de listes de strings

    # ── Parsing ──────────────────────────────────────────────────────────────

    @staticmethod
    def _cell(rows, row_1based, col_1based):
        r, c = row_1based - 1, col_1based - 1
        if r < 0 or r >= len(rows) or c < 0 or c >= len(rows[r]):
            return None
        v = rows[r][c]
        return v.strip() if isinstance(v, str) else v

    @staticmethod
    def _to_int(val):
        if val is None or val == '':
            return None
        try:
            return int(float(str(val).strip()))
        except (ValueError, TypeError):
            return None

    def _extract_phase_matches(self, rows, phase_key, phase_label,
                                col_seed, col_equipe, col_score):
        """
        Parcourt toutes les lignes et regroupe les paires consécutives
        qui ont un nom d'équipe dans col_equipe et un seed numérique.
        """
        matches = []
        nrows = len(rows)
        i = 1  # 1-based

        while i < nrows:
            seed1   = self._cell(rows, i,     col_seed)
            equipe1 = self._cell(rows, i,     col_equipe)
            score1  = self._cell(rows, i,     col_score)
            seed2   = self._cell(rows, i + 1, col_seed)
            equipe2 = self._cell(rows, i + 1, col_equipe)
            score2  = self._cell(rows, i + 1, col_score)

            seed1_int = self._to_int(seed1)

            # Match valide : équipes non vides, seed1 est un entier (pas un titre)
            if equipe1 and equipe2 and seed1_int is not None:
                # Nettoie les sauts de ligne dans les noms d'équipes
                equipe1 = equipe1.replace('\n', ' ')
                equipe2 = equipe2.replace('\n', ' ')

                matches.append({
                    'phase_key':   phase_key,
                    'phase_label': phase_label,
                    'row':         i,
                    'seed1':       seed1_int,
                    'equipe1':     equipe1,
                    'score1':      self._to_int(score1),
                    'seed2':       self._to_int(seed2),
                    'equipe2':     equipe2,
                    'score2':      self._to_int(score2),
                })
                i += 2
                continue
            i += 1

        return matches

    # ── Doublons ─────────────────────────────────────────────────────────────

    def _match_exists(self, equipe1, equipe2, phase_label):
        for m in self.data.get('matchs_cnf3', []):
            if (m.get('equipe1') == equipe1
                    and m.get('equipe2') == equipe2
                    and m.get('phase') == phase_label
                    and m.get('score1') is not None):
                return True
        return False

    # ── Mise à jour tableau_cnf3 ─────────────────────────────────────────────

    def _update_tableau_cnf3(self, m):
        t = self.data.setdefault('tableau_cnf3', {})
        phase_list = t.setdefault(m['phase_key'], [])

        for entry in phase_list:
            if entry.get('equipe1') == m['equipe1'] and entry.get('equipe2') == m['equipe2']:
                entry['score1']  = m['score1']
                entry['score2']  = m['score2']
                entry['gagnant'] = m['equipe1'] if m['score1'] > m['score2'] else m['equipe2']
                return

        phase_list.append({
            'match_num': len(phase_list) + 1,
            'seed1':     m['seed1'],
            'equipe1':   m['equipe1'],
            'score1':    m['score1'],
            'seed2':     m['seed2'],
            'equipe2':   m['equipe2'],
            'score2':    m['score2'],
            'gagnant':   m['equipe1'] if m['score1'] > m['score2'] else m['equipe2'],
        })

    # ── Calcul ELO et stats joueurs ──────────────────────────────────────────

    def _traiter_elo(self, m):
        j1n, j2n = self._get_players(m['equipe1'])
        j3n, j4n = self._get_players(m['equipe2'])

        j1 = self._get_joueur(j1n)
        j2 = self._get_joueur(j2n)
        j3 = self._get_joueur(j3n)
        j4 = self._get_joueur(j4n)

        elo1 = ((j1['elo'] if j1 else 1500) + (j2['elo'] if j2 else 1500)) / 2
        elo2 = ((j3['elo'] if j3 else 1500) + (j4['elo'] if j4 else 1500)) / 2

        delta = calculer_delta_elo(elo1, elo2, m['score1'], m['score2'], m['phase_label'])

        for j in (j1, j2):
            if j:
                maj_stats_joueur(j, m['score1'], m['score2'], round(j['elo'] + delta, 1))
        for j in (j3, j4):
            if j:
                maj_stats_joueur(j, m['score2'], m['score1'], round(j['elo'] - delta, 1))

        return delta

    # ── Ajout dans matchs_cnf3 ───────────────────────────────────────────────

    def _ajouter_match_cnf3(self, m):
        matchs = self.data.setdefault('matchs_cnf3', [])
        new_id = max((x.get('id', 0) for x in matchs), default=0) + 1
        j1n, j2n = self._get_players(m['equipe1'])
        j3n, j4n = self._get_players(m['equipe2'])
        matchs.append({
            'id':          new_id,
            'type':        'tableau',
            'tournoi':     'CNF 3',
            'phase':       m['phase_label'],
            'seed1':       m['seed1'],
            'seed2':       m['seed2'],
            'date':        datetime.now().strftime('%Y-%m-%d'),
            'equipe1':     m['equipe1'],
            'equipe2':     m['equipe2'],
            'joueur1_eq1': j1n,
            'joueur2_eq1': j2n,
            'joueur1_eq2': j3n,
            'joueur2_eq2': j4n,
            'score1':      m['score1'],
            'score2':      m['score2'],
            'gagnant':     m['equipe1'] if m['score1'] > m['score2'] else m['equipe2'],
            'live':        True,
        })

    # ── Synchronisation principale ───────────────────────────────────────────

    def sync(self):
        print(f'[SHEETS] Lecture de la feuille "{SHEET_NAME}"...')
        rows = self._get_sheet_rows()
        print(f'  {len(rows)} lignes récupérées.\n')

        nouveaux_matchs = 0

        for phase_key, phase_label, col_seed, col_equipe, col_score in PHASES:
            matches = self._extract_phase_matches(
                rows, phase_key, phase_label, col_seed, col_equipe, col_score
            )
            played  = [m for m in matches if m['score1'] is not None and m['score2'] is not None]
            pending = len(matches) - len(played)

            print(f'[{phase_label:8s}] {len(matches):2d} match(es) | '
                  f'{len(played)} joué(s), {pending} à venir')

            for m in played:
                if self._match_exists(m['equipe1'], m['equipe2'], m['phase_label']):
                    continue

                gagnant = m['equipe1'] if m['score1'] > m['score2'] else m['equipe2']
                print(f"  [NOUVEAU] {m['equipe1']} {m['score1']}-{m['score2']} "
                      f"{m['equipe2']}  →  {gagnant}")

                delta = self._traiter_elo(m)
                print(f"            ELO : {delta:+.1f} pt(s)")

                self._update_tableau_cnf3(m)
                self._ajouter_match_cnf3(m)
                nouveaux_matchs += 1

        print()
        if nouveaux_matchs > 0:
            self._save_data()
            print(f'[SUCCESS] {nouveaux_matchs} nouveau(x) match(s) synchronisé(s).')
            return True
        else:
            print('[OK] Aucun nouveau match. Base de données déjà à jour.')
            return False


# ─── POINT D'ENTRÉE ───────────────────────────────────────────────────────────

def main():
    print('[CNF3] Sync Tableau Final — calcul ELO automatique')
    print('=' * 60)
    try:
        TableauFinalSync().sync()
    except (FileNotFoundError, RuntimeError) as e:
        print(f'[ERREUR] {e}')
        sys.exit(1)
    except Exception as e:
        print(f'[ERREUR INATTENDUE] {e}')
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()

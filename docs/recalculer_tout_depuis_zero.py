#!/usr/bin/env python3
"""
Recalcul complet ELO + stats depuis zéro.
1. Nettoie matchs_cnf3 (doublons + ordre : poules d'abord, tableau ensuite)
2. Remet tous les joueurs à ELO 1500
3. Rejoue matchs simples (CNF1/CNF2) → K=32
4. Rejoue matchs CNF3 propres → K=24 (32*0.75) avec multiplicateurs de phase
"""

import json, shutil
from datetime import datetime

# ─── Config ELO ──────────────────────────────────────────────────────────────
K_SIMPLE  = 32          # matchs individuels (CNF1, CNF2)
K_DOUBLE  = 32 * 0.75  # matchs doubles CNF3 (= 24)

PHASE_MULT = {
    "Poules": 1.0,
    "32èmes": 1.2, "16èmes": 1.4, "8èmes": 1.6,
    "Quarts": 1.8, "Demis":  2.2, "Finale": 3.0,
    # alias sans accent
    "32emes": 1.2, "16emes": 1.4, "8emes": 1.6,
}

def proba(elo_a, elo_b):
    return 1.0 / (1.0 + 10.0 ** ((elo_b - elo_a) / 400.0))

def delta_elo(elo_j, elo_adv, s_g, s_p, phase, k_base):
    est_win = s_g > s_p
    pm = PHASE_MULT.get(phase, 1.0)
    total = s_g + s_p
    sm = 1.0 + (abs(s_g - s_p) / total) * 0.5 if total > 0 else 1.0
    return k_base * pm * sm * ((1.0 if est_win else 0.0) - proba(elo_j, elo_adv))

def trouver_joueur(data, nom):
    for j in data['joueurs']:
        if j['nom'] == nom:
            return j
    return None

def reset_joueur(j):
    """Remet un joueur à son état initial."""
    j['elo']                  = 1500.0
    j['elo_max']              = 1500.0
    j['elo_min']              = 1500.0
    j['matchs_joues']         = 0
    j['victoires']            = 0
    j['defaites']             = 0
    j['sets_gagnes']          = 0
    j['sets_perdus']          = 0
    j['pourcentage_victoires']= 0.0
    j['ratio_sets']           = 0.0
    j['forme_recente']        = []
    j['tournois']             = []

def appliquer_stats(j, s_g, s_p, tournoi, nouveau_elo):
    est_win = s_g > s_p
    j['matchs_joues']  += 1
    j['sets_gagnes']   += s_g
    j['sets_perdus']   += s_p
    if est_win:  j['victoires']  += 1
    else:        j['defaites']   += 1
    if tournoi not in j.get('tournois', []):
        j.setdefault('tournois', []).append(tournoi)
    j.setdefault('forme_recente', [])
    j['forme_recente'].append('V' if est_win else 'D')
    j['forme_recente'] = j['forme_recente'][-5:]
    j['elo']     = round(nouveau_elo, 1)
    j['elo_max'] = max(j.get('elo_max', 1500), round(nouveau_elo, 1))
    j['elo_min'] = min(j.get('elo_min', 1500), round(nouveau_elo, 1))

def recalculer_ratios(data):
    for j in data['joueurs']:
        t = j['matchs_joues']
        if t > 0:
            j['pourcentage_victoires'] = round(j['victoires'] / t * 100, 1)
            j['ratio_sets'] = round(j['sets_gagnes'] / max(j['sets_perdus'], 1), 2)

# ─── Nettoyage doublons matchs_cnf3 ─────────────────────────────────────────
def normaliser_cle(m):
    """Clé canonique : (phase, equipe_min, equipe_max) pour dédoublonner."""
    e1 = (m.get('equipe1') or '').strip().lower()
    e2 = (m.get('equipe2') or '').strip().lower()
    return (m.get('phase', ''), min(e1, e2), max(e1, e2))

def nettoyer_matchs_cnf3(matchs):
    """
    - Supprime les doublons (même match dans les deux sens ou répété à l'identique)
    - En cas de doublon, garde celui qui a un gagnant (ou le premier)
    - Trie : poules d'abord, tableau ensuite (par phase)
    Retourne la liste propre + rapport des doublons supprimés.
    """
    seen = {}
    doublons = []
    for m in matchs:
        cle = normaliser_cle(m)
        if cle not in seen:
            seen[cle] = m
        else:
            # Garder celui avec le gagnant, sinon garder le premier
            existant = seen[cle]
            if existant.get('gagnant') is None and m.get('gagnant') is not None:
                doublons.append(existant)
                seen[cle] = m
            else:
                doublons.append(m)

    propres = list(seen.values())

    ORDRE_PHASE = {
        'Poules': 0,
        '32èmes': 1, '16èmes': 2, '8èmes': 3,
        'Quarts': 4, 'Demis': 5, 'Finale': 6,
    }

    def sort_key(m):
        type_order = 0 if m.get('type') == 'poule' else 1
        phase_order = ORDRE_PHASE.get(m.get('phase', ''), 99)
        return (type_order, phase_order, m.get('id', 0))

    propres.sort(key=sort_key)

    # Renuméroter les IDs
    for i, m in enumerate(propres, start=1):
        m['id'] = i

    return propres, doublons

# ─── Main ────────────────────────────────────────────────────────────────────
def main():
    print("=" * 65)
    print("RECALCUL COMPLET ELO + STATS DEPUIS ZERO")
    print("=" * 65)

    with open('data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Backup
    bk = f"data_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    shutil.copy('data.json', bk)
    print(f"[BACKUP] {bk}")

    # ── 1. Nettoyage matchs_cnf3 ─────────────────────────────────────────────
    print(f"\n[CLEAN] matchs_cnf3 avant : {len(data['matchs_cnf3'])}")
    matchs_cnf3_propres, doublons = nettoyer_matchs_cnf3(data['matchs_cnf3'])
    print(f"[CLEAN] Doublons supprimés : {len(doublons)}")
    for d in doublons:
        print(f"  - [{d.get('phase')}] {d.get('equipe1')} vs {d.get('equipe2')}")
    print(f"[CLEAN] matchs_cnf3 après  : {len(matchs_cnf3_propres)}")

    # Vérifier que les matchs sans gagnant ne sont pas présents
    sans_gagnant = [m for m in matchs_cnf3_propres if not m.get('gagnant')]
    if sans_gagnant:
        print(f"[WARN] {len(sans_gagnant)} matchs sans gagnant dans matchs_cnf3 — supprimés")
        matchs_cnf3_propres = [m for m in matchs_cnf3_propres if m.get('gagnant')]

    data['matchs_cnf3'] = matchs_cnf3_propres

    # ── 2. Reset tous les joueurs ─────────────────────────────────────────────
    print(f"\n[RESET] Remise à zéro de {len(data['joueurs'])} joueurs...")
    for j in data['joueurs']:
        reset_joueur(j)

    # ── 3. Replay matchs simples (CNF1 / CNF2) ───────────────────────────────
    matchs_simples = data.get('matchs', [])
    print(f"\n[SIMPLES] Traitement de {len(matchs_simples)} matchs individuels (K={K_SIMPLE})...")
    erreurs_simples = 0
    for m in matchs_simples:
        j1 = trouver_joueur(data, m.get('joueur1', ''))
        j2 = trouver_joueur(data, m.get('joueur2', ''))
        if not j1 or not j2:
            erreurs_simples += 1
            continue
        s1 = m.get('score1', 0) or 0
        s2 = m.get('score2', 0) or 0
        phase = m.get('phase', 'Poules')
        tournoi = m.get('tournoi', '')
        d1 = delta_elo(j1['elo'], j2['elo'], s1, s2, phase, K_SIMPLE)
        d2 = -d1
        appliquer_stats(j1, s1, s2, tournoi, j1['elo'] + d1)
        appliquer_stats(j2, s2, s1, tournoi, j2['elo'] + d2)
    if erreurs_simples:
        print(f"  [WARN] {erreurs_simples} matchs ignorés (joueur introuvable)")

    # ── 4. Replay matchs CNF3 propres ────────────────────────────────────────
    poules_cnf3 = [m for m in matchs_cnf3_propres if m.get('type') == 'poule']
    tableau_cnf3 = [m for m in matchs_cnf3_propres if m.get('type') == 'tableau']
    print(f"\n[CNF3] {len(poules_cnf3)} matchs de poule + {len(tableau_cnf3)} matchs de tableau (K={K_DOUBLE})")

    erreurs_cnf3 = 0
    for m in matchs_cnf3_propres:
        j1 = trouver_joueur(data, m.get('joueur1_eq1', ''))
        j2 = trouver_joueur(data, m.get('joueur2_eq1', ''))
        j3 = trouver_joueur(data, m.get('joueur1_eq2', ''))
        j4 = trouver_joueur(data, m.get('joueur2_eq2', ''))
        if not all([j1, j2, j3, j4]):
            erreurs_cnf3 += 1
            manquants = [(n,v) for n,v in [('j1_eq1',j1),('j2_eq1',j2),('j1_eq2',j3),('j2_eq2',j4)] if not v]
            print(f"  [SKIP] [{m.get('phase')}] {m.get('equipe1')} vs {m.get('equipe2')} | manquants: {[n for n,v in manquants]}")
            continue
        s1 = m.get('score1', 0) or 0
        s2 = m.get('score2', 0) or 0
        phase = m.get('phase', 'Poules')
        elo_eq1 = (j1['elo'] + j2['elo']) / 2
        elo_eq2 = (j3['elo'] + j4['elo']) / 2
        d_eq1 = delta_elo(elo_eq1, elo_eq2, s1, s2, phase, K_DOUBLE)
        d_eq2 = -d_eq1
        appliquer_stats(j1, s1, s2, 'CNF 3', j1['elo'] + d_eq1)
        appliquer_stats(j2, s1, s2, 'CNF 3', j2['elo'] + d_eq1)
        appliquer_stats(j3, s2, s1, 'CNF 3', j3['elo'] + d_eq2)
        appliquer_stats(j4, s2, s1, 'CNF 3', j4['elo'] + d_eq2)

    if erreurs_cnf3:
        print(f"  [WARN] {erreurs_cnf3} matchs CNF3 ignorés (joueur introuvable)")

    # ── 5. Ratios finaux ──────────────────────────────────────────────────────
    recalculer_ratios(data)

    # ── 6. Stats globales ─────────────────────────────────────────────────────
    total_sets = sum(
        (m.get('score1', 0) or 0) + (m.get('score2', 0) or 0)
        for m in data['matchs']
    ) + sum(
        ((m.get('score1', 0) or 0) + (m.get('score2', 0) or 0))
        for m in data['matchs_cnf3']
    )
    data['stats_globales'] = {
        'total_joueurs': len(data['joueurs']),
        'total_matchs': len(data['matchs']) + len(data['matchs_cnf3']),
        'total_sets': total_sets,
    }

    # ── 7. Sauvegarde ─────────────────────────────────────────────────────────
    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 65)
    print("RECALCUL TERMINÉ")
    print(f"  matchs_cnf3 propres : {len(matchs_cnf3_propres)}")
    print(f"  matchs simples rejoués : {len(matchs_simples)}")
    print(f"  joueurs recalculés : {len(data['joueurs'])}")
    print(f"  stats_globales : {data['stats_globales']}")
    print("=" * 65)

    # Top 10 ELO pour vérification
    top10 = sorted(data['joueurs'], key=lambda j: j['elo'], reverse=True)[:10]
    print("\nTop 10 ELO après recalcul :")
    for i, j in enumerate(top10, 1):
        print(f"  {i:2}. {j['nom']:<28} {j['elo']:.1f} ({j['matchs_joues']} matchs)")

if __name__ == '__main__':
    main()

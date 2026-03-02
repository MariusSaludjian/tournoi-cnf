#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script pour ajouter les matchs du tableau final CNF3 depuis le CSV
"""

import csv
import json
from datetime import datetime

# Constantes
DATA_FILE = 'data.json'
CSV_FILE = 'Tournoi_CNF_3_-_Tableau_final.csv'
OUTPUT_FILE = 'data.json'  

# Paramètres ELO (même que sync_cnf3_complet.py)
K_FACTOR_DOUBLE = 24
PHASE_MULTIPLIERS = {
    "Poules": 1.0, "32èmes": 1.5, "16èmes": 1.7, "8èmes": 1.9,
    "Quarts": 2.1, "Demis": 2.5, "Finale": 3.5
}

def nettoyer_nom(nom):
    """Nettoie un nom d'équipe (enlève retours à la ligne, espaces multiples)"""
    return nom.replace('\n', ' ').replace('  ', ' ').strip()

def calculer_nouveau_elo_complexe(elo_joueur, elo_adversaire, s_gagnes, s_perdus, phase):
    """Calcule le nouveau ELO (copié depuis sync_cnf3_complet.py)"""
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
    """Met à jour les stats d'un joueur"""
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
    """Trouve un joueur par son nom"""
    for j in data['joueurs']:
        if j['nom'] == nom:
            return j
    return None

def main():
    print("="*70)
    print("AJOUT DU TABLEAU FINAL CNF3")
    print("="*70)
    
    # 1. Charger data.json
    print("\n📂 Chargement de data.json...")
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"   ✅ {len(data['joueurs'])} joueurs")
    print(f"   ✅ {len(data.get('matchs_cnf3', []))} matchs CNF3 existants")
    print(f"   ✅ {len(data.get('equipes', []))} équipes")
    
    # 2. Créer un mapping équipe -> détails
    equipes_map = {}
    for eq in data.get('equipes', []):
        # Nettoyer le nom
        nom_clean = nettoyer_nom(eq['nom'])
        equipes_map[nom_clean.lower()] = eq
        # Garder aussi le nom original
        equipes_map[eq['nom'].lower()] = eq
    
    # 3. Lire le CSV du tableau final
    print("\n📄 Lecture du CSV du tableau final...")
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        rows = list(reader)
    
    # Mapping colonnes par phase
    phase_info = {
        '32èmes': (2, 4),
        '16èmes': (8, 10),
        '8èmes': (14, 16),
        'Quarts': (20, 22),
        'Demis': (26, 28),
        'Finale': (32, 34)
    }
    
    matchs_tableau = []
    matchs_joues = 0
    
    # 4. Extraire les matchs
    print("\n🔍 Extraction des matchs...")
    i = 3
    while i < len(rows) - 1:
        row1 = rows[i]
        row2 = rows[i + 1]
        
        for phase_name, (col_nom, col_score) in phase_info.items():
            if len(row1) <= col_score or len(row2) <= col_score:
                continue
            
            # Noms des équipes
            equipe1_nom = nettoyer_nom(row1[col_nom]) if col_nom < len(row1) else ""
            equipe2_nom = nettoyer_nom(row2[col_nom]) if col_nom < len(row2) else ""
            
            if not equipe1_nom or not equipe2_nom:
                continue
            
            # Chercher les équipes (case insensitive)
            equipe1_data = equipes_map.get(equipe1_nom.lower())
            equipe2_data = equipes_map.get(equipe2_nom.lower())
            
            if not equipe1_data or not equipe2_data:
                continue
            
            # Scores
            score1_str = row1[col_score].strip() if col_score < len(row1) else ""
            score2_str = row2[col_score].strip() if col_score < len(row2) else ""
            
            # Créer le match
            match = {
                "type": "tableau",
                "tournoi": "CNF 3",
                "phase": phase_name,
                "date": "2026-02-18",
                "equipe1": equipe1_data['nom'],  # Utiliser le nom original
                "equipe2": equipe2_data['nom'],
                "joueur1_eq1": equipe1_data.get('joueur1', ''),
                "joueur2_eq1": equipe1_data.get('joueur2', ''),
                "joueur1_eq2": equipe2_data.get('joueur1', ''),
                "joueur2_eq2": equipe2_data.get('joueur2', ''),
            }
            
            # Si match joué
            if score1_str.isdigit() and score2_str.isdigit():
                score1 = int(score1_str)
                score2 = int(score2_str)
                match["score1"] = score1
                match["score2"] = score2
                match["gagnant"] = match["equipe1"] if score1 > score2 else match["equipe2"]
                match["live"] = True
                matchs_joues += 1
            
            matchs_tableau.append(match)
        
        i += 4
    
    print(f"   ✅ {len(matchs_tableau)} matchs extraits")
    print(f"   ✅ {matchs_joues} matchs déjà joués")
    
    # 5. Ajouter les matchs à data.json
    print("\n💾 Ajout des matchs à data.json...")
    if 'matchs_cnf3' not in data:
        data['matchs_cnf3'] = []
    
    # Calculer le prochain ID
    next_id = max([m.get('id', 0) for m in data['matchs_cnf3']], default=0) + 1
    
    # Traiter chaque match
    for match in matchs_tableau:
        match['id'] = next_id
        next_id += 1
        
        # Si match joué, mettre à jour les ELO
        if match.get('live') and match.get('score1') is not None:
            # Trouver les 4 joueurs
            j1 = trouver_joueur(data, match['joueur1_eq1'])
            j2 = trouver_joueur(data, match['joueur2_eq1'])
            j3 = trouver_joueur(data, match['joueur1_eq2'])
            j4 = trouver_joueur(data, match['joueur2_eq2'])
            
            if j1 and j2 and j3 and j4:
                # ELO moyen des équipes
                elo_eq1 = (j1['elo'] + j2['elo']) / 2
                elo_eq2 = (j3['elo'] + j4['elo']) / 2
                
                # Calcul nouveau ELO
                _, delta_eq1 = calculer_nouveau_elo_complexe(
                    elo_eq1, elo_eq2, 
                    match['score1'], match['score2'], 
                    match['phase']
                )
                delta_eq2 = -delta_eq1
                
                # Mise à jour stats
                mettre_a_jour_joueur_stats(j1, match['score1'], match['score2'], "CNF 3", j1['elo'] + delta_eq1)
                mettre_a_jour_joueur_stats(j2, match['score1'], match['score2'], "CNF 3", j2['elo'] + delta_eq1)
                mettre_a_jour_joueur_stats(j3, match['score2'], match['score1'], "CNF 3", j3['elo'] + delta_eq2)
                mettre_a_jour_joueur_stats(j4, match['score2'], match['score1'], "CNF 3", j4['elo'] + delta_eq2)
                
                print(f"   ✅ {match['phase']}: {match['equipe1']} {match['score1']}-{match['score2']} {match['equipe2']} (ELO: {delta_eq1:+.1f})")
        
        data['matchs_cnf3'].append(match)
    
    # 6. Mettre à jour les stats globales
    data['derniere_maj'] = datetime.now().strftime("%Y-%m-%d")
    nb_matchs_total = len(data.get('matchs', [])) + len(data['matchs_cnf3'])
    total_sets = sum(m.get('score1', 0) + m.get('score2', 0) for m in data.get('matchs', []))
    total_sets += sum(m.get('score1', 0) + m.get('score2', 0) for m in data['matchs_cnf3'])
    
    data['stats_globales'] = {
        "total_joueurs": len(data['joueurs']),
        "total_matchs": nb_matchs_total,
        "total_sets": total_sets
    }
    
    # 7. Sauvegarder
    print(f"\n💾 Sauvegarde dans {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print("\n" + "="*70)
    print("✅ TERMINÉ !")
    print("="*70)
    print(f"\n📊 Résumé :")
    print(f"   • {len(matchs_tableau)} matchs de tableau final ajoutés")
    print(f"   • {matchs_joues} matchs joués avec mise à jour ELO")
    print(f"   • Total matchs CNF3 : {len(data['matchs_cnf3'])}")
    print(f"\n💡 Remplacez votre data.json par le fichier généré pour voir le tableau final !")

if __name__ == "__main__":
    main()

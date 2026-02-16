import json

# ============================================
# CONFIGURATION
# ============================================
K_FACTOR_DOUBLE = 24  # 32 * 0.75

def charger_donnees():
    with open('data.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def sauvegarder_donnees(data):
    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def trouver_joueur(data, nom):
    for j in data['joueurs']:
        if j['nom'] == nom:
            return j
    return None

def calculer_proba(elo_a, elo_b):
    return 1.0 / (1.0 + 10.0 ** ((elo_b - elo_a) / 400.0))

def main():
    data = charger_donnees()
    matchs = data.get('matchs_cnf3', [])
    
    if not matchs:
        print("Aucun match CNF 3 trouvé.")
        return

    print(f"🔄 Traitement de {len(matchs)} matchs existants...\n")
    
    # Pour afficher le bilan à la fin
    bilan_elo = {} # nom -> {avant, apres, diff}

    for m in matchs:
        # 1. Récupération des joueurs
        noms = [m['joueur1_eq1'], m['joueur2_eq1'], m['joueur1_eq2'], m['joueur2_eq2']]
        joueurs = [trouver_joueur(data, n) for n in noms]
        
        if any(j is None for j in joueurs):
            print(f"⚠️ Erreur : Joueur introuvable dans le match {m['id']}")
            continue

        j1, j2, j3, j4 = joueurs
        
        # Sauvegarder ELO initial pour le bilan
        for j in joueurs:
            if j['nom'] not in bilan_elo:
                bilan_elo[j['nom']] = {'avant': j['elo']}

        # 2. Calcul ELO (Equipe vs Equipe)
        elo_eq1 = (j1['elo'] + j2['elo']) / 2
        elo_eq2 = (j3['elo'] + j4['elo']) / 2
        
        victoire_eq1 = m['score1'] > m['score2']
        score_reel = 1.0 if victoire_eq1 else 0.0
        
        proba = calculer_proba(elo_eq1, elo_eq2)
        delta = K_FACTOR_DOUBLE * (score_reel - proba)
        
        # 3. Application ELO et Stats
        # Equipe 1
        for j in [j1, j2]:
            j['elo'] += delta
            j['elo'] = round(j['elo'], 1)
            j['elo_max'] = max(j.get('elo_max', 1500), j['elo'])
            j['elo_min'] = min(j.get('elo_min', 1500), j['elo'])
            
            j['matchs_joues'] += 1
            j['sets_gagnes'] += m['score1']
            j['sets_perdus'] += m['score2']
            if victoire_eq1: j['victoires'] += 1
            else: j['defaites'] += 1
            if "CNF 3" not in j['tournois']: j['tournois'].append("CNF 3")

        # Equipe 2
        for j in [j3, j4]:
            j['elo'] -= delta
            j['elo'] = round(j['elo'], 1)
            j['elo_max'] = max(j.get('elo_max', 1500), j['elo'])
            j['elo_min'] = min(j.get('elo_min', 1500), j['elo'])
            
            j['matchs_joues'] += 1
            j['sets_gagnes'] += m['score2']
            j['sets_perdus'] += m['score1']
            if not victoire_eq1: j['victoires'] += 1
            else: j['defaites'] += 1
            if "CNF 3" not in j['tournois']: j['tournois'].append("CNF 3")

    # 4. Recalcul des ratios finaux
    for j in data['joueurs']:
        if j['nom'] in bilan_elo:
             # Maj bilan
            bilan_elo[j['nom']]['apres'] = j['elo']
            bilan_elo[j['nom']]['diff'] = j['elo'] - bilan_elo[j['nom']]['avant']
            
            # Maj ratios stats
            if j['matchs_joues'] > 0:
                j['pourcentage_victoires'] = round((j['victoires'] / j['matchs_joues']) * 100, 1)
                denom = max(j['sets_perdus'], 1)
                j['ratio_sets'] = round(j['sets_gagnes'] / denom, 2)

    sauvegarder_donnees(data)

    # 5. Affichage du tableau demandé
    print("="*60)
    print(f"{'JOUEUR':<25} | {'ANCIEN':<8} | {'NOUVEAU':<8} | {'DIFF'}")
    print("="*60)
    
    # Trier par gain d'ELO
    sorted_bilan = sorted(bilan_elo.items(), key=lambda x: x[1]['diff'], reverse=True)
    
    for nom, stats in sorted_bilan:
        signe = "+" if stats['diff'] >= 0 else ""
        print(f"{nom:<25} | {stats['avant']:<8.1f} | {stats['apres']:<8.1f} | {signe}{stats['diff']:.1f}")
    
    print("="*60)
    print("✅ data.json a été mis à jour avec succès !")

if __name__ == "__main__":
    main()
# 🎯 SYSTÈME ELO POUR LES MATCHS EN DOUBLE

## 📊 Vue d'ensemble

Quand une équipe gagne un match CNF 3, les **2 joueurs** de l'équipe doivent voir leur ELO individuel augmenter.

---

## 🤔 CHOIX DE LA FORMULE

Plusieurs options possibles :

### Option 1 : Impact réduit (50%)
Les matchs en double comptent **moitié moins** que les matchs individuels.
```
Match individuel gagné : +16 ELO
Match en double gagné : +8 ELO par joueur
```

**Avantages :**
- Valorise plus les performances individuelles
- Évite que quelqu'un monte trop haut juste en jouant en équipe

**Inconvénients :**
- Peut décourager de jouer en double

### Option 2 : Impact égal (100%)
Les matchs en double comptent **autant** que les matchs individuels.
```
Match individuel gagné : +16 ELO
Match en double gagné : +16 ELO par joueur
```

**Avantages :**
- Simple et équitable
- Encourage à jouer en double

**Inconvénients :**
- Quelqu'un peut monter haut sans jamais jouer en solo

### Option 3 : Impact partagé (75%)
Les matchs en double comptent **3/4** des matchs individuels.
```
Match individuel gagné : +16 ELO
Match en double gagné : +12 ELO par joueur
```

**Avantages :**
- Compromis équilibré
- Les deux types de matchs ont de la valeur

**Recommandation :** ⭐ **Option 3 (75%)** - Meilleur compromis

---

## 💻 SCRIPT PYTHON MODIFIÉ

Voici le nouveau script `ajouter_match_cnf3.py` avec mise à jour ELO :

```python
#!/usr/bin/env python3
"""
Script pour ajouter des matchs CNF 3 avec mise à jour ELO
Usage: python ajouter_match_cnf3.py
"""

import json
from datetime import datetime

# ============================================
# CONFIGURATION ELO
# ============================================

# Facteur d'impact des matchs en double (0.5 à 1.0)
# 0.5 = 50% de l'impact, 0.75 = 75%, 1.0 = 100%
FACTEUR_DOUBLE = 0.75

# Points ELO de base pour une victoire/défaite
ELO_BASE = 16

def charger_donnees():
    """Charge les données depuis data.json"""
    try:
        with open('data.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print("❌ Fichier data.json non trouvé !")
        return None

def sauvegarder_donnees(data):
    """Sauvegarde les données dans data.json"""
    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def trouver_joueur(data, nom):
    """Trouve un joueur par son nom"""
    for joueur in data['joueurs']:
        if joueur['nom'] == nom:
            return joueur
    return None

def mettre_a_jour_elo(data, joueur_nom, victoire):
    """
    Met à jour l'ELO d'un joueur après un match en double
    
    Args:
        data: Les données complètes
        joueur_nom: Nom du joueur
        victoire: True si victoire, False si défaite
    """
    joueur = trouver_joueur(data, joueur_nom)
    if not joueur:
        print(f"⚠️  Joueur {joueur_nom} non trouvé pour mise à jour ELO")
        return
    
    # Calculer le changement ELO
    changement_base = ELO_BASE if victoire else -ELO_BASE
    changement = changement_base * FACTEUR_DOUBLE
    
    # Mettre à jour l'ELO
    ancien_elo = joueur['elo']
    nouveau_elo = ancien_elo + changement
    joueur['elo'] = round(nouveau_elo, 1)
    
    # Mettre à jour min/max
    if nouveau_elo > joueur.get('elo_max', 1500):
        joueur['elo_max'] = round(nouveau_elo, 1)
    if nouveau_elo < joueur.get('elo_min', 1500):
        joueur['elo_min'] = round(nouveau_elo, 1)
    
    # Afficher le changement
    signe = "+" if changement > 0 else ""
    print(f"   🎯 {joueur_nom}: {ancien_elo:.1f} → {nouveau_elo:.1f} ({signe}{changement:.1f})")
    
    return changement

def afficher_equipes(data):
    """Affiche la liste des équipes CNF 3"""
    equipes = sorted([e['nom'] for e in data['equipes']])
    print("\n📋 Liste des équipes CNF 3 :")
    for i, nom in enumerate(equipes, 1):
        equipe_data = next(e for e in data['equipes'] if e['nom'] == nom)
        print(f"  {i:2}. {nom:30} ({equipe_data['joueur1']} / {equipe_data['joueur2']})")
    return equipes

def afficher_poules(data):
    """Affiche la liste des poules"""
    if 'poules_cnf3' not in data or not data['poules_cnf3']:
        print("❌ Aucune poule CNF 3 trouvée !")
        return []
    
    print("\n🎯 Poules CNF 3 :")
    poules = []
    for i, poule in enumerate(data['poules_cnf3'], 1):
        print(f"  {i}. Poule {poule.get('numero', i)}")
        poules.append(poule)
    return poules

def ajouter_match_poule(data):
    """Ajouter un match de poule avec mise à jour ELO"""
    print("\n" + "="*80)
    print("🎯 AJOUTER UN MATCH DE POULE CNF 3")
    print("="*80)
    
    # Afficher les poules
    poules = afficher_poules(data)
    if not poules:
        return
    
    # Sélectionner la poule
    choix_poule = input("\n📌 Numéro de la poule : ").strip()
    try:
        poule_index = int(choix_poule) - 1
        if not 0 <= poule_index < len(poules):
            print("❌ Numéro de poule invalide !")
            return
    except ValueError:
        print("❌ Numéro invalide !")
        return
    
    poule = poules[poule_index]
    
    # Afficher les équipes de la poule
    print(f"\n📋 Équipes de la Poule {poule.get('numero', poule_index + 1)} :")
    for i, equipe in enumerate(poule['equipes'], 1):
        print(f"  {i}. {equipe['nom']:30} ({equipe['joueur1']} / {equipe['joueur2']})")
    
    # Sélectionner équipe 1
    choix1 = input("\n🎯 Équipe 1 (numéro) : ").strip()
    try:
        eq1_index = int(choix1) - 1
        if not 0 <= eq1_index < len(poule['equipes']):
            print("❌ Numéro invalide !")
            return
    except ValueError:
        print("❌ Numéro invalide !")
        return
    
    # Sélectionner équipe 2
    choix2 = input("🎯 Équipe 2 (numéro) : ").strip()
    try:
        eq2_index = int(choix2) - 1
        if not 0 <= eq2_index < len(poule['equipes']):
            print("❌ Numéro invalide !")
            return
    except ValueError:
        print("❌ Numéro invalide !")
        return
    
    if eq1_index == eq2_index:
        print("❌ Les deux équipes doivent être différentes !")
        return
    
    equipe1 = poule['equipes'][eq1_index]
    equipe2 = poule['equipes'][eq2_index]
    
    # Saisir le score
    print(f"\n📊 Score du match {equipe1['nom']} vs {equipe2['nom']} :")
    try:
        score1 = int(input(f"  Sets gagnés par {equipe1['nom']} : "))
        score2 = int(input(f"  Sets gagnés par {equipe2['nom']} : "))
    except ValueError:
        print("❌ Score invalide !")
        return
    
    if score1 == score2:
        print("⚠️  Match nul détecté - on continue quand même")
    
    # Date
    date = input(f"\n📆 Date (YYYY-MM-DD) ou Enter pour aujourd'hui : ").strip()
    if not date:
        date = datetime.now().strftime('%Y-%m-%d')
    
    # Créer le match
    gagnant = equipe1['nom'] if score1 > score2 else equipe2['nom']
    
    # Initialiser matchs_cnf3 si nécessaire
    if 'matchs_cnf3' not in data:
        data['matchs_cnf3'] = []
    
    nouveau_match = {
        "id": len(data['matchs_cnf3']) + 1,
        "type": "poule",
        "tournoi": "CNF 3",
        "phase": "Poules",
        "poule": poule.get('numero', poule_index + 1),
        "date": date,
        "equipe1": equipe1['nom'],
        "equipe2": equipe2['nom'],
        "joueur1_eq1": equipe1['joueur1'],
        "joueur2_eq1": equipe1['joueur2'],
        "joueur1_eq2": equipe2['joueur1'],
        "joueur2_eq2": equipe2['joueur2'],
        "score1": score1,
        "score2": score2,
        "gagnant": gagnant
    }
    
    # Afficher le récapitulatif
    print("\n" + "="*80)
    print("📋 RÉCAPITULATIF")
    print("="*80)
    print(f"🎯 Match de Poule #{nouveau_match['id']}")
    print(f"📌 Poule {poule.get('numero', poule_index + 1)}")
    print(f"📅 {date}")
    print(f"🏆 {equipe1['nom']} ({equipe1['joueur1']} / {equipe1['joueur2']})")
    print(f"   vs")
    print(f"🏆 {equipe2['nom']} ({equipe2['joueur1']} / {equipe2['joueur2']})")
    print(f"📊 Score : {score1} - {score2}")
    print(f"🏅 Gagnant : {gagnant}")
    print("="*80)
    
    confirmer = input("\n✅ Confirmer l'ajout ? (o/n) : ")
    
    if confirmer.lower() != 'o':
        print("❌ Match annulé")
        return
    
    # ============================================
    # MISE À JOUR ELO DES 4 JOUEURS
    # ============================================
    
    print("\n🎯 Mise à jour ELO des joueurs :")
    
    # Équipe gagnante
    if score1 > score2:
        mettre_a_jour_elo(data, equipe1['joueur1'], True)
        mettre_a_jour_elo(data, equipe1['joueur2'], True)
        mettre_a_jour_elo(data, equipe2['joueur1'], False)
        mettre_a_jour_elo(data, equipe2['joueur2'], False)
    else:
        mettre_a_jour_elo(data, equipe2['joueur1'], True)
        mettre_a_jour_elo(data, equipe2['joueur2'], True)
        mettre_a_jour_elo(data, equipe1['joueur1'], False)
        mettre_a_jour_elo(data, equipe1['joueur2'], False)
    
    # Ajouter le match
    data['matchs_cnf3'].append(nouveau_match)
    
    # Mettre à jour les stats de la poule
    if 'matchs_joues' not in equipe1:
        equipe1['matchs_joues'] = 0
        equipe1['victoires'] = 0
        equipe1['defaites'] = 0
        equipe1['sets_pour'] = 0
        equipe1['sets_contre'] = 0
        equipe1['points'] = 0
    
    if 'matchs_joues' not in equipe2:
        equipe2['matchs_joues'] = 0
        equipe2['victoires'] = 0
        equipe2['defaites'] = 0
        equipe2['sets_pour'] = 0
        equipe2['sets_contre'] = 0
        equipe2['points'] = 0
    
    equipe1['matchs_joues'] += 1
    equipe2['matchs_joues'] += 1
    
    equipe1['sets_pour'] += score1
    equipe1['sets_contre'] += score2
    equipe2['sets_pour'] += score2
    equipe2['sets_contre'] += score1
    
    if score1 > score2:
        equipe1['victoires'] += 1
        equipe1['points'] += 2
        equipe2['defaites'] += 1
    else:
        equipe2['victoires'] += 1
        equipe2['points'] += 2
        equipe1['defaites'] += 1
    
    # Trier la poule
    poule['equipes'].sort(key=lambda e: (
        -(e.get('points', 0)),
        -((e.get('sets_pour', 0)) - (e.get('sets_contre', 0)))
    ))
    
    # Sauvegarder
    sauvegarder_donnees(data)
    
    print("\n✅ Match de poule ajouté avec succès !")
    print(f"\n📊 Classement Poule {poule.get('numero', poule_index + 1)} :")
    for i, eq in enumerate(poule['equipes'], 1):
        pts = eq.get('points', 0)
        v = eq.get('victoires', 0)
        d = eq.get('defaites', 0)
        diff = eq.get('sets_pour', 0) - eq.get('sets_contre', 0)
        print(f"  {i}. {eq['nom']:30} - {pts} pts ({v}V-{d}D, diff: {diff:+d})")

def ajouter_match_tableau(data):
    """Ajouter un match du tableau final avec mise à jour ELO"""
    print("\n" + "="*80)
    print("🏆 AJOUTER UN MATCH DU TABLEAU FINAL CNF 3")
    print("="*80)
    
    # Sélectionner la phase
    print("\n📌 Phase :")
    print("  1. 32èmes de finale")
    print("  2. 16èmes de finale")
    print("  3. 8èmes de finale")
    print("  4. Quarts de finale")
    print("  5. Demi-finales")
    print("  6. Finale")
    
    choix_phase = input("\nChoix (1-6) : ").strip()
    
    phases = {
        '1': '32èmes',
        '2': '16èmes',
        '3': '8èmes',
        '4': 'Quarts',
        '5': 'Demis',
        '6': 'Finale'
    }
    
    if choix_phase not in phases:
        print("❌ Choix invalide !")
        return
    
    phase = phases[choix_phase]
    
    # Afficher les équipes
    afficher_equipes(data)
    
    # Saisir équipe 1
    equipe1_nom = input("\n🎯 Équipe 1 (nom complet) : ").strip()
    equipe1 = next((e for e in data['equipes'] if e['nom'] == equipe1_nom), None)
    
    if not equipe1:
        print(f"❌ Équipe '{equipe1_nom}' non trouvée !")
        return
    
    # Saisir équipe 2
    equipe2_nom = input("🎯 Équipe 2 (nom complet) : ").strip()
    equipe2 = next((e for e in data['equipes'] if e['nom'] == equipe2_nom), None)
    
    if not equipe2:
        print(f"❌ Équipe '{equipe2_nom}' non trouvée !")
        return
    
    if equipe1_nom == equipe2_nom:
        print("❌ Les deux équipes doivent être différentes !")
        return
    
    # Saisir le score
    print(f"\n📊 Score du match {equipe1_nom} vs {equipe2_nom} :")
    try:
        score1 = int(input(f"  Sets gagnés par {equipe1_nom} : "))
        score2 = int(input(f"  Sets gagnés par {equipe2_nom} : "))
    except ValueError:
        print("❌ Score invalide !")
        return
    
    # Date
    date = input(f"\n📆 Date (YYYY-MM-DD) ou Enter pour aujourd'hui : ").strip()
    if not date:
        date = datetime.now().strftime('%Y-%m-%d')
    
    # Créer le match
    gagnant = equipe1_nom if score1 > score2 else equipe2_nom
    
    # Initialiser matchs_cnf3 si nécessaire
    if 'matchs_cnf3' not in data:
        data['matchs_cnf3'] = []
    
    nouveau_match = {
        "id": len(data['matchs_cnf3']) + 1,
        "type": "tableau",
        "tournoi": "CNF 3",
        "phase": phase,
        "date": date,
        "equipe1": equipe1_nom,
        "equipe2": equipe2_nom,
        "joueur1_eq1": equipe1['joueur1'],
        "joueur2_eq1": equipe1['joueur2'],
        "joueur1_eq2": equipe2['joueur1'],
        "joueur2_eq2": equipe2['joueur2'],
        "score1": score1,
        "score2": score2,
        "gagnant": gagnant
    }
    
    # Afficher le récapitulatif
    print("\n" + "="*80)
    print("📋 RÉCAPITULATIF")
    print("="*80)
    print(f"🏆 Match de {phase} #{nouveau_match['id']}")
    print(f"📅 {date}")
    print(f"🎯 {equipe1_nom} ({equipe1['joueur1']} / {equipe1['joueur2']})")
    print(f"   vs")
    print(f"🎯 {equipe2_nom} ({equipe2['joueur1']} / {equipe2['joueur2']})")
    print(f"📊 Score : {score1} - {score2}")
    print(f"🏅 Gagnant : {gagnant}")
    print("="*80)
    
    confirmer = input("\n✅ Confirmer l'ajout ? (o/n) : ")
    
    if confirmer.lower() != 'o':
        print("❌ Match annulé")
        return
    
    # ============================================
    # MISE À JOUR ELO DES 4 JOUEURS
    # ============================================
    
    print("\n🎯 Mise à jour ELO des joueurs :")
    
    # Équipe gagnante
    if score1 > score2:
        mettre_a_jour_elo(data, equipe1['joueur1'], True)
        mettre_a_jour_elo(data, equipe1['joueur2'], True)
        mettre_a_jour_elo(data, equipe2['joueur1'], False)
        mettre_a_jour_elo(data, equipe2['joueur2'], False)
    else:
        mettre_a_jour_elo(data, equipe2['joueur1'], True)
        mettre_a_jour_elo(data, equipe2['joueur2'], True)
        mettre_a_jour_elo(data, equipe1['joueur1'], False)
        mettre_a_jour_elo(data, equipe1['joueur2'], False)
    
    # Ajouter le match
    data['matchs_cnf3'].append(nouveau_match)
    
    # Sauvegarder
    sauvegarder_donnees(data)
    
    print(f"\n✅ Match de {phase} ajouté avec succès !")

def menu_principal():
    """Menu principal"""
    data = charger_donnees()
    if not data:
        return
    
    print("\n" + "="*80)
    print(f"⚙️  Configuration : Impact ELO des doubles = {FACTEUR_DOUBLE*100:.0f}%")
    print(f"   (Victoire en double = +{ELO_BASE * FACTEUR_DOUBLE:.1f} ELO, Défaite = -{ELO_BASE * FACTEUR_DOUBLE:.1f} ELO)")
    print("="*80)
    
    while True:
        print("\n" + "="*80)
        print("🎯 GESTION DES MATCHS CNF 3 (DOUBLES) - AVEC MISE À JOUR ELO")
        print("="*80)
        
        nb_matchs = len(data.get('matchs_cnf3', []))
        nb_equipes = len(data.get('equipes', []))
        nb_poules = len(data.get('poules_cnf3', []))
        
        print(f"📊 Total : {nb_equipes} équipes, {nb_poules} poules, {nb_matchs} matchs")
        print("\n1. ➕ Ajouter un match de POULE")
        print("2. 🏆 Ajouter un match du TABLEAU FINAL")
        print("3. 📋 Voir les équipes")
        print("4. 🎯 Voir les poules")
        print("5. 🚪 Quitter")
        
        choix = input("\n👉 Votre choix : ").strip()
        
        if choix == '1':
            ajouter_match_poule(data)
        elif choix == '2':
            ajouter_match_tableau(data)
        elif choix == '3':
            afficher_equipes(data)
            input("\nAppuyez sur Enter pour continuer...")
        elif choix == '4':
            afficher_poules(data)
            input("\nAppuyez sur Enter pour continuer...")
        elif choix == '5':
            print("\n👋 À bientôt !")
            break
        else:
            print("❌ Choix invalide !")

if __name__ == '__main__':
    try:
        menu_principal()
    except KeyboardInterrupt:
        print("\n\n👋 Programme interrompu. À bientôt !")
    except Exception as e:
        print(f"\n❌ Erreur : {e}")
        import traceback
        traceback.print_exc()
```

---

## 🎮 EXEMPLE D'UTILISATION

```
🎯 AJOUTER UN MATCH DE POULE CNF 3
════════════════════════════════════════════

Équipe 1 : Pastis et Cassoulet (Pilou / Axel)
Équipe 2 : Les endartcampés (Yaël / Arthur)
Score : 2 - 1

✅ Confirmer l'ajout ? (o/n) : o

🎯 Mise à jour ELO des joueurs :
   🎯 Pilou Petit: 1520.0 → 1532.0 (+12.0)
   🎯 Axel Garcin: 1485.0 → 1497.0 (+12.0)
   🎯 Yaël Vincent: 1510.0 → 1498.0 (-12.0)
   🎯 Arthur Buffavand: 1495.0 → 1483.0 (-12.0)

✅ Match de poule ajouté avec succès !
```

---

## 📊 CALCUL DÉTAILLÉ

### Avec FACTEUR_DOUBLE = 0.75 (recommandé)

**Match en double gagné :**
```
Changement ELO = 16 × 0.75 = +12 points
```

**Match en double perdu :**
```
Changement ELO = -16 × 0.75 = -12 points
```

### Comparaison avec matchs individuels

| Type de match | Victoire | Défaite |
|---------------|----------|---------|
| **Individuel** | +16 ELO | -16 ELO |
| **Double (75%)** | +12 ELO | -12 ELO |
| **Double (50%)** | +8 ELO | -8 ELO |
| **Double (100%)** | +16 ELO | -16 ELO |

---

## ⚙️ CONFIGURATION

Pour changer le facteur d'impact, modifiez cette ligne dans le script :

```python
# Ligne 12-13
FACTEUR_DOUBLE = 0.75  # Changez cette valeur

# Exemples :
FACTEUR_DOUBLE = 0.5   # Impact 50%
FACTEUR_DOUBLE = 0.75  # Impact 75% (recommandé)
FACTEUR_DOUBLE = 1.0   # Impact 100%
```

---

## 🎯 FONCTIONNALITÉS

✅ **Mise à jour automatique** - Les 4 joueurs (2 par équipe) voient leur ELO modifié
✅ **ELO min/max** - Les records ELO sont mis à jour automatiquement
✅ **Affichage clair** - Montre le changement pour chaque joueur
✅ **Facteur configurable** - Facile de changer l'impact (50%, 75%, 100%)
✅ **Sauvegarde** - Tout est enregistré dans data.json

---

## 📈 IMPACT SUR LE CLASSEMENT

### Exemple : 10 matchs en double

**Avec facteur 75% :**
```
Joueur qui gagne 10 matchs en double :
10 × (+12) = +120 ELO

Équivalent à :
7.5 matchs individuels gagnés
```

**Avec facteur 50% :**
```
Joueur qui gagne 10 matchs en double :
10 × (+8) = +80 ELO

Équivalent à :
5 matchs individuels gagnés
```

---

## 🔍 VÉRIFICATION

Pour vérifier que ça fonctionne :

1. **Avant d'ajouter un match**, notez l'ELO des 4 joueurs
2. **Ajoutez un match** avec le script
3. **Vérifiez** que les ELO ont changé :
   - Gagnants : +12 ELO (avec facteur 75%)
   - Perdants : -12 ELO
4. **Ouvrez data.json** et cherchez les joueurs pour confirmer

---

## 🎨 AFFICHAGE SUR LE SITE

Le graphique ELO d'un joueur montrera maintenant :
- Les matchs individuels (gros points)
- Les matchs en double (petits points)

**Pour différencier visuellement :**

Dans `afficherGraphiqueELO()`, vous pouvez ajouter :

```javascript
// Différencier les points selon le type de match
matchsJoueur.forEach((match, index) => {
    const x = ...;
    const y = ...;
    
    // Vérifier si c'est un match en double
    const isDouble = window.data.matchs_cnf3.some(m => 
        (m.joueur1_eq1 === nomJoueur || m.joueur2_eq1 === nomJoueur ||
         m.joueur1_eq2 === nomJoueur || m.joueur2_eq2 === nomJoueur) &&
        m.date === match.date
    );
    
    const radius = isDouble ? 3 : 5;  // Plus petit pour doubles
    const color = isDouble ? '#FFD700' : '#DC143C';  // Doré pour doubles
});
```

---

## 💡 AMÉLIORATIONS FUTURES

### 1. ELO ajusté selon la force de l'adversaire
```python
def calculer_elo_ajuste(elo_joueur, elo_adversaire, victoire):
    """
    Calcul ELO ajusté selon la différence de niveau
    """
    diff = elo_adversaire - elo_joueur
    esperance = 1 / (1 + 10 ** (diff / 400))
    changement = 16 * (1 - esperance) if victoire else 16 * (0 - esperance)
    return changement * FACTEUR_DOUBLE
```

### 2. Bonus pour phases finales
```python
# Ligne 14
BONUS_FINALE = 1.5  # 50% de bonus pour finale

# Dans la fonction mettre_a_jour_elo :
if phase == 'Finale':
    changement *= BONUS_FINALE
```

### 3. Historique ELO détaillé
```python
# Ajouter dans data.json
"elo_history": [
    {
        "date": "2025-02-10",
        "match_id": 15,
        "type": "double",
        "elo_avant": 1520,
        "elo_apres": 1532,
        "changement": +12,
        "adversaire": "Équipe adverse"
    }
]
```

---

## ❓ FAQ

### Q : Les matchs en double comptent-ils dans les stats victoires/défaites ?
**R :** Non, seulement l'ELO est affecté. Les stats V/D restent pour les matchs individuels.

### Q : Peut-on avoir un facteur différent selon la phase ?
**R :** Oui ! Ajoutez un paramètre `phase` dans `mettre_a_jour_elo()` :
```python
if phase == 'Finale':
    changement *= 1.5  # 50% de bonus
```

### Q : Comment annuler un match si erreur ?
**R :** Supprimez le match dans `data.json` et ajustez manuellement les ELO.

### Q : L'ELO est arrondi comment ?
**R :** À 1 décimale (ex: 1532.5)

---

## 📋 CHECKLIST

- [ ] Copié le nouveau script `ajouter_match_cnf3.py`
- [ ] Choisi le facteur d'impact (0.5, 0.75 ou 1.0)
- [ ] Testé avec un match de test
- [ ] Vérifié que les 4 joueurs ont leur ELO modifié
- [ ] Vérifié que elo_min et elo_max sont mis à jour
- [ ] Testé avec un match de poule
- [ ] Testé avec un match de tableau final

---

✅ **Voilà ! Maintenant les matchs en double influencent l'ELO individuel !** 🎯

**Recommandation : Utilisez FACTEUR_DOUBLE = 0.75 (impact 75%) pour un bon équilibre !** ⭐

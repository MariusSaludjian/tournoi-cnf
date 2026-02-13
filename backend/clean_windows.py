# -*- coding: utf-8 -*-
"""
Script de nettoyage final pour compatibilite Windows
Remplace tous les caracteres Unicode par ASCII
"""

import os
import sys

def clean_file(filepath):
    """Nettoie un fichier de tous les caracteres Unicode problematiques"""
    
    # Table de remplacement complete
    replacements = {
        # Emojis
        '🎯': '[CNF3]',
        '✅': '[OK]',
        '❌': '[ERREUR]',
        '⚠️': '[ATTENTION]',
        '📊': '[INFO]',
        '📄': '[FEUILLE]',
        '✨': '[NOUVEAU]',
        '🔍': '[RECHERCHE]',
        '🎉': '[SUCCESS]',
        '💡': '[INFO]',
        '🐛': '[DEBUG]',
        '🔧': '[CONFIG]',
        '🚀': '[GO]',
        '📝': '[NOTE]',
        '⏱️': '[TIMEOUT]',
        '🔐': '[AUTH]',
        '🔄': '[SYNC]',
        '🧪': '[TEST]',
        '👋': '[BYE]',
        '📦': '[PACKAGE]',
        
        # Symboles Unicode
        '✓': '[OK]',
        '✔': '[OK]',
        '►': '->',
        '◄': '<-',
        '▼': 'v',
        '▲': '^',
        '→': '->',
        '←': '<-',
        '↑': '^',
        '↓': 'v',
        '•': '*',
        '◆': '*',
        '■': '*',
        '□': '*',
        
        # Caracteres accentues francais
        'À': 'A', 'à': 'a',
        'Â': 'A', 'â': 'a',
        'Ä': 'A', 'ä': 'a',
        'É': 'E', 'é': 'e',
        'È': 'E', 'è': 'e',
        'Ê': 'E', 'ê': 'e',
        'Ë': 'E', 'ë': 'e',
        'Î': 'I', 'î': 'i',
        'Ï': 'I', 'ï': 'i',
        'Ô': 'O', 'ô': 'o',
        'Ö': 'O', 'ö': 'o',
        'Ù': 'U', 'ù': 'u',
        'Û': 'U', 'û': 'u',
        'Ü': 'U', 'ü': 'u',
        'Ç': 'C', 'ç': 'c',
        'Œ': 'OE', 'œ': 'oe',
        'Æ': 'AE', 'æ': 'ae',
    }
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        for char, replacement in replacements.items():
            content = content.replace(char, replacement)
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
        
    except Exception as e:
        print(f"[ERREUR] {filepath}: {e}")
        return False


def main():
    print("="*60)
    print("  NETTOYAGE WINDOWS - COMPATIBILITE ASCII")
    print("="*60)
    
    # Scripts Python a nettoyer
    scripts = [
        'sync_cnf3_complet.py',
        'sync_cnf3_structure.py',
        'sync_multi_sheets.py',
        'sync_google_sheets.py',
        'watch_sync.py',
        'check_setup.py',
        'test_connexion.py'
    ]
    
    cleaned = 0
    
    print("\nNettoyage des scripts Python...")
    print("-"*60)
    
    for script in scripts:
        if not os.path.exists(script):
            print(f"[SKIP] {script} - Non trouve")
            continue
        
        if clean_file(script):
            print(f"[OK] {script} - Nettoye")
            cleaned += 1
        else:
            print(f"[OK] {script} - Deja propre")
    
    print("\n" + "="*60)
    print(f"[SUCCESS] {cleaned} fichier(s) nettoye(s)")
    print("="*60)
    print("\nTous les scripts sont maintenant compatibles Windows!")
    print("\nVous pouvez relancer:")
    print("  python check_setup.py")
    print("  python sync_cnf3_complet.py")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n[ERREUR] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

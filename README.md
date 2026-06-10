# Équilibre 🌿

Application web pour accompagner la perte de poids autrement : en réapprenant à
écouter son corps et en reprogrammant son rapport à l'alimentation.

Deux volets :

1. **Ressentis de faim** (`alimentaire.html`) — un journal où l'on note, sur une
   silhouette interactive, *où* dans le corps on ressent la faim et *quel* est ce
   ressenti, pour distinguer faim physique et faim émotionnelle.
2. **Reprogrammation** (`reprogrammation.html`) — un programme de **21 jours**
   (3 semaines) de textes à **lire ou écouter**, adaptés au **profil Process
   Communication** de l'utilisateur.

Une page de **suivi** (`suivi.html`) synthétise les statistiques et la progression.

## Technique

- Site 100 % statique (HTML/CSS/JS, sans dépendance ni backend).
- Données stockées **localement** dans le navigateur (`localStorage`) — rien n'est
  envoyé sur un serveur.
- Lecture audio via la synthèse vocale du navigateur (Web Speech API).

## Déploiement

Éditer les fichiers dans `site/`, pousser sur `main`, GitHub Actions déploie sur Pages.

One-time per fork/clone : **Settings → Pages → Source: GitHub Actions**.

> Outil de bien-être : ne remplace pas un avis médical.

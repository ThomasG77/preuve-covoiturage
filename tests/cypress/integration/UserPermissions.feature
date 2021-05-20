# language: fr
Fonctionnalité: Valider les permissions sur /users

  En tant qu'utilisateur avec différents rôles, je test l'accès à l'administration utilisateurs
  Scénario: Super Admin peut administrer les utilisateurs

    Étant donné que je suis connecté.e comme administrateur du registre
    Alors je vois le menu administration
    Lorsque je clique sur le menu administration
    Alors je vois le menu utilisateurs
    Lorsque je clique sur le menu utilisateurs
    Alors je vois la section "Utilisateurs"
    Lorsque je clique sur le menu création d'un nouvel utilisateur
    Alors je vois la section "Ajouter un utilisateur"
    Et je reviens en arrière
    Lorsque je clique sur le bouton modifier du premier utilisateur
    Alors je vois la section "Modifier un utilisateur"
    Et je me déconnecte

  Scénario: Territory Admin peut administrer les utilisateurs

    Étant donné que je suis connecté.e comme administrateur d'un territoire
    Alors je vois le menu administration
    Lorsque je clique sur le menu administration
    Alors je vois le menu utilisateurs
    Lorsque je clique sur le menu utilisateurs
    Alors je vois la section "Utilisateurs"
    Lorsque je clique sur le menu création d'un nouvel utilisateur
    Alors je vois la section "Ajouter un utilisateur"
    Et je reviens en arrière
    Lorsque je clique sur le bouton modifier du premier utilisateur
    Alors je vois la section "Modifier un utilisateur"
    Et je me déconnecte

  Scénario: Compte découverte ne peut pas voir les utilisateurs

    Étant donné que je suis connecté.e comme compte découverte
    Alors je vois le menu administration
    Lorsque je clique sur le menu administration
    Alors je vois que la navigation de l'administration n'inclut pas "Utilisateurs & accès"
    Lorsque je suis sur la page "/admin/users"
    Alors je vois l'URL "/campaign"
    Lorsque je suis sur la page "/admin/users/create"
    Alors je vois l'URL "/campaign"
    Lorsque je suis sur la page "/admin/users/1"
    Alors je vois l'URL "/campaign"
    Et je me déconnecte

  Scénario: Operator Admin peut administrer les utilisateurs

    Étant donné que je suis connecté.e comme administrateur d'un opérateur
    Alors je vois le menu administration
    Lorsque je clique sur le menu administration
    Alors je vois le menu utilisateurs
    Lorsque je clique sur le menu utilisateurs
    Alors je vois la section "Utilisateurs"
    Lorsque je clique sur le menu création d'un nouvel utilisateur
    Alors je vois la section "Ajouter un utilisateur"
    Et je reviens en arrière
    Lorsque je clique sur le bouton modifier du premier utilisateur
    Alors je vois la section "Modifier un utilisateur"
    Et je me déconnecte

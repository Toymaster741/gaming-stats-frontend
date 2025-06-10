document.addEventListener('DOMContentLoaded', () => {
    // --- Éléments du DOM ---
    // Sections
    const searchUsersSection = document.getElementById('search-users');
    const loginSection = document.getElementById('login-section');
    const myStatsSection = document.getElementById('my-stats-section');

    // Navigation
    const loginLink = document.getElementById('loginLink');
    const myStatsLink = document.getElementById('myStatsLink');
    const logoutLink = document.getElementById('logoutLink');
    const logoutBtn = document.getElementById('logoutBtn');

    // Formulaire de connexion
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginMessage = document.getElementById('loginMessage');
    const registerLink = document.getElementById('registerLink');

    // Recherche d'utilisateurs
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const searchResultsDiv = document.getElementById('searchResults');

    // Section de gestion des statistiques
    const statsForm = document.getElementById('statsForm');
    const gameNameInput = document.getElementById('gameName');
    const statTypeInput = document.getElementById('statType');
    const statValueInput = document.getElementById('statValue');
    const statsListDiv = document.getElementById('statsList');
    const messageElement = document.getElementById('message');
    const clearStatsBtn = document.getElementById('clearStatsBtn');

    // --- Configuration du Backend ---
    const BACKEND_URL = 'postgresql://gaming_stats_db_user:GHq2etUp9oA6VaiZv0EsPBoGpYzwyxCs@dpg-d143c9e3jp1c73djuteg-a.frankfurt-postgres.render.com/gaming_stats_db'; // Assure-toi que c'est le bon port de ton serveur Node.js

    // --- Variables de session ---
    let currentUserId = null; // Stocke l'ID de l'utilisateur connecté depuis le backend
    let currentUsername = null; // Stocke le pseudo de l'utilisateur connecté

    // --- Fonctions utilitaires ---

    // Affiche un message temporaire à l'utilisateur
    const showMessage = (element, msg, type) => {
        element.textContent = msg;
        element.className = type;
        element.classList.remove('hidden');
        setTimeout(() => {
            element.classList.add('hidden');
        }, 3000);
    };

    // --- Gestion de l'authentification avec le Backend ---

    // Met à jour l'interface utilisateur en fonction de l'état de connexion
    const updateUIForAuth = () => {
        // Tente de récupérer l'état de connexion depuis localStorage
        const storedUserId = localStorage.getItem('currentUserId');
        const storedUsername = localStorage.getItem('currentUser');

        if (storedUserId && storedUsername) {
            currentUserId = storedUserId;
            currentUsername = storedUsername;

            loginLink.classList.add('hidden');
            myStatsLink.classList.remove('hidden');
            logoutLink.classList.remove('hidden');
            loginSection.classList.add('hidden');
            myStatsSection.classList.remove('hidden');
            
            displayStats(currentUserId); // Affiche les stats de l'utilisateur connecté
            showMessage(loginMessage, `Bienvenue, ${currentUsername} !`, 'success');
        } else {
            currentUserId = null;
            currentUsername = null;

            loginLink.classList.remove('hidden');
            myStatsLink.classList.add('hidden');
            logoutLink.classList.add('hidden');
            loginSection.classList.remove('hidden');
            myStatsSection.classList.add('hidden');
        }
    };

    // Gère la soumission du formulaire de connexion
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        try {
            const response = await fetch(`${BACKEND_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Stocke l'ID et le pseudo de l'utilisateur dans localStorage après une connexion réussie
                localStorage.setItem('currentUserId', data.userId);
                localStorage.setItem('currentUser', data.username);
                updateUIForAuth(); // Met à jour l'interface
                showMessage(loginMessage, data.message, 'success');
                loginForm.reset();
            } else {
                showMessage(loginMessage, data.message || 'Erreur de connexion.', 'error');
            }
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            showMessage(loginMessage, 'Erreur de connexion au serveur.', 'error');
        }
    });

    // Gère la déconnexion
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Retire les informations de l'utilisateur de localStorage
        localStorage.removeItem('currentUserId');
        localStorage.removeItem('currentUser');
        updateUIForAuth(); // Met à jour l'interface
        showMessage(loginMessage, 'Vous avez été déconnecté.', 'success');
    });

    // Gère l'inscription d'un nouvel utilisateur
    registerLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const newUsername = prompt("Choisissez un pseudo pour votre nouveau compte :");
        if (newUsername && newUsername.trim() !== '') {
            const newPassword = prompt(`Choisissez un mot de passe pour ${newUsername}:`);
            if (newPassword && newPassword.trim() !== '') {
                try {
                    const response = await fetch(`${BACKEND_URL}/register`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ username: newUsername, password: newPassword })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        alert(`Compte ${newUsername} créé ! Vous pouvez maintenant vous connecter.`);
                        usernameInput.value = newUsername; // Pré-remplit le champ pseudo
                    } else {
                        alert(data.message || 'Erreur lors de la création du compte.');
                    }
                } catch (error) {
                    console.error('Erreur lors de l\'inscription:', error);
                    alert('Erreur lors de la création du compte sur le serveur.');
                }
            } else {
                alert("Mot de passe non valide.");
            }
        }
    });

    // --- Gestion des statistiques avec le Backend ---

    // Récupère les statistiques d'un utilisateur depuis le backend
    const getStats = async (userId) => {
        if (!userId) return [];
        try {
            const response = await fetch(`${BACKEND_URL}/stats/${userId}`);
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des stats.');
            }
            const stats = await response.json();
            return stats;
        } catch (error) {
            console.error('Erreur:', error);
            showMessage(messageElement, 'Erreur lors du chargement des statistiques.', 'error');
            return [];
        }
    };

    // Affiche les statistiques pour l'utilisateur courant
    const displayStats = async (userId) => {
        const stats = await getStats(userId); // Récupère les stats via le backend
        statsListDiv.innerHTML = ''; // Vide la liste existante

        if (stats.length === 0) {
            statsListDiv.innerHTML = '<p>Aucune statistique enregistrée pour le moment.</p>';
            clearStatsBtn.classList.add('hidden');
        } else {
            stats.forEach((stat) => { // Plus besoin d'index local, on utilise l'id de la stat du backend
                const statItem = document.createElement('div');
                statItem.classList.add('stat-item');
                statItem.innerHTML = `
                    <p><strong>${stat.gameName}</strong>: ${stat.statType} = ${stat.statValue}</p>
                    <button class="delete-btn" data-stat-id="${stat.id}">Supprimer</button>
                `;
                statsListDiv.appendChild(statItem);
            });
            clearStatsBtn.classList.remove('hidden');
        }
    };

    // Gère la soumission du formulaire d'ajout de stats
    statsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUserId) {
            showMessage(messageElement, 'Vous devez être connecté pour ajouter des statistiques.', 'error');
            return;
        }

        const gameName = gameNameInput.value.trim();
        const statType = statTypeInput.value.trim();
        const statValue = statValueInput.value.trim();

        if (gameName && statType && statValue) {
            try {
                const response = await fetch(`${BACKEND_URL}/stats`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ userId: currentUserId, gameName, statType, statValue })
                });

                const data = await response.json();

                if (response.ok) {
                    displayStats(currentUserId); // Met à jour l'affichage
                    statsForm.reset();
                    showMessage(messageElement, data.message, 'success');
                } else {
                    showMessage(messageElement, data.message || 'Erreur lors de l\'ajout.', 'error');
                }
            } catch (error) {
                console.error('Erreur lors de l\'ajout de stat:', error);
                showMessage(messageElement, 'Erreur de connexion au serveur.', 'error');
            }
        } else {
            showMessage(messageElement, 'Veuillez remplir tous les champs.', 'error');
        }
    });

    // Gère la suppression d'une statistique
    statsListDiv.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn') && currentUserId) {
            const statIdToDelete = e.target.dataset.statId; // Récupère l'ID réel de la stat

            if (!statIdToDelete) {
                console.error("ID de statistique manquant pour la suppression.");
                showMessage(messageElement, 'Erreur: Statistique non trouvée pour suppression.', 'error');
                return;
            }

            if (confirm('Êtes-vous sûr de vouloir supprimer cette statistique ?')) {
                try {
                    const response = await fetch(`${BACKEND_URL}/stats/${statIdToDelete}`, {
                        method: 'DELETE'
                    });

                    const data = await response.json();

                    if (response.ok) {
                        displayStats(currentUserId); // Met à jour l'affichage
                        showMessage(messageElement, data.message, 'success');
                    } else {
                        showMessage(messageElement, data.message || 'Erreur lors de la suppression.', 'error');
                    }
                } catch (error) {
                    console.error('Erreur lors de la suppression de stat:', error);
                    showMessage(messageElement, 'Erreur de connexion au serveur.', 'error');
                }
            }
        }
    });

    // Gère l'effacement de toutes les statistiques
    clearStatsBtn.addEventListener('click', async () => {
        if (!currentUserId) {
            showMessage(messageElement, 'Vous devez être connecté pour effacer des statistiques.', 'error');
            return;
        }

        if (confirm('Êtes-vous sûr de vouloir effacer toutes les statistiques ?')) {
            try {
                const response = await fetch(`${BACKEND_URL}/stats/user/${currentUserId}`, {
                    method: 'DELETE'
                });

                const data = await response.json();

                if (response.ok) {
                    displayStats(currentUserId); // Met à jour l'affichage
                    showMessage(messageElement, data.message, 'success');
                } else {
                    showMessage(messageElement, data.message || 'Erreur lors de l\'effacement.', 'error');
                }
            } catch (error) {
                console.error('Erreur lors de l\'effacement de toutes les stats:', error);
                showMessage(messageElement, 'Erreur de connexion au serveur.', 'error');
            }
        }
    });

    // --- Logique de recherche d'utilisateurs ---
    searchBtn.addEventListener('click', async () => {
        const searchTerm = searchInput.value.trim().toLowerCase();
        searchResultsDiv.innerHTML = ''; // Vide les résultats précédents

        if (searchTerm === "") {
            searchResultsDiv.innerHTML = '<p>Veuillez entrer un pseudo à rechercher.</p>';
            return;
        }

        try {
            // Récupère toutes les stats de tous les utilisateurs pour la recherche
            const response = await fetch(`${BACKEND_URL}/all-users-stats`);
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des utilisateurs.');
            }
            const allUsersWithStats = await response.json();

            let found = false;
            allUsersWithStats.forEach(user => {
                if (user.username.toLowerCase().includes(searchTerm)) {
                    found = true;
                    const userPreview = document.createElement('div');
                    userPreview.classList.add('user-profile-preview');
                    userPreview.innerHTML = `
                        <h3>${user.username}</h3>
                        <p>Stats connues : ${user.stats.length} entrées</p>
                        <button class="view-user-stats-btn" data-username="${user.username}" data-userid="${user.userId}">Voir les stats de ${user.username}</button>
                    `;
                    searchResultsDiv.appendChild(userPreview);
                }
            });

            if (!found) {
                searchResultsDiv.innerHTML = '<p>Aucun utilisateur trouvé avec ce pseudo.</p>';
            }
        } catch (error) {
            console.error('Erreur lors de la recherche d\'utilisateurs:', error);
            searchResultsDiv.innerHTML = '<p>Erreur lors de la recherche d\'utilisateurs sur le serveur.</p>';
        }
    });

    // Gérer le clic sur "Voir les stats de l'utilisateur"
    searchResultsDiv.addEventListener('click', async (e) => {
        if (e.target.classList.contains('view-user-stats-btn')) {
            const usernameToView = e.target.dataset.username;
            const userIdToView = e.target.dataset.userid;

            try {
                const userStats = await getStats(userIdToView); // Récupère les stats de l'utilisateur recherché via le backend

                let statsText = `Statistiques de ${usernameToView}:\n\n`;
                if (userStats.length > 0) {
                    userStats.forEach(stat => {
                        statsText += `  ${stat.gameName}: ${stat.statType} = ${stat.statValue}\n`;
                    });
                } else {
                    statsText += "  Aucune statistique enregistrée pour cet utilisateur.";
                }
                alert(statsText); // Pour une implémentation plus avancée, tu afficherais cela dans une modale ou une section dédiée.
            } catch (error) {
                console.error('Erreur lors de la visualisation des stats:', error);
                alert('Erreur lors de la récupération des stats de l\'utilisateur.');
            }
        }
    });

    // --- Initialisation au chargement de la page ---
    updateUIForAuth(); // Vérifie si un utilisateur est déjà connecté au chargement de la page
});
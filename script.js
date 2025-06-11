document.addEventListener('DOMContentLoaded', () => {
    // --- Éléments du DOM ---
    
    // Modale pour l'affichage des stats d'autres joueurs
    const modal = document.getElementById('userStatsModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const closeModalBtn = document.getElementById('closeModalBtn');
    
    // Sections
    const searchUsersSection = document.getElementById('search-users');
    const loginSection = document.getElementById('login-section');
    const myStatsSection = document.getElementById('my-stats-section');

    // Navigation
    const loginLink = document.getElementById('loginLink');
    const myStatsLink = document.getElementById('myStatsLink');
    const logoutLink = document.getElementById('logoutLink');
    const logoutBtn = document.getElementById('logoutBtn'); // Utilisé pour le bouton de déconnexion dans la section Mes Stats

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
    const statsListDiv = document.getElementById('statsList'); // L'endroit où les stats sont affichées
    const messageElement = document.getElementById('message'); // Pour les messages dans la section stats
    const clearStatsBtn = document.getElementById('clearStatsBtn');

    // --- Configuration du Backend ---
    const BACKEND_URL = 'https://gaming-stats-api.onrender.com'; // ASSURE-TOI QUE C'EST L'URL EXACTE DE TON SERVICE RENDER

    // --- Variables de session ---
    let currentUserId = null; // Stocke l'ID de l'utilisateur connecté depuis le backend
    let currentUsername = null; // Stocke le pseudo de l'utilisateur connecté

    // --- Fonctions utilitaires ---

    // Affiche un message temporaire à l'utilisateur
    const showMessage = (element, msg, type = 'info') => { // Ajout d'un type par défaut 'info'
        element.textContent = msg;
        element.className = type; // Définit la classe (ex: 'success', 'error', 'info')
        element.classList.remove('hidden');
        setTimeout(() => {
            element.classList.add('hidden');
        }, 3000);
    };

    // --- Gestion de l'authentification et de l'interface ---

    // Met à jour l'interface utilisateur en fonction de l'état de connexion
    const updateUIForAuth = async () => { // Rend la fonction async pour appeler displayStats
        const storedUserId = localStorage.getItem('currentUserId');
        const storedUsername = localStorage.getItem('currentUser');

        if (storedUserId && storedUsername) {
            currentUserId = storedUserId;
            currentUsername = storedUsername;

            loginLink.classList.add('hidden');
            myStatsLink.classList.remove('hidden');
            logoutLink.classList.remove('hidden'); // Affiche le lien de déconnexion dans la nav
            
            // Masque la section de connexion et affiche la section de mes stats
            loginSection.classList.add('hidden');
            myStatsSection.classList.remove('hidden');
            searchUsersSection.classList.add('hidden'); // Assure que la section recherche est masquée aussi

            showMessage(loginMessage, `Bienvenue, ${currentUsername} !`, 'success');
            await displayStats(currentUserId); // IMPORTANT: Affiche les stats de l'utilisateur connecté APRÈS connexion/rechargement
        } else {
            currentUserId = null;
            currentUsername = null;

            loginLink.classList.remove('hidden');
            myStatsLink.classList.add('hidden');
            logoutLink.classList.add('hidden'); // Masque le lien de déconnexion dans la nav

            // Affiche la section de connexion par défaut
            loginSection.classList.remove('hidden');
            myStatsSection.classList.add('hidden');
            searchUsersSection.classList.remove('hidden'); // Affiche la section recherche par défaut
            // Efface les stats affichées si l'utilisateur est déconnecté
            statsListDiv.innerHTML = '<p>Connectez-vous pour voir vos statistiques.</p>';
        }
    };

    // Gère la soumission du formulaire de connexion
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !password) {
            showMessage(loginMessage, 'Veuillez entrer un pseudo et un mot de passe.', 'error');
            return;
        }

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
                localStorage.setItem('currentUserId', data.userId);
                localStorage.setItem('currentUser', data.username);
                await updateUIForAuth(); // Met à jour l'interface après connexion réussie
                showMessage(loginMessage, data.message, 'success');
                loginForm.reset(); // Vide le formulaire de connexion
            } else {
                showMessage(loginMessage, data.message || 'Erreur de connexion.', 'error');
            }
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            showMessage(loginMessage, 'Erreur de connexion au serveur.', 'error');
        }
    });

    // Gère la déconnexion
    logoutBtn.addEventListener('click', (e) => { // Bouton de déconnexion dans la section "Mes stats"
        e.preventDefault();
        localStorage.removeItem('currentUserId');
        localStorage.removeItem('currentUser');
        updateUIForAuth(); // Met à jour l'interface
        showMessage(loginMessage, 'Vous avez été déconnecté.', 'success');
    });

    logoutLink.addEventListener('click', (e) => { // Lien de déconnexion dans la navigation
        e.preventDefault();
        localStorage.removeItem('currentUserId');
        localStorage.removeItem('currentUser');
        updateUIForAuth();
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
                        passwordInput.value = newPassword; // Pré-remplit le champ mot de passe (pour faciliter le test)
                    } else {
                        alert(data.message || 'Erreur lors de la création du compte.');
                    }
                } catch (error) {
                    console.error('Erreur lors de l\'inscription:', error);
                    alert('Erreur lors de la création du compte sur le serveur.');
                }
            } else {
                alert("Mot de passe non valide. L'inscription a été annulée.");
            }
        } else {
            alert("Pseudo non valide. L'inscription a été annulée.");
        }
    });

    // --- Gestion des statistiques avec le Backend ---

    // Récupère les statistiques d'un utilisateur depuis le backend
    const getStats = async (userId) => {
        if (!userId) {
            console.warn('getStats: userId est undefined ou nul. Retourne un tableau vide.');
            return [];
        }
        try {
            const response = await fetch(`${BACKEND_URL}/stats/${userId}`);
            if (!response.ok) {
                // Si la réponse n'est pas OK, mais le statut est 404 (pas de stats trouvées), ce n'est pas une erreur serveur
                if (response.status === 404) {
                    console.log(`Aucune statistique trouvée pour l'utilisateur ${userId}.`);
                    return [];
                }
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la récupération des stats.');
            }
            const stats = await response.json();
            return stats;
        } catch (error) {
            console.error('Erreur dans getStats:', error);
            showMessage(messageElement, 'Erreur lors du chargement des statistiques.', 'error');
            return [];
        }
    };

    // Affiche les statistiques pour l'utilisateur courant
    const displayStats = async (userId) => {
        console.log('--- Appel de displayStats pour userId:', userId); // Débug 1
        const stats = await getStats(userId); // Récupère les stats via le backend
        console.log('--- Stats reçues du backend pour affichage:', stats); // Débug 2: Vérifie le format des données

        statsListDiv.innerHTML = ''; // Vide la liste existante

        if (stats.length === 0) {
            statsListDiv.innerHTML = '<p>Aucune statistique enregistrée pour le moment.</p>';
            clearStatsBtn.classList.add('hidden');
        } else {
            stats.forEach((stat, index) => {
                console.log(`--- Traitement de la stat ${index}:`, stat); // Débug 3: Vérifie chaque objet stat
              
                // VÉRIFICATION CRUCIALE : S'assurer que les propriétés existent avec les noms corrects
                if (stat && stat.gameName && stat.statType && stat.statValue && stat.id) { 
                    const statItem = document.createElement('div');
                    statItem.classList.add('stat-item');
                    statItem.innerHTML = `
                            <p><strong>${stat.gameName}</strong>: ${stat.statType} = ${stat.statValue}</p>
                             <button class="delete-btn" data-stat-id="${stat.id}">Supprimer</button>
                        `;
                    statsListDiv.appendChild(statItem);
                } else {
                    console.error(`--- Erreur: Propriété manquante ou incorrecte dans la stat ${index}:`, stat); // Débug 4
                    const errorItem = document.createElement('div');
                    errorItem.classList.add('stat-item', 'error');
                    errorItem.textContent = `Erreur d'affichage pour une stat. Données: ${JSON.stringify(stat)}`;
                    statsListDiv.appendChild(errorItem);
                }
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

        // Ajout de console.log pour vérifier les valeurs avant l'envoi
        console.log('Tentative d\'ajout de stat avec:');
        console.log('gameName:', gameName);
        console.log('statType:', statType);
        console.log('statValue:', statValue);

        if (gameName && statType && statValue) {
            try {
                const response = await fetch(`${BACKEND_URL}/stats`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    // ENVOIE les noms de propriétés en camelCase vers le backend,
                    // C'est la convention standard pour le JS. Ton backend doit être configuré
                    // pour les recevoir ainsi ou les mapper si nécessaire.
                    body: JSON.stringify({ userId: currentUserId, gameName, statType, statValue })
                });

                const data = await response.json();

                if (response.ok) {
                    await displayStats(currentUserId); // Met à jour l'affichage après un ajout réussi
                    statsForm.reset(); // Vide le formulaire
                    showMessage(messageElement, data.message, 'success');
                } else {
                    showMessage(messageElement, data.message || 'Erreur lors de l\'ajout.', 'error');
                }
            } catch (error) {
                console.error('Erreur lors de l\'ajout de stat:', error);
                showMessage(messageElement, 'Erreur de connexion au serveur.', 'error');
            }
        } else {
            showMessage(messageElement, 'Veuillez remplir tous les champs de la statistique.', 'error');
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
                        await displayStats(currentUserId); // Met à jour l'affichage
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

        if (confirm('Êtes-vous sûr de vouloir effacer toutes les statistiques ? Cette action est irréversible.')) {
            try {
                const response = await fetch(`${BACKEND_URL}/stats/user/${currentUserId}`, {
                    method: 'DELETE'
                });

                const data = await response.json();

                if (response.ok) {
                    await displayStats(currentUserId); // Met à jour l'affichage (qui devrait maintenant être vide)
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
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la récupération des utilisateurs.');
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
            const userStats = await getStats(userIdToView);

            let statsText = '';
            if (userStats.length > 0) {
                userStats.forEach(stat => {
                    statsText += `• ${stat.gameName}: ${stat.statType} = ${stat.statValue}\n`;
                });
            } else {
                statsText = "Aucune statistique enregistrée pour cet utilisateur.";
            }

            // Affiche dans la modale
            modalTitle.textContent = `Statistiques de ${usernameToView}`;
            modalBody.textContent = statsText;
            userStatsModal.classList.remove('hidden');
        } catch (error) {
            console.error('Erreur lors de la visualisation des stats:', error);
            modalTitle.textContent = "Erreur";
            modalBody.textContent = "Impossible de charger les statistiques.";
            modal.classList.add('show');
        }
    }
});

// --- Fermer la modale
closeModalBtn.addEventListener('click', () => {
    modal.classList.remove('show');
});

window.addEventListener('click', (e) => {
    if (e.target === userStatsModal) {
        userStatsModal.classList.add('hidden');
    }
});


    // --- Initialisation au chargement de la page ---
    updateUIForAuth(); // Vérifie si un utilisateur est déjà connecté au chargement de la page
});

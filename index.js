// Classe pour gérer les utilisateurs
class UserManager {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    }

    // Inscription nouvel utilisateur
    register(name, email, password) {
        console.log('Début de la méthode register'); 
        
        // Vérification des paramètres
        if (!name || !email || !password) {
            throw new Error("Tous les champs sont requis");
        }

        console.log('Utilisateurs existants:', this.users); 

        // Vérification si l'email existe déjà
        const existingUser = this.users.find(user => user.email === email);
        if (existingUser) {
            console.log('Email déjà utilisé:', email); 
            throw new Error("Cet email est déjà utilisé");
        }

        // Création nouvel utilisateur
        const user = {
            id: Date.now().toString(),
            name,
            email,
            password // Dans un vrai projet il faut hasher le mot de passe 
        };

        try {
            this.users.push(user);
            localStorage.setItem('users', JSON.stringify(this.users));
            console.log('Utilisateur enregistré avec succès:', user); 
            return user;
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement:', error);
            throw new Error("Erreur lors de l'enregistrement. Veuillez réessayer.");
        }
    }

    // Connexion utilisateur
    login(email, password) {
        const user = this.users.find(u => u.email === email && u.password === password);
        if (!user) {
            throw new Error("Email ou mot de passe incorrect");
        }

        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        return user;
    }

    // Deconnexion
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }
}

// Classe pour gérer les tâches
class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    }

    // Création nouvelle tâche
    createTask(title, description, deadline, userId) {
        // Validation des paramètres
        if (!title || !description || !deadline || !userId) {
            throw new Error('Tous les champs sont obligatoires');
        }

        // Validation de la date
        const deadlineDate = new Date(deadline);
        if (!(deadlineDate instanceof Date) || isNaN(deadlineDate)) {
            throw new Error('Date invalide');
        }

        const task = {
            id: Date.now().toString(),
            title: title.trim(),
            description: description.trim(),
            deadline,
            userId,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.saveTasks();
        return task;
    }

    // Récupération taches d'un utilisateur
    getUserTasks(userId) {
        return this.tasks.filter(task => task.userId === userId);
    }

    // Validation tache
    completeTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = true;
            this.saveTasks();
        }
    }

    // Suppressio tâche
    deleteTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task && !task.completed) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveTasks();
        }
    }

    // Recherche taches
    searchTasks(query, userId) {
        query = query.toLowerCase();
        return this.tasks.filter(task => 
            task.userId === userId && 
            (task.title.toLowerCase().includes(query) || 
             task.description.toLowerCase().includes(query))
        );
    }

    // Sauvegarde des taches dans le localStorage
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }
}

// Initialisation des gestionnaires
const userManager = new UserManager();
const taskManager = new TaskManager();

// Fonction pour afficher une section
function showSection(sectionId) {
    console.log('Changement de section vers:', sectionId); // Debug

    // Masquer toutes les sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Désactiver tous les onglets
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Activer la section demandée
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    } else {
        console.error('Section non trouvée:', sectionId);
    }

    // Activer l'onglet correspondant
    const targetTab = document.querySelector(`[data-section="${sectionId}"]`);
    if (targetTab) {
        targetTab.classList.add('active');
    } else {
        console.error('Onglet non trouvé:', sectionId);
    }
}

// Fonction afficher les tâches
function displayTasks(tasks) {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';

    tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = `task ${task.completed ? 'completed' : ''}`;
        
        const deadline = new Date(task.deadline);
        const isOverdue = !task.completed && deadline < new Date();

        taskElement.innerHTML = `
            <div class="task-header">
                <span class="task-title">${task.title}</span>
                <div class="task-actions">
                    ${!task.completed ? `
                        <button class="btn btn-primary complete-task" data-id="${task.id}">
                            Valider
                        </button>
                        <button class="btn btn-danger delete-task" data-id="${task.id}">
                            Supprimer
                        </button>
                    ` : ''}
                </div>
            </div>
            <p>${task.description}</p>
            <p style="color: ${isOverdue ? 'red' : 'green'}">
                Date limite: ${deadline.toLocaleString()}
            </p>
        `;

        taskList.appendChild(taskElement);
    });
}

// gestionnaires d'événements
document.addEventListener('DOMContentLoaded', () => {
    // Navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const section = tab.getAttribute('data-section');
            console.log('Click sur onglet:', section); // Debug
            showSection(section);
        });
    });

    console.log('Sections disponibles:', 
        Array.from(document.querySelectorAll('.section')).map(s => s.id)
    );
    console.log('Onglets disponibles:', 
        Array.from(document.querySelectorAll('.nav-tab')).map(t => t.dataset.section)
    );

    // Si un utilisateur est déjà connecté
    if (userManager.currentUser) {
        document.querySelector('[data-section="tasks"]').style.display = 'block';
        showSection('tasks');
        displayTasks(taskManager.getUserTasks(userManager.currentUser.id));
    }

    // Inscription
    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        try {
            // Récupération des valeurs des champs
            const name = document.getElementById('registerName').value.trim();
            const email = document.getElementById('registerEmail').value.trim();
            const password = document.getElementById('registerPassword').value;

            // Validation des champs
            if (!name || !email || !password) {
                alert('Tous les champs sont obligatoires');
                return;
            }

            // Validation basique de l'email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; //ça je l'ai piqué sur internet 
            if (!emailRegex.test(email)) {
                alert('Veuillez entrer une adresse email valide');
                return;
            }

            // Validation du mot de passe
            if (password.length < 6) {
                alert('Le mot de passe doit contenir au moins 6 caractères');
                return;
            }

            console.log('Tentative d\'inscription avec:', { name, email }); // Pour le débogage

            const user = userManager.register(name, email, password);
            console.log('Utilisateur inscrit:', user); // Pour le débogage

            // Réinitialisation du formulaire
            document.getElementById('registerForm').reset();
            
            alert('Inscription réussie !');
            showSection('login');
        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error); // Pour le débogage
            alert(error.message);
        }
    });

    // Connexion
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        try {
            const user = userManager.login(
                document.getElementById('loginEmail').value,
                document.getElementById('loginPassword').value
            );
            document.querySelector('[data-section="tasks"]').style.display = 'block';
            showSection('tasks');
            displayTasks(taskManager.getUserTasks(user.id));
        } catch (error) {
            alert(error.message);
        }
    });

    // Déconnexion
    document.getElementById('logoutBtn').addEventListener('click', () => {
        userManager.logout();
        document.querySelector('[data-section="tasks"]').style.display = 'none';
        showSection('login');
    });

    // Création de tâche
    document.getElementById('taskForm').addEventListener('submit', (e) => {
        e.preventDefault();

        // Récupération et nettoyage des valeurs
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const deadline = document.getElementById('taskDeadline').value;

        console.log('Valeurs du formulaire:', { title, description, deadline }); // Debug

        // Verif des champs
        if (!title) {
            alert('Le titre est obligatoire');
            return;
        }
        if (!description) {
            alert('La description est obligatoire');
            return;
        }
        if (!deadline) {
            alert('La date limite est obligatoire');
            return;
        }

        // Verif de la date limite
        const deadlineDate = new Date(deadline);
        const now = new Date();
        
        console.log('Dates comparées:', {
            deadline: deadlineDate,
            now: now,
            isValid: deadlineDate instanceof Date && !isNaN(deadlineDate)
        }); // Debug

        if (!(deadlineDate instanceof Date) || isNaN(deadlineDate)) {
            alert('La date limite est invalide');
            return;
        }

        if (deadlineDate < now) {
            alert('La date limite ne peut pas être dans le passé');
            return;
        }

        try {
            // Creation de la tâche
            const task = taskManager.createTask(
                title,
                description,
                deadline,
                userManager.currentUser.id
            );

            console.log('Tâche créée:', task); // Debug

            // Reset du formulaire et affichage des tâches
            e.target.reset();
            displayTasks(taskManager.getUserTasks(userManager.currentUser.id));
            
            // Message de confirmation
            alert('Tâche créée avec succès !');
        } catch (error) {
            console.error('Erreur lors de la création de la tâche:', error);
            alert('Erreur lors de la création de la tâche: ' + error.message);
        }
    });

    // Recherche de tâches
    document.getElementById('searchTask').addEventListener('input', (e) => {
        const query = e.target.value;
        const filteredTasks = taskManager.searchTasks(query, userManager.currentUser.id);
        displayTasks(filteredTasks);
    });

    // Gestion des événements de la liste des tâches
    document.getElementById('taskList').addEventListener('click', (e) => {
        const taskId = e.target.dataset.id;
        if (!taskId) return;

        if (e.target.classList.contains('complete-task')) {
            taskManager.completeTask(taskId);
            displayTasks(taskManager.getUserTasks(userManager.currentUser.id));
        } else if (e.target.classList.contains('delete-task')) {
            if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
                taskManager.deleteTask(taskId);
                displayTasks(taskManager.getUserTasks(userManager.currentUser.id));
            }
        }
    });
}); 
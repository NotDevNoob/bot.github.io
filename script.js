
    // Detect if the device is likely mobile or low-powered
    const isMobileOrLowPower = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                              window.navigator.hardwareConcurrency <= 4;

    // Configure particles.js with heavily optimized settings for performance
    particlesJS('particleCanvas', {
        particles: {
            number: {
                value: 30, // Drastically reduced particle count
                density: { enable: true, value_area: 1000 }
            },
            color: { value: "#ffffff" },
            shape: {
                type: "circle",
                stroke: { width: 0, color: "#000000" },
            },
            opacity: {
                value: 0.2,
                random: false,
                anim: { enable: false }
            },
            size: {
                value: 2,
                random: false, // Disable random sizing for better performance
                anim: { enable: false }
            },
            line_linked: {
                enable: true,
                distance: 100,
                color: "#ffffff",
                opacity: 0.1, // Reduced opacity
                width: 1
            },
            move: {
                enable: true,
                speed: 1, // Slower movement
                direction: "none",
                random: false,
                straight: false,
                out_mode: "out",
                bounce: false,
                attract: { enable: false }
            }
        },
        interactivity: {
            detect_on: "canvas",
            events: {
                onhover: { enable: false }, // Disabled hover effects
                onclick: { enable: false }, // Disabled click effects
                resize: true
            },
            modes: {
                repulse: { distance: 0, duration: 0 },
                push: { particles_nb: 0 }
            }
        },
        retina_detect: false // Disable retina detection for better performance
    });

    const tierEmojis = {1: "🥇", 2: "🥈", 3: "🥉", 4: "🔷", 5: "🔶"};
    let allPlayers = [];
    let currentFilter = 'all'; // 'all' or 'Anemoia'
    const tierOptions = ['HT1', 'LT1', 'HT2', 'LT2', 'HT3', 'LT3', 'HT4', 'LT4', 'HT5', 'LT5'];

    async function getUUID(username) {
        try {
            const response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
            if (!response.ok) {
                // Generate a random UUID instead of failing
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            }
            const data = await response.json();
            return data.id;
        } catch (error) {
            console.error("Errore nel recupero dell'UUID:", error);
            // Generate a random UUID on error
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
    }

    const tiersContainer = document.getElementById('tiersContainer');
    for (let tier = 1; tier <= 5; tier++) {
        const card = document.createElement('div');
        card.className = 'tier-card';
        card.innerHTML = `
            <div class="tier-header">
                <span class="tier-emoji">${tierEmojis[tier]}</span>
                <span class="tier-number">TIER ${tier}</span>
            </div>
            <div class="user-list" id="tier-${tier}-users"></div>
        `;
        tiersContainer.appendChild(card);
    }

    // Admin functionality
    const adminButton = document.getElementById('adminButton');
    const adminModal = document.getElementById('adminModal');
    const adminIgnInput = document.getElementById('adminIgn');
    const adminTierSelect = document.getElementById('adminTier');
    const adminSubmit = document.getElementById('adminSubmit');
    const adminCancel = document.getElementById('adminCancel');
    const adminMessage = document.getElementById('adminMessage');

    // Admin button click event is now handled below with GitHub settings loading

    function closeAdminModal() {
        adminModal.classList.remove('visible');
        setTimeout(() => {
            adminModal.style.display = 'none';
        }, 300); // Match the transition duration
    }

    adminCancel.addEventListener('click', closeAdminModal);

    adminModal.addEventListener('click', (e) => {
        if (e.target === adminModal) {
            closeAdminModal();
        }
    });

    function clearAdminForm() {
        adminIgnInput.value = '';
        adminTierSelect.value = '';
        document.getElementById('adminAnemoia').checked = false;
        document.getElementById('adminBedwars').checked = false;
        document.getElementById('adminTierBedwars').value = '';

        adminMessage.style.display = 'none';
        adminMessage.textContent = '';
        adminMessage.className = 'admin-message';
    }

    function showAdminMessage(message, isError = false) {
        adminMessage.textContent = message;
        adminMessage.className = `admin-message ${isError ? 'error' : 'success'}`;
        adminMessage.style.display = 'block';
    }

    adminIgnInput.addEventListener('input', async () => {
        const ign = adminIgnInput.value.trim();
        if (ign) {
            const existingPlayer = allPlayers.find(p => p.ign.toLowerCase() === ign.toLowerCase());
            if (existingPlayer) {
                adminTierSelect.value = existingPlayer.tier_earned || '';
                document.getElementById('adminAnemoia').checked = existingPlayer.Anemoia || false;
                document.getElementById('adminBedwars').checked = existingPlayer.bedwars || false;
                document.getElementById('adminTierBedwars').value = existingPlayer.tier_bedwars_earned || '';
            }
        }
    });

    adminSubmit.addEventListener('click', async () => {
        const ign = adminIgnInput.value.trim();
        const tier = adminTierSelect.value;
        const Anemoia = document.getElementById('adminAnemoia').checked;
        const bedwars = document.getElementById('adminBedwars').checked;
        const tierBedwars = document.getElementById('adminTierBedwars').value;

        if (!ign) {
            showAdminMessage('Inserisci un IGN', true);
            return;
        }

        if (!tier) {
            showAdminMessage('Seleziona un tier', true);
            return;
        }

        try {
            // Check if player exists
            const existingPlayerIndex = allPlayers.findIndex(p => p.ign.toLowerCase() === ign.toLowerCase());
            // Get UUID (will generate a random one if lookup fails)
            const uuid = await getUUID(ign);

            const timestamp = new Date().toISOString();
            if (existingPlayerIndex !== -1) {
                // Update existing player
                const tierBefore = allPlayers[existingPlayerIndex].tier_earned;
                const tierBedwarsBefore = allPlayers[existingPlayerIndex].tier_bedwars_earned || 'Nessuno';
                allPlayers[existingPlayerIndex] = {
                    tier_before: tierBefore,
                    tier_earned: tier,
                    tier_bedwars_before: tierBedwarsBefore,
                    tier_bedwars_earned: tierBedwars || tierBedwarsBefore,
                    ign: ign,
                    timestamp: timestamp,
                    uuid: uuid,
                    Anemoia: Anemoia,
                    bedwars: bedwars
                };
                showAdminMessage(`Giocatore aggiornato: ${ign}${Anemoia ? ' (Anemoia)' : ''}${bedwars ? ' (Bedwars)' : ''}`);
            } else {
                // Add new player
                allPlayers.push({
                    tier_before: "Nessuno",
                    tier_earned: tier,
                    tier_bedwars_before: "Nessuno",
                    tier_bedwars_earned: tierBedwars || "Nessuno",
                    ign: ign,
                    timestamp: timestamp,
                    uuid: uuid,
                    Anemoia: Anemoia,
                    bedwars: bedwars
                });
                showAdminMessage(`Nuovo giocatore: ${ign}${Anemoia ? ' (Anemoia)' : ''}${bedwars ? ' (Bedwars)' : ''}`);
            }

            // Always save to GitHub repository
            await saveToGitHub(allPlayers);

            updateUI();

            // Clear form after successful save
            setTimeout(() => {
                clearAdminForm();
                closeAdminModal();
            }, 2000);

        } catch (error) {
            console.error("Error saving data:", error);
            showAdminMessage('Errore nel salvare i dati', true);
        }
    });

    async function saveToGitHub(data) {
        try {
            // Show loading message with spinner
            adminMessage.innerHTML = 'Saving to GitHub... <span class="loading-indicator"></span>';
            adminMessage.className = 'admin-message success';
            adminMessage.style.display = 'block';

            // Get the token and settings from localStorage
            const token = localStorage.getItem('github_token');
            const owner = localStorage.getItem('github_username');
            const repo = localStorage.getItem('github_repo');

            console.log('GitHub Settings:', {
                owner,
                repo,
                tokenProvided: !!token,
                tokenLength: token ? token.length : 0
            });

            if (!token || !owner || !repo) {
                throw new Error('GitHub settings are incomplete. Please configure them in the admin panel.');
            }

            const path = 'data.json'; // Path to data.json in your repository

            // First, get the current file to get its SHA
            const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
            console.log('Fetching file from:', getUrl);

            const getResponse = await fetch(getUrl, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            console.log('Get file response status:', getResponse.status);

            let sha = null;

            if (getResponse.status === 404) {
                // File doesn't exist, we'll create it
                console.log('data.json file not found, will create a new one');
            } else if (!getResponse.ok) {
                const errorText = await getResponse.text();
                console.error('GitHub API error response:', errorText);
                throw new Error(`Failed to get file: ${getResponse.status} ${getResponse.statusText}`);
            } else {
                // File exists, get its SHA
                const fileInfo = await getResponse.json();
                sha = fileInfo.sha;
                console.log('Current file SHA:', sha);
            }

            // Helper function to safely encode Unicode strings to base64
            function utf8ToBase64(str) {
                return btoa(unescape(encodeURIComponent(str)));
            }

            // Sort data by timestamp (newest first)
            data.sort((a, b) => {
                const dateA = new Date(a.timestamp || 0);
                const dateB = new Date(b.timestamp || 0);
                return dateB - dateA;
            });

            // Prepare the content (base64 encoded)
            const jsonData = JSON.stringify(data, null, 2);
            console.log('Data to save (first 100 chars):', jsonData.substring(0, 100) + '...');
            const content = utf8ToBase64(jsonData);

            // Update or create the file
            const updateUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
            console.log('Updating file at:', updateUrl);

            // Prepare the request body
            const updateBodyObj = {
                message: sha ? 'Update player data via web interface' : 'Create data.json via web interface',
                content: content
            };

            // Only include sha if the file already exists
            if (sha) {
                updateBodyObj.sha = sha;
            }

            const updateBody = JSON.stringify(updateBodyObj);
            console.log('Update request body:', updateBodyObj);

            const updateResponse = await fetch(updateUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: updateBody
            });

            console.log('Update response status:', updateResponse.status);

            if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                console.error('GitHub API error response:', errorText);
                throw new Error(`Failed to update file: ${updateResponse.status} ${updateResponse.statusText}`);
            }

            const result = await updateResponse.json();
            console.log('GitHub update successful:', result);
            showAdminMessage('Successfully saved to GitHub repository!');

            return true;
        } catch (error) {
            console.error('Error saving to GitHub:', error);
            showAdminMessage('Error saving to GitHub: ' + error.message, true);
            return false;
        }
    }

    async function saveData() {
        try {
            // Just show success message
            adminMessage.innerHTML = 'Data saved successfully!';
            adminMessage.className = 'admin-message success';
            adminMessage.style.display = 'block';

            return true;
        } catch (error) {
            console.error("Error saving data:", error);
            throw error;
        }
    }

    // Cache DOM elements for better performance
    const filterAllButton = document.getElementById('filterAll');
    const filterAnemoiaButton = document.getElementById('filterAnemoia');
    const tierLists = {
        1: document.getElementById('tier-1-users'),
        2: document.getElementById('tier-2-users'),
        3: document.getElementById('tier-3-users'),
        4: document.getElementById('tier-4-users'),
        5: document.getElementById('tier-5-users')
    };

    // Cache sorted players to avoid re-sorting when filter changes
    let cachedSortedPlayers = [];
    let lastUpdateTime = 0;

    function updateUI() {
        const now = Date.now();
        // Throttle updates to prevent excessive rendering
        if (now - lastUpdateTime < 100) return;
        lastUpdateTime = now;

        // Create a map to hold fragments for each tier list
        const fragments = {
            1: document.createDocumentFragment(),
            2: document.createDocumentFragment(),
            3: document.createDocumentFragment(),
            4: document.createDocumentFragment(),
            5: document.createDocumentFragment()
        };

        // Clear all lists at once
        Object.values(tierLists).forEach(list => {
            if (list) list.innerHTML = '';
        });

        // Only sort if we don't have cached sorted players
        if (cachedSortedPlayers.length !== allPlayers.length) {
            // Sort players by tier and name for consistent display
            cachedSortedPlayers = [...allPlayers].sort((a, b) => {
                // First sort by tier number
                const tierA = a.tier_earned.slice(-1);
                const tierB = b.tier_earned.slice(-1);
                if (tierA !== tierB) return tierA - tierB;

                // Then by HT/LT (HT comes first)
                const isHTa = a.tier_earned.startsWith('H');
                const isHTb = b.tier_earned.startsWith('H');
                if (isHTa !== isHTb) return isHTb ? 1 : -1;

                // Finally by name
                return a.ign.localeCompare(b.ign);
            });
        }

        // Filter players based on current filter
        let filteredPlayers;
        let showBedwarsTier = false;

        if (currentFilter === 'all') {
            filteredPlayers = cachedSortedPlayers;
            showBedwarsTier = false;
        } else if (currentFilter === 'Anemoia') {
            filteredPlayers = cachedSortedPlayers.filter(player => player.Anemoia === true);
            showBedwarsTier = false;
        } else if (currentFilter === 'bedwars') {
            filteredPlayers = cachedSortedPlayers.filter(player => player.bedwars === true);
            showBedwarsTier = true;
        }

        // Build all elements first and add them to fragments
        // Use a more efficient approach with fewer DOM operations
        const playerTemplate = document.createElement('template');

        filteredPlayers.forEach(entry => {
            // Determine which tier to use for placement in the grid
            const tierToUse = showBedwarsTier && entry.tier_bedwars_earned ? entry.tier_bedwars_earned : entry.tier_earned;
            const tierNumber = tierToUse.slice(-1);
            if (!fragments[tierNumber]) return;

            // Create HTML string for better performance
            let playerClass = '';
            let indicator = '';

            if (entry.Anemoia) {
                playerClass = ' Anemoia';
                indicator = '<span class="Anemoia-indicator"><i class="fas fa-crown"></i></span>';
            } else if (entry.bedwars) {
                playerClass = ' bedwars';
                indicator = '<span class="bedwars-indicator"><i class="fas fa-bed"></i></span>';
            }

            // Determine which tier to show based on filter
            const tierToShow = showBedwarsTier && entry.tier_bedwars_earned ? entry.tier_bedwars_earned : entry.tier_earned;
            const htClass = tierToShow.startsWith('H') ? ' ht' : '';

            playerTemplate.innerHTML = `
                <div class="user-item${playerClass}" data-ign="${entry.ign}">
                    <div class="user-info">
                        <div class="user-name">${entry.ign} ${indicator}</div>
                        <div class="user-tier">
                            <span class="sword">${showBedwarsTier ? '🛏️' : '⚔️'}</span>
                            <span class="tier-badge${htClass}">${tierToShow}</span>
                        </div>
                    </div>
                </div>
            `;

            const userDiv = playerTemplate.content.firstElementChild.cloneNode(true);
            userDiv.addEventListener('click', () => showPlayerProfile(entry));
            fragments[tierNumber].appendChild(userDiv);
        });

        // Add all fragments to the DOM at once (minimizes reflows)
        for (let tier = 1; tier <= 5; tier++) {
            const list = tierLists[tier];
            if (list) list.appendChild(fragments[tier]);
        }

        // Update filter button states
        filterAllButton.classList.toggle('active', currentFilter === 'all');
        filterAnemoiaButton.classList.toggle('active', currentFilter === 'Anemoia');
        document.getElementById('filterBedwars').classList.toggle('active', currentFilter === 'bedwars');

        // Show empty state message if no players in filter
        if (filteredPlayers.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-state';
            let filterName = '';
            if (currentFilter === 'Anemoia') {
                filterName = 'Anemoia';
            } else if (currentFilter === 'bedwars') {
                filterName = 'Bedwars';
            }
            emptyMessage.innerHTML = `
                <div class="empty-icon"><i class="fas fa-search"></i></div>
                <div class="empty-text">Nessun giocatore ${filterName} trovato</div>
            `;
            tierLists[1].appendChild(emptyMessage);
        }
    }
    const searchInput = document.getElementById('searchInput');
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    const searchToggle = document.getElementById('searchToggle');
    const mobileSearchContainer = document.getElementById('mobileSearchContainer');

    // Handle search input events
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    mobileSearchInput.addEventListener('input', debounce(handleSearch, 300));

    // Toggle mobile search
    searchToggle.addEventListener('click', function() {
        mobileSearchContainer.style.display = mobileSearchContainer.style.display === 'block' ? 'none' : 'block';

        // Force reflow to ensure transition works
        void mobileSearchContainer.offsetWidth;

        if (mobileSearchContainer.style.display === 'block') {
            mobileSearchContainer.classList.add('active');
            mobileSearchInput.focus();
        } else {
            mobileSearchContainer.classList.remove('active');
        }
    });

    function debounce(func, wait) {
        let timeout;
        return function(event) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.call(this, event), wait);
        };
    }

    // Cache for search results to avoid repeated searches
    const searchCache = new Map();

    async function handleSearch(event) {
        // Get the search term from whichever input triggered the event
        const searchTerm = event.target.value.trim().toLowerCase();
        if (!searchTerm) return;

        // Check cache first
        if (searchCache.has(searchTerm)) {
            const player = searchCache.get(searchTerm);
            if (player) showPlayerProfile(player);
            return;
        }

        // If search term is at least 3 characters, do a more precise search
        if (searchTerm.length >= 3) {
            const player = allPlayers.find(p => p.ign.toLowerCase().includes(searchTerm));

            // Cache the result (including null results)
            searchCache.set(searchTerm, player || null);

            if (player) showPlayerProfile(player);
        }

        // Clear cache when it gets too large
        if (searchCache.size > 100) {
            const keysToDelete = Array.from(searchCache.keys()).slice(0, 50);
            keysToDelete.forEach(key => searchCache.delete(key));
        }
    }

    // Cache DOM elements for profile modal
    const profileModal = document.getElementById('profileModal');
    const profileContent = document.getElementById('profileContent');
    const profileImage = document.getElementById('profileImage');
    const profileIGN = document.getElementById('profileIGN');
    const profileTierEmoji = document.getElementById('profileTierEmoji');
    const profileTierText = document.getElementById('profileTierText');
    const profilePrevTier = document.getElementById('profilePrevTier');
    const profileDate = document.getElementById('profileDate');
    const AnemoiaBadge = document.getElementById('AnemoiaBadge');

    // Add click handler once
    profileModal.addEventListener('click', (e) => {
        if (e.target === profileModal) {
            closeModal();
        }
    });

    function showPlayerProfile(player) {
        // Prepare all content before showing the modal
        const tierNumber = player.tier_earned.replace(/\D/g,'');
        const placeholderImage = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 16 9%22%3E%3C%2Fsvg%3E';
        const imageSrc = `https://render.crafty.gg/3d/bust/${player.uuid}`;
        const emojiContent = tierEmojis[tierNumber] || '⚔️';

        // Format date if available
        let formattedDate = 'N/A';
        if (player.timestamp) {
            try {
                const date = new Date(player.timestamp);
                formattedDate = date.toLocaleDateString('it-IT', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            } catch (e) {
                console.error('Error formatting date:', e);
            }
        }

        // Update content
        profileImage.src = placeholderImage; // Set placeholder first
        profileIGN.textContent = player.ign;
        profileTierEmoji.textContent = emojiContent;
        profileTierText.textContent = player.tier_earned;
        profilePrevTier.textContent = player.tier_before || 'Nessuno';
        profileDate.textContent = formattedDate;

        // Show/hide Bedwars tiers
        const bedwarsTierRow = document.getElementById('bedwarsTierRow');
        const bedwarsPrevTierRow = document.getElementById('bedwarsPrevTierRow');
        const profileTierBedwars = document.getElementById('profileTierBedwars');
        const profilePrevTierBedwars = document.getElementById('profilePrevTierBedwars');

        if (player.bedwars) {
            bedwarsTierRow.style.display = 'flex';
            bedwarsPrevTierRow.style.display = 'flex';
            profileTierBedwars.textContent = player.tier_bedwars_earned || 'Nessuno';
            profilePrevTierBedwars.textContent = player.tier_bedwars_before || 'Nessuno';
        } else {
            bedwarsTierRow.style.display = 'none';
            bedwarsPrevTierRow.style.display = 'none';
        }

        // Set CoralMC stats link
        const coralMCLink = document.getElementById('profileCoralMCLink');
        coralMCLink.href = `https://stats.coralmc.it/user/${player.ign}`;
        coralMCLink.setAttribute('title', `Visualizza le statistiche di ${player.ign} su CoralMC`);

        // Show/hide Anemoia badge
        AnemoiaBadge.style.display = player.Anemoia ? 'flex' : 'none';

        // Show modal first
        profileModal.style.display = 'flex';

        // Force reflow and add active class in next frame
        requestAnimationFrame(() => {
            profileContent.classList.add('active');

            // Load the actual image after modal is shown
            const img = new Image();
            img.onload = () => {
                profileImage.src = imageSrc;
            };
            img.onerror = () => {
                // Keep placeholder on error
            };
            img.src = imageSrc;
        });
    }

    function closeModal() {
        const modal = document.getElementById('profileModal');
        const content = document.getElementById('profileContent');
        content.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    }

    document.getElementById('closeButton').addEventListener('click', closeModal);

    async function loadData() {
        try {
            // Always load directly from data.json
            console.log("Loading from data.json...");
            const response = await fetch('data.json');

            if (response.ok) {
                const data = await response.json();
                console.log("Data loaded from data.json:", data);

                if (Array.isArray(data) && data.length > 0) {
                    // Add UUIDs if missing
                    for (const player of data) {
                        if (!player.uuid) {
                            player.uuid = await getUUID(player.ign);
                        }
                    }

                    allPlayers = data;
                    updateUI();
                    console.log("Data loaded from data.json:", data.length, "players");
                    return;
                } else {
                    console.error("Invalid data format in data.json");
                }
            } else {
                console.error("Failed to load data.json:", response.status);
            }

            // If data.json failed, load the embedded default data

            // Add UUIDs
            for (const player of allPlayers) {
                if (!player.uuid) {
                    player.uuid = await getUUID(player.ign);
                }
            }

            updateUI();
            console.log("Loaded embedded default data:", allPlayers.length, "players");
        } catch (error) {
            console.error("Critical error loading data:", error);
            // Last resort - show at least something
            allPlayers = [
                {
                    "tier_earned": "HT2",
                    "ign": "kytsue",
                    "tester": "Admin",
                    "timestamp": new Date().toISOString()
                }
            ];
            updateUI();
            alert("Error loading data. Please try refreshing the page or contact the administrator.");
        }
    }

    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl+Shift+A to show admin button
        if (e.ctrlKey && e.shiftKey && e.key === 'A') {
            const adminButton = document.getElementById('adminButton');
            adminButton.style.display = adminButton.style.display === 'none' ? 'flex' : 'none';
        }

        // Escape key to close admin modal
        if (e.key === 'Escape' && adminModal.style.display === 'flex') {
            closeAdminModal();
        }
    });

    // GitHub settings management
    // Function to verify GitHub token permissions
    async function verifyGitHubToken(token, username, repo) {
        try {
            console.log('Verifying GitHub token...');

            // First check if we can access the user info
            const userResponse = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!userResponse.ok) {
                console.error('Failed to verify user with token:', userResponse.status);
                return { success: false, message: 'Invalid token or insufficient permissions' };
            }

            const userData = await userResponse.json();
            console.log('GitHub user verified:', userData.login);

            // Then check if we can access the repository
            const repoResponse = await fetch(`https://api.github.com/repos/${username}/${repo}`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!repoResponse.ok) {
                console.error('Failed to access repository:', repoResponse.status);
                return {
                    success: false,
                    message: `Cannot access repository ${username}/${repo}. Make sure it exists and your token has access.`
                };
            }

            const repoData = await repoResponse.json();
            console.log('Repository access verified:', repoData.full_name);

            // Finally, check if we have write access by attempting to get the contents
            const contentsUrl = `https://api.github.com/repos/${username}/${repo}/contents`;
            console.log('Checking repository contents access:', contentsUrl);

            const contentsResponse = await fetch(contentsUrl, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!contentsResponse.ok) {
                console.error('Failed to access repository contents:', contentsResponse.status);
                return {
                    success: false,
                    message: 'Cannot access repository contents. Make sure your token has the "repo" scope.'
                };
            }

            return {
                success: true,
                message: `Successfully verified access to ${username}/${repo}`
            };
        } catch (error) {
            console.error('Error verifying GitHub token:', error);
            return { success: false, message: `Error: ${error.message}` };
        }
    }

    document.getElementById('saveGitHubSettings').addEventListener('click', async function() {
        const token = document.getElementById('githubToken').value.trim();
        const username = document.getElementById('githubUsername').value.trim();
        const repo = document.getElementById('githubRepo').value.trim();

        if (!token || !username || !repo) {
            showAdminMessage('Please fill in all GitHub settings', true);
            return;
        }

        // Show loading message with spinner
        adminMessage.innerHTML = 'Verifying GitHub settings... <span class="loading-indicator"></span>';
        adminMessage.className = 'admin-message success';
        adminMessage.style.display = 'block';

        // Verify the token has necessary permissions
        const verification = await verifyGitHubToken(token, username, repo);

        if (verification.success) {
            localStorage.setItem('github_token', token);
            localStorage.setItem('github_username', username);
            localStorage.setItem('github_repo', repo);

            // Clear the token field for security
            document.getElementById('githubToken').value = '';

            showAdminMessage('GitHub settings saved successfully! ' + verification.message);
        } else {
            showAdminMessage('GitHub settings error: ' + verification.message, true);
        }
    });

    document.getElementById('clearGitHubSettings').addEventListener('click', function() {
        if (confirm('Are you sure you want to clear your GitHub settings?')) {
            localStorage.removeItem('github_token');
            localStorage.removeItem('github_username');
            localStorage.removeItem('github_repo');

            document.getElementById('githubToken').value = '';
            document.getElementById('githubUsername').value = '';
            document.getElementById('githubRepo').value = '';

            showAdminMessage('GitHub settings cleared');
        }
    });

    // Handle Back to Top button
    document.getElementById('backToTop').addEventListener('click', function() {
        document.getElementById('adminContent').scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Show/hide Back to Top button and update active nav item based on scroll position
    document.getElementById('adminContent').addEventListener('scroll', function() {
        const backToTop = document.getElementById('backToTop');
        if (this.scrollTop > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }

        // Update active navigation item
        const sections = [
            { id: 'player-management', navIndex: 0 },
            { id: 'data-management', navIndex: 1 },
            { id: 'github-integration', navIndex: 2 }
        ];

        const navItems = document.querySelectorAll('.admin-nav-item');

        // Find which section is currently most visible
        let activeSection = 0;
        let maxVisibility = 0;

        sections.forEach((section, index) => {
            const element = document.getElementById(section.id);
            if (element) {
                const rect = element.getBoundingClientRect();
                const adminContentRect = this.getBoundingClientRect();

                // Calculate how much of the section is visible
                const visibleTop = Math.max(rect.top, adminContentRect.top);
                const visibleBottom = Math.min(rect.bottom, adminContentRect.bottom);
                const visibleHeight = Math.max(0, visibleBottom - visibleTop);

                if (visibleHeight > maxVisibility) {
                    maxVisibility = visibleHeight;
                    activeSection = section.navIndex;
                }
            }
        });

        // Update active class
        navItems.forEach((item, index) => {
            if (index === activeSection) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    });

    // Load saved GitHub settings when admin panel opens
    adminButton.addEventListener('click', async () => {
        adminModal.style.display = 'flex';
        // Force reflow to ensure transition works
        void adminModal.offsetWidth;
        adminModal.classList.add('visible');
        clearAdminForm();

        // Load GitHub settings
        const token = localStorage.getItem('github_token');
        const username = localStorage.getItem('github_username') || '';
        const repo = localStorage.getItem('github_repo') || '';

        document.getElementById('githubUsername').value = username;
        document.getElementById('githubRepo').value = repo;
        // Don't load the token for security reasons

        // Check if GitHub settings are valid
        if (token && username && repo) {
            try {
                // Quick check if token is still valid
                const response = await fetch('https://api.github.com/user', {
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });

                if (response.ok) {
                    const userData = await response.json();
                    console.log('GitHub token is valid for user:', userData.login);

                    // Show a small indicator that GitHub is connected
                    const githubStatus = document.createElement('div');
                    githubStatus.style.cssText = `
                        background: rgba(0, 255, 0, 0.1);
                        border: 1px solid rgba(0, 255, 0, 0.3);
                        color: #00ff00;
                        padding: 5px 10px;
                        border-radius: 5px;
                        font-size: 0.9rem;
                        margin-top: 5px;
                        text-align: center;
                    `;
                    githubStatus.textContent = `✓ GitHub connected as ${userData.login}`;

                    // Add it after the GitHub settings title
                    const titleElement = document.querySelector('h3[style*="color: var(--light-blue)"]');
                    if (titleElement) {
                        titleElement.insertAdjacentElement('afterend', githubStatus);
                    }
                } else {
                    console.warn('GitHub token is invalid or expired');
                }
            } catch (error) {
                console.error('Error checking GitHub token:', error);
            }
        }
    });

    // Add handler for pushing current data to GitHub
    document.getElementById('pushToGitHub').addEventListener('click', async function() {
        try {
            // Check if GitHub settings are configured
            const token = localStorage.getItem('github_token');
            const username = localStorage.getItem('github_username');
            const repo = localStorage.getItem('github_repo');

            if (!token || !username || !repo) {
                showAdminMessage('Please configure GitHub settings first', true);
                return;
            }

            if (confirm('Are you sure you want to push the current data to GitHub?')) {
                adminMessage.innerHTML = 'Pushing data to GitHub... <span class="loading-indicator"></span>';
                adminMessage.className = 'admin-message success';
                adminMessage.style.display = 'block';
                const result = await saveToGitHub(allPlayers);
                if (result) {
                    showAdminMessage('Successfully pushed data to GitHub!');
                }
            }
        } catch (error) {
            console.error('Error pushing to GitHub:', error);
            showAdminMessage('Error pushing to GitHub: ' + error.message, true);
        }
    });

    // Add handler for checking data.json status
    document.getElementById('checkDataJson').addEventListener('click', async function() {
        try {
            // Check if GitHub settings are configured
            const token = localStorage.getItem('github_token');
            const username = localStorage.getItem('github_username');
            const repo = localStorage.getItem('github_repo');

            if (!token || !username || !repo) {
                showAdminMessage('Please configure GitHub settings first', true);
                return;
            }

            showAdminMessage('Checking data.json status...', false);

            // Check if data.json exists
            const path = 'data.json';
            const url = `https://api.github.com/repos/${username}/${repo}/contents/${path}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.status === 404) {
                showAdminMessage('data.json file does not exist in the repository. Use the "Create data.json" button to create it.', true);
            } else if (response.ok) {
                const fileInfo = await response.json();
                showAdminMessage(`data.json exists in the repository. SHA: ${fileInfo.sha.substring(0, 7)}...`);

                // Try to decode and show some info about the file
                try {
                    const content = atob(fileInfo.content);
                    const data = JSON.parse(content);
                    showAdminMessage(`data.json contains ${data.length} player records.`);
                } catch (e) {
                    console.error('Error parsing file content:', e);
                }
            } else {
                const errorText = await response.text();
                console.error('GitHub API error:', errorText);
                showAdminMessage(`Error checking data.json: ${response.status} ${response.statusText}`, true);
            }
        } catch (error) {
            console.error('Error checking data.json:', error);
            showAdminMessage('Error checking data.json: ' + error.message, true);
        }
    });

    // Add handler for opening GitHub repository
    document.getElementById('openGitHubRepo').addEventListener('click', function() {
        const username = localStorage.getItem('github_username');
        const repo = localStorage.getItem('github_repo');

        if (!username || !repo) {
            showAdminMessage('Please configure GitHub settings first', true);
            return;
        }

        const repoUrl = `https://github.com/${username}/${repo}`;
        window.open(repoUrl, '_blank');
    });

    // Add handler for viewing data.json
    document.getElementById('viewDataJson').addEventListener('click', function() {
        const username = localStorage.getItem('github_username');
        const repo = localStorage.getItem('github_repo');

        if (!username || !repo) {
            showAdminMessage('Please configure GitHub settings first', true);
            return;
        }

        const dataJsonUrl = `https://github.com/${username}/${repo}/blob/main/data.json`;
        window.open(dataJsonUrl, '_blank');
    });

    // Add handler for creating data.json
    document.getElementById('createDataJson').addEventListener('click', async function() {
        try {
            // Check if GitHub settings are configured
            const token = localStorage.getItem('github_token');
            const username = localStorage.getItem('github_username');
            const repo = localStorage.getItem('github_repo');

            if (!token || !username || !repo) {
                showAdminMessage('Please configure GitHub settings first', true);
                return;
            }

            if (!confirm('This will create a new data.json file in your repository with the current player data. Continue?')) {
                return;
            }

            showAdminMessage('Creating data.json file...', false);

            // Check if data.json already exists
            const path = 'data.json';
            const checkUrl = `https://api.github.com/repos/${username}/${repo}/contents/${path}`;

            const checkResponse = await fetch(checkUrl, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (checkResponse.ok) {
                showAdminMessage('data.json already exists in the repository. Use "Push Current Data" to update it.', true);
                return;
            }

            // Helper function to safely encode Unicode strings to base64
            function utf8ToBase64(str) {
                return btoa(unescape(encodeURIComponent(str)));
            }

            // Create the file
            const content = utf8ToBase64(JSON.stringify(allPlayers, null, 2));

            const createResponse = await fetch(checkUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: 'Create data.json via web interface',
                    content: content
                })
            });

            if (createResponse.ok) {
                const result = await createResponse.json();
                console.log('File created successfully:', result);
                showAdminMessage('data.json file created successfully in your repository!');
            } else {
                const errorText = await createResponse.text();
                console.error('GitHub API error:', errorText);
                showAdminMessage(`Error creating data.json: ${createResponse.status} ${createResponse.statusText}`, true);
            }
        } catch (error) {
            console.error('Error creating data.json:', error);
            showAdminMessage('Error creating data.json: ' + error.message, true);
        }
    });

    // Data import/export functionality
    document.getElementById('exportData').addEventListener('click', function() {
        try {
            const dataStr = JSON.stringify(allPlayers, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const dataUrl = URL.createObjectURL(dataBlob);

            const downloadLink = document.createElement('a');
            downloadLink.href = dataUrl;
            downloadLink.download = `No-Co_data_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            showAdminMessage('Data exported successfully!');
        } catch (error) {
            console.error('Error exporting data:', error);
            showAdminMessage('Error exporting data', true);
        }
    });

    document.getElementById('importData').addEventListener('click', function() {
        document.getElementById('fileInput').click();
    });

    document.getElementById('fileInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Show loading indicator
        showAdminMessage('Reading file...', false);

        const reader = new FileReader();
        reader.onload = async function(event) {
            try {
                const importedData = JSON.parse(event.target.result);

                // Validate the data structure
                if (!Array.isArray(importedData)) {
                    throw new Error('Invalid data format: not an array');
                }

                // Check if each item has the required fields
                for (const item of importedData) {
                    if (!item.ign || !item.tier_earned) {
                        throw new Error('Invalid data format: missing required fields');
                    }
                }

                showAdminMessage(`Found ${importedData.length} player records. Processing...`, false);

                // Confirm before overwriting
                if (confirm(`Import ${importedData.length} player records? This will replace your current data.`)) {
                    // Add UUIDs if missing
                    showAdminMessage('Adding UUIDs to players...', false);
                    for (const player of importedData) {
                        if (!player.uuid) {
                            try {
                                player.uuid = await getUUID(player.ign);
                            } catch (e) {
                                console.warn(`Couldn't get UUID for ${player.ign}:`, e);
                                // Generate a placeholder UUID
                                player.uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                                    return v.toString(16);
                                });
                            }
                        }
                    }

                    allPlayers = importedData;
                    updateUI();

                    // Push to GitHub
                    await saveToGitHub(allPlayers);

                    // Show success message
                    showAdminMessage(`Imported ${importedData.length} player records successfully!`);
                } else {
                    showAdminMessage('Import cancelled', true);
                }
            } catch (error) {
                console.error('Error importing data:', error);
                showAdminMessage('Error importing data: ' + error.message, true);
            }

            // Reset the file input
            e.target.value = '';
        };

        reader.onerror = function() {
            showAdminMessage('Error reading file', true);
            e.target.value = '';
        };

        reader.readAsText(file);
    });



    document.getElementById('clearData').addEventListener('click', function() {
        if (confirm('Are you sure you want to RESET ALL DATA? This cannot be undone!')) {
            if (confirm('FINAL WARNING: All player data will be permanently deleted. Continue?')) {
                // Clear the data
                allPlayers = [];
                updateUI();
                showAdminMessage('All data has been reset. Reload the page to restore data from GitHub.');
            }
        }
    });

    document.getElementById('debugData').addEventListener('click', async function() {
        try {
            // Create debug info
            const debugInfo = {
                timestamp: new Date().toISOString(),
                currentData: {
                    playerCount: allPlayers.length,
                    hasKytsue: allPlayers.some(p => p.ign.toLowerCase() === 'kytsue'),
                    playerNames: allPlayers.map(p => p.ign)
                },
                dataJson: {
                    fetchAttempt: null,
                    status: null,
                    playerCount: null,
                    hasKytsue: null,
                    error: null
                }
            };

            // Try to fetch data.json
            try {
                debugInfo.dataJson.fetchAttempt = true;
                const response = await fetch('data.json?nocache=' + new Date().getTime());
                debugInfo.dataJson.status = response.status;

                if (response.ok) {
                    const data = await response.json();
                    debugInfo.dataJson.playerCount = data.length;
                    debugInfo.dataJson.hasKytsue = data.some(p => p.ign.toLowerCase() === 'kytsue');
                    debugInfo.dataJson.playerNames = data.map(p => p.ign);
                }
            } catch (error) {
                debugInfo.dataJson.error = error.message;
            }

            // Display debug info
            console.log('Debug Info:', debugInfo);

            // Create a formatted display
            const debugDisplay = document.createElement('div');
            debugDisplay.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.95);
                color: white;
                padding: 20px;
                border-radius: 10px;
                max-width: 80%;
                max-height: 80%;
                overflow: auto;
                z-index: 2000;
                font-family: monospace;
                white-space: pre-wrap;
                border: 2px solid var(--light-blue);
            `;

            debugDisplay.innerHTML = `
                <h3 style="color: var(--light-blue);">Debug Information</h3>
                <pre>${JSON.stringify(debugInfo, null, 2)}</pre>
                <button id="closeDebug" style="
                    background: var(--light-blue);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 5px;
                    color: white;
                    cursor: pointer;
                    margin-top: 15px;
                ">Close</button>
                <button id="copyDebug" style="
                    background: var(--dark-blue);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 5px;
                    color: white;
                    cursor: pointer;
                    margin-top: 15px;
                    margin-left: 10px;
                ">Copy to Clipboard</button>
            `;

            document.body.appendChild(debugDisplay);

            document.getElementById('closeDebug').addEventListener('click', function() {
                document.body.removeChild(debugDisplay);
            });

            document.getElementById('copyDebug').addEventListener('click', function() {
                navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))
                    .then(() => {
                        this.textContent = 'Copied!';
                        setTimeout(() => {
                            this.textContent = 'Copy to Clipboard';
                        }, 2000);
                    })
                    .catch(err => {
                        console.error('Failed to copy: ', err);
                        this.textContent = 'Failed to copy';
                    });
            });

            // Also add a direct way to add Kytsue if missing
            if (!debugInfo.currentData.hasKytsue) {
                const addKytsueButton = document.createElement('button');
                addKytsueButton.textContent = 'Add Kytsue to Data';
                addKytsueButton.style.cssText = `
                    background: #4CAF50;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 5px;
                    color: white;
                    cursor: pointer;
                    margin-top: 15px;
                    margin-left: 10px;
                `;
                debugDisplay.appendChild(addKytsueButton);

                addKytsueButton.addEventListener('click', async function() {
                    try {
                        const uuid = await getUUID('kytsue');
                        allPlayers.push({
                            tier_before: "Unranked",
                            tier_earned: "HT2",
                            ign: "kytsue",
                            tester: "729405047644880968",
                            timestamp: "2025-03-08 19:33:31.842327+00:00",
                            uuid: uuid
                        });

                        updateUI();
                        await saveToGitHub(allPlayers);

                        this.textContent = 'Kytsue Added!';
                        this.disabled = true;
                        this.style.background = '#888';
                    } catch (error) {
                        console.error('Error adding Kytsue:', error);
                        this.textContent = 'Error Adding Kytsue';
                        this.style.background = '#F44336';
                    }
                });
            }

        } catch (error) {
            console.error('Error generating debug info:', error);
            showAdminMessage('Error generating debug info: ' + error.message, true);
        }
    });

    // Add loading indicator
    function showLoading(show) {
        const container = document.querySelector('.container');
        let loadingEl = document.getElementById('loadingIndicator');

        if (show) {
            if (!loadingEl) {
                loadingEl = document.createElement('div');
                loadingEl.id = 'loadingIndicator';
                loadingEl.style.cssText = `
                    position: fixed;
                    top: 10px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 5px 15px;
                    border-radius: 20px;
                    font-size: 14px;
                    z-index: 100;
                    opacity: 0;
                    transition: opacity 0.3s;
                `;
                loadingEl.textContent = 'Aggiornamento dati...';
                document.body.appendChild(loadingEl);

                // Force reflow
                void loadingEl.offsetWidth;
                loadingEl.style.opacity = '1';
            }
        } else if (loadingEl) {
            loadingEl.style.opacity = '0';
            setTimeout(() => {
                if (loadingEl.parentNode) {
                    loadingEl.parentNode.removeChild(loadingEl);
                }
            }, 300);
        }
    }

    // Throttle data loading to prevent excessive requests
    let isLoadingData = false;
    let lastLoadTime = 0;
    const LOAD_THROTTLE_TIME = 30000; // 30 seconds minimum between loads

    async function throttledLoadData() {
        if (isLoadingData) return;

        const now = Date.now();
        if (now - lastLoadTime < LOAD_THROTTLE_TIME) {
            console.log('Throttling data load, last load was', Math.round((now - lastLoadTime)/1000), 'seconds ago');
            return;
        }

        isLoadingData = true;
        showLoading(true);

        try {
            await loadData();
            lastLoadTime = Date.now();
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            isLoadingData = false;
            showLoading(false);
        }
    }

    // Add filter button event listeners
    document.getElementById('filterAll').addEventListener('click', function() {
        if (currentFilter !== 'all') {
            currentFilter = 'all';
            updateUI();
        }
    });

    document.getElementById('filterAnemoia').addEventListener('click', function() {
        if (currentFilter !== 'Anemoia') {
            currentFilter = 'Anemoia';
            updateUI();
        }
    });

    document.getElementById('filterBedwars').addEventListener('click', function() {
        if (currentFilter !== 'bedwars') {
            currentFilter = 'bedwars';
            updateUI();
        }
    });

    // Load data every 5 minutes to reduce server load and improve performance
    setInterval(throttledLoadData, 300000);
    throttledLoadData();

    // CPS Counter functionality
    const cpsClickArea = document.getElementById('cpsClickArea');
    const cpsValue = document.getElementById('cpsValue');
    const cpsTimer = document.getElementById('cpsTimer');
    const cpsTimerValue = document.getElementById('cpsTimerValue');
    const highestCpsEl = document.getElementById('highestCps');
    const lastTestCpsEl = document.getElementById('lastTestCps');
    const totalClicksEl = document.getElementById('totalClicks');
    const cpsResetBtn = document.getElementById('cpsResetBtn');
    const cpsModeButtons = document.querySelectorAll('.cps-mode-btn');

    let clicks = [];
    let cpsMode = 'realtime';
    let testActive = false;
    let testInterval;
    let testTimeout;
    let totalClicks = parseInt(localStorage.getItem('totalClicks') || '0');
    let highestCps = parseFloat(localStorage.getItem('highestCps') || '0');
    let lastTestCps = parseFloat(localStorage.getItem('lastTestCps') || '0');

    // Update stats display
    function updateCpsStats() {
        totalClicksEl.textContent = totalClicks;
        highestCpsEl.textContent = highestCps.toFixed(1);
        lastTestCpsEl.textContent = lastTestCps.toFixed(1);
    }

    // Initialize stats
    updateCpsStats();

    // Mode selection
    cpsModeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            if (testActive) return;

            cpsModeButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            cpsMode = this.getAttribute('data-mode');

            if (cpsMode === 'fivesec') {
                cpsTimer.style.display = 'block';
                cpsTimerValue.textContent = '5.0';
            } else {
                cpsTimer.style.display = 'none';
                cpsValue.textContent = '0';
            }
        });
    });

    // Real-time CPS calculation - optimized
    function calculateRealtimeCps() {
        const now = Date.now();
        const oneSecondAgo = now - 1000;
        // Keep only clicks from the last second - more efficient filtering
        clicks = clicks.filter(time => time > oneSecondAgo);
        return clicks.length;
    }

    // Throttle function to limit how often a function can be called
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Throttled localStorage update to reduce writes
    const saveToLocalStorage = throttle(function() {
        localStorage.setItem('totalClicks', totalClicks.toString());
        if (highestCps > parseFloat(localStorage.getItem('highestCps') || '0')) {
            localStorage.setItem('highestCps', highestCps.toString());
        }
    }, 1000); // Only save once per second at most

    // Handle clicks - optimized
    cpsClickArea.addEventListener('mousedown', function(e) {
        // Prevent text selection
        e.preventDefault();

        const now = Date.now();
        totalClicks++;

        if (cpsMode === 'realtime') {
            // Add click timestamp
            clicks.push(now);

            // Calculate and display CPS
            const currentCps = calculateRealtimeCps();
            cpsValue.textContent = currentCps;

            // Update highest CPS if needed
            if (currentCps > highestCps) {
                highestCps = currentCps;
            }

            // Update stats display
            updateCpsStats();

            // Save to localStorage (throttled)
            saveToLocalStorage();

        } else if (cpsMode === 'fivesec' && !testActive) {
            // Start 5-second test
            startCpsTest();

        } else if (testActive) {
            // Count click during active test
            clicks.push(now);

            // Update current CPS display - use requestAnimationFrame for better performance
            requestAnimationFrame(() => {
                const elapsedTime = (now - testStartTime) / 1000;
                if (elapsedTime > 0) {
                    const currentCps = clicks.length / elapsedTime;
                    cpsValue.textContent = currentCps.toFixed(1);
                }
                updateCpsStats();
            });

            // Save to localStorage (throttled)
            saveToLocalStorage();
        }
    });

    // Start 5-second CPS test - optimized
    let testStartTime;
    let animationFrameId;

    function startCpsTest() {
        testActive = true;
        clicks = [];
        cpsValue.textContent = '0';
        cpsClickArea.classList.add('active');

        // Set start time
        testStartTime = Date.now();
        const endTime = testStartTime + 5000;

        // Use requestAnimationFrame for smoother updates
        function updateTimer() {
            const now = Date.now();
            const timeLeft = Math.max(0, (endTime - now) / 1000);

            // Only update DOM when needed
            if (timeLeft > 0) {
                cpsTimerValue.textContent = timeLeft.toFixed(1);

                // Update current CPS
                if (clicks.length > 0) {
                    const elapsedTime = (now - testStartTime) / 1000;
                    const currentCps = clicks.length / elapsedTime;
                    cpsValue.textContent = currentCps.toFixed(1);
                }

                animationFrameId = requestAnimationFrame(updateTimer);
            } else {
                // Test is complete
                endCpsTest();
            }
        }

        // Start the animation frame loop
        animationFrameId = requestAnimationFrame(updateTimer);
    }

    // End 5-second CPS test - optimized
    function endCpsTest() {
        testActive = false;
        cancelAnimationFrame(animationFrameId);

        cpsClickArea.classList.remove('active');
        cpsTimerValue.textContent = '5.0';

        // Calculate final CPS
        const finalCps = clicks.length / 5;
        cpsValue.textContent = finalCps.toFixed(1);

        // Update last test result
        lastTestCps = finalCps;

        // Batch localStorage updates
        const updates = {
            lastTestCps: finalCps.toString(),
            totalClicks: totalClicks.toString()
        };

        // Update highest CPS if needed
        if (finalCps > highestCps) {
            highestCps = finalCps;
            updates.highestCps = highestCps.toString();
        }

        // Batch write to localStorage
        Object.entries(updates).forEach(([key, value]) => {
            localStorage.setItem(key, value);
        });

        // Update stats display
        updateCpsStats();
    }

    // Reset stats
    cpsResetBtn.addEventListener('click', function() {
        if (testActive) return;

        totalClicks = 0;
        highestCps = 0;
        lastTestCps = 0;

        localStorage.setItem('totalClicks', '0');
        localStorage.setItem('highestCps', '0');
        localStorage.setItem('lastTestCps', '0');

        updateCpsStats();
        cpsValue.textContent = '0';
    });

    // Theme toggle and selector functionality
    const themeToggle = document.getElementById('themeToggle');
    const themeOptions = document.querySelectorAll('.theme-option');

    // Theme toggle (light/dark)
    themeToggle.addEventListener('click', function() {
        const body = document.body;
        const isDarkTheme = !body.classList.contains('light-theme');

        if (isDarkTheme) {
            // Switch to light theme
            body.classList.add('light-theme');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i><span>Tema Chiaro</span>';
            localStorage.setItem('theme', 'light');
        } else {
            // Switch to dark theme
            body.classList.remove('light-theme');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i><span>Tema Scuro</span>';
            localStorage.setItem('theme', 'dark');
        }

        // Refresh charts if they exist and stats page is visible
        if (document.getElementById('page-stats').style.display === 'block') {
            if (window.tierChart) {
                createTierDistributionChart();
            }
            if (window.activityChart) {
                createMonthlyActivityChart();
            }
        }
    });

    // Color theme selector - optimized with event delegation
    const themeSelector = document.querySelector('.theme-selector');
    if (themeSelector) {
        themeSelector.addEventListener('click', function(e) {
            const option = e.target.closest('.theme-option');
            if (!option) return;

            const theme = option.getAttribute('data-theme');

            // Remove all theme classes
            document.body.classList.remove('theme-neon', 'theme-ocean', 'theme-sunset', 'theme-forest');

            // Remove active class from all options
            document.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('active'));

            // Add active class to clicked option
            option.classList.add('active');

            // Apply selected theme
            if (theme !== 'default') {
                document.body.classList.add('theme-' + theme);
                localStorage.setItem('colorTheme', theme);
            } else {
                localStorage.setItem('colorTheme', 'default');
            }

            // Use requestAnimationFrame for chart updates to avoid layout thrashing
            if (document.getElementById('page-stats').style.display === 'block') {
                requestAnimationFrame(() => {
                    if (window.tierChart) {
                        createTierDistributionChart();
                    }
                    if (window.activityChart) {
                        createMonthlyActivityChart();
                    }
                });
            }
        });
    }

    // Check for saved theme preferences
    const savedTheme = localStorage.getItem('theme');
    const savedColorTheme = localStorage.getItem('colorTheme');

    // Apply light/dark theme
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i><span>Tema Chiaro</span>';
    }

    // Apply color theme
    if (savedColorTheme && savedColorTheme !== 'default') {
        document.body.classList.add('theme-' + savedColorTheme);
        themeOptions.forEach(option => {
            if (option.getAttribute('data-theme') === savedColorTheme) {
                option.classList.add('active');
            }
        });
    } else {
        // Set default theme as active
        themeOptions.forEach(option => {
            if (option.getAttribute('data-theme') === 'default') {
                option.classList.add('active');
            }
        });
    }

    // Navigation functionality
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page-content');

    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetPage = this.getAttribute('data-page');

            // Update active nav item
            navItems.forEach(navItem => navItem.classList.remove('active'));
            this.classList.add('active');

            // Show target page, hide others
            pages.forEach(page => {
                if (page.id === `page-${targetPage}`) {
                    page.style.display = 'block';
                } else {
                    page.style.display = 'none';
                }
            });

            // Close sidebar on mobile after navigation
            if (window.innerWidth <= 992) {
                document.getElementById('sidebar').classList.remove('active');
            }

            // Load page-specific data
            if (targetPage === 'stats') {
                loadStats();
            } else if (targetPage === 'activity') {
                loadActivity();
            } else if (targetPage === 'leaderboard-xp') {
                loadXPLeaderboard();
            } else if (targetPage === 'matchmaking') {
                loadMatchmakingStatus();
            }
        });
    });

    // Mobile sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    sidebarToggle.addEventListener('click', function() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('active');
    });

    // Stats page functionality
    function loadStats() {
        // Calculate statistics from player data
        const totalPlayers = allPlayers.length;
        const AnemoiaPlayers = allPlayers.filter(player => player.Anemoia).length;

        // Count tests this month
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        const testsThisMonth = allPlayers.filter(player => {
            const timestamp = new Date(player.timestamp);
            return timestamp.getMonth() === thisMonth && timestamp.getFullYear() === thisYear;
        }).length;

        // Update stats cards
        document.getElementById('totalPlayersCount').textContent = totalPlayers;
        document.getElementById('AnemoiaCount').textContent = AnemoiaPlayers;
        document.getElementById('testsThisMonth').textContent = testsThisMonth;

        // Create tier distribution chart
        createTierDistributionChart();

        // Create monthly activity chart
        createMonthlyActivityChart();
    }

    function createTierDistributionChart() {
        const tierCounts = {};
        const tierOrder = [
            "HT1", "LT1",
            "HT2", "LT2",
            "HT3", "LT3",
            "HT4", "LT4",
            "HT5", "LT5"
        ];

        // Initialize counts for all tiers to ensure they all appear in the chart
        tierOrder.forEach(tier => {
            tierCounts[tier] = 0;
        });

        // Count players in each tier
        allPlayers.forEach(player => {
            const tier = player.tier_earned;
            if (tier && tierOrder.includes(tier)) {
                tierCounts[tier] = (tierCounts[tier] || 0) + 1;
            }
        });

        // Prepare data for chart using the predefined order
        const labels = tierOrder;
        const data = labels.map(tier => tierCounts[tier]);

        // Create chart
        const ctx = document.getElementById('tierDistributionChart').getContext('2d');

        // Destroy existing chart if it exists
        if (window.tierChart) {
            window.tierChart.destroy();
        }

        // Check if light theme is active
        const isLightTheme = document.body.classList.contains('light-theme');

        // Create a gradient for the bars based on theme
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        if (isLightTheme) {
            gradient.addColorStop(0, 'rgba(79, 70, 229, 0.8)');
            gradient.addColorStop(1, 'rgba(129, 140, 248, 0.8)');
        } else {
            gradient.addColorStop(0, 'rgba(102, 163, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(79, 70, 229, 0.8)');
        }

        // Set colors based on theme
        const textColor = isLightTheme ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)';
        const gridColor = isLightTheme ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
        const titleColor = isLightTheme ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)';
        const tooltipBgColor = isLightTheme ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)';
        const tooltipTextColor = isLightTheme ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 1)';
        const borderColor = isLightTheme ? 'rgba(79, 70, 229, 1)' : 'rgba(102, 163, 255, 1)';

        window.tierChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Giocatori per Tier',
                    data: data,
                    backgroundColor: gradient,
                    borderColor: borderColor,
                    borderWidth: 1,
                    borderRadius: 6,
                    barPercentage: 0.7,
                    categoryPercentage: 0.8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0,
                            color: textColor
                        },
                        grid: {
                            color: gridColor
                        }
                    },
                    x: {
                        ticks: {
                            color: textColor
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: textColor
                        }
                    },
                    title: {
                        display: true,
                        text: 'Distribuzione dei Tier',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        color: titleColor,
                        padding: {
                            top: 10,
                            bottom: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: tooltipBgColor,
                        titleColor: tooltipTextColor,
                        bodyColor: tooltipTextColor,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.y} giocatori`;
                            }
                        }
                    }
                }
            }
        });
    }

    function createMonthlyActivityChart() {
        // Group tests by month
        const monthlyTests = {};
        const monthNames = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

        allPlayers.forEach(player => {
            if (player.timestamp) {
                const timestamp = new Date(player.timestamp);
                if (!isNaN(timestamp.getTime())) { // Check if date is valid
                    const monthYear = `${timestamp.getFullYear()}-${timestamp.getMonth() + 1}`;
                    monthlyTests[monthYear] = (monthlyTests[monthYear] || 0) + 1;
                }
            }
        });

        // Get last 12 months
        const now = new Date();
        const labels = [];
        const data = [];

        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthYear = `${d.getFullYear()}-${d.getMonth() + 1}`;
            const monthName = monthNames[d.getMonth()];

            labels.push(monthName);
            data.push(monthlyTests[monthYear] || 0);
        }

        // Create chart
        const ctx = document.getElementById('monthlyActivityChart').getContext('2d');

        // Destroy existing chart if it exists
        if (window.activityChart) {
            window.activityChart.destroy();
        }

        // Check if light theme is active
        const isLightTheme = document.body.classList.contains('light-theme');

        // Set colors based on theme
        const textColor = isLightTheme ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)';
        const gridColor = isLightTheme ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
        const titleColor = isLightTheme ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)';
        const tooltipBgColor = isLightTheme ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)';
        const tooltipTextColor = isLightTheme ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 1)';

        // Create gradient for the area based on theme
        const areaGradient = ctx.createLinearGradient(0, 0, 0, 400);
        let borderColor, pointBgColor;

        if (isLightTheme) {
            areaGradient.addColorStop(0, 'rgba(249, 115, 22, 0.4)');
            areaGradient.addColorStop(1, 'rgba(249, 115, 22, 0.0)');
            borderColor = 'rgba(234, 88, 12, 1)';
            pointBgColor = 'rgba(234, 88, 12, 1)';
        } else {
            areaGradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
            areaGradient.addColorStop(1, 'rgba(255, 215, 0, 0.0)');
            borderColor = 'rgba(255, 215, 0, 1)';
            pointBgColor = 'rgba(255, 215, 0, 1)';
        }

        window.activityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Test Mensili',
                    data: data,
                    backgroundColor: areaGradient,
                    borderColor: borderColor,
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: pointBgColor,
                    pointBorderColor: isLightTheme ? '#fff' : '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0,
                            color: textColor
                        },
                        grid: {
                            color: gridColor
                        }
                    },
                    x: {
                        ticks: {
                            color: textColor
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: textColor
                        }
                    },
                    title: {
                        display: true,
                        text: 'Attività Mensile',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        color: titleColor,
                        padding: {
                            top: 10,
                            bottom: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: tooltipBgColor,
                        titleColor: tooltipTextColor,
                        bodyColor: tooltipTextColor,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.y} test`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Activity page functionality
    function loadActivity() {
        const activityContainer = document.getElementById('activityContainer');

        // Sort players by timestamp (most recent first)
        const recentActivity = [...allPlayers].sort((a, b) => {
            return new Date(b.timestamp) - new Date(a.timestamp);
        }).slice(0, 20); // Get most recent 20 activities

        if (recentActivity.length === 0) {
            activityContainer.innerHTML = '<div class="activity-empty">Nessuna attività recente</div>';
            return;
        }

        let activityHTML = '<div class="activity-timeline">';

        recentActivity.forEach(activity => {
            const timestamp = new Date(activity.timestamp);
            const formattedDate = timestamp.toLocaleDateString('it-IT', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });

            const formattedTime = timestamp.toLocaleTimeString('it-IT', {
                hour: '2-digit',
                minute: '2-digit'
            });

            const tierChange = activity.tier_before !== activity.tier_earned;
            const tierUpgrade = tierChange && getTierValue(activity.tier_earned) > getTierValue(activity.tier_before);
            const tierDowngrade = tierChange && getTierValue(activity.tier_earned) < getTierValue(activity.tier_before);

            let statusIcon = '';
            let statusClass = '';

            if (tierUpgrade) {
                statusIcon = '<i class="fas fa-arrow-up"></i>';
                statusClass = 'activity-upgrade';
            } else if (tierDowngrade) {
                statusIcon = '<i class="fas fa-arrow-down"></i>';
                statusClass = 'activity-downgrade';
            } else {
                statusIcon = '<i class="fas fa-equals"></i>';
                statusClass = 'activity-same';
            }

            activityHTML += `
                <div class="activity-item ${statusClass}">
                    <div class="activity-time">
                        <div class="activity-date">${formattedDate}</div>
                        <div class="activity-hour">${formattedTime}</div>
                    </div>
                    <div class="activity-icon">${statusIcon}</div>
                    <div class="activity-content">
                        <div class="activity-title">
                            <span class="activity-player">${activity.ign}</span>
                            ${activity.Anemoia ? '<span class="activity-Anemoia"><i class="fas fa-crown"></i></span>' : ''}
                        </div>
                        <div class="activity-details">
                            <span class="activity-tier-before">${activity.tier_before}</span>
                            <span class="activity-arrow">→</span>
                            <span class="activity-tier-after">${activity.tier_earned}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        activityHTML += '</div>';
        activityContainer.innerHTML = activityHTML;
    }

    // Helper function to get numeric value of tier for comparison
    function getTierValue(tier) {
        const tierMap = {
            'Unranked': 0,
            'LT5': 1, 'HT5': 2,
            'LT4': 3, 'HT4': 4,
            'LT3': 5, 'HT3': 6,
            'LT2': 7, 'HT2': 8,
            'LT1': 9, 'HT1': 10
        };

        return tierMap[tier] || 0;
    }

    // XP Leaderboard functionality
    function loadXPLeaderboard() {
        const container = document.getElementById('xpLeaderboardContainer');

        // This would normally fetch data from the server
        // For demo purposes, we'll create mock data
        const mockXPData = [
            { id: 1, username: 'Player1', xp: 5240, level: 12, avatar: 'https://i.pravatar.cc/100?img=1' },
            { id: 2, username: 'Player2', xp: 4980, level: 11, avatar: 'https://i.pravatar.cc/100?img=2' },
            { id: 3, username: 'Player3', xp: 4750, level: 10, avatar: 'https://i.pravatar.cc/100?img=3' },
            { id: 4, username: 'Player4', xp: 3890, level: 9, avatar: 'https://i.pravatar.cc/100?img=4' },
            { id: 5, username: 'Player5', xp: 3540, level: 8, avatar: 'https://i.pravatar.cc/100?img=5' },
            { id: 6, username: 'Player6', xp: 3210, level: 7, avatar: 'https://i.pravatar.cc/100?img=6' },
            { id: 7, username: 'Player7', xp: 2980, level: 7, avatar: 'https://i.pravatar.cc/100?img=7' },
            { id: 8, username: 'Player8', xp: 2450, level: 6, avatar: 'https://i.pravatar.cc/100?img=8' },
            { id: 9, username: 'Player9', xp: 2100, level: 5, avatar: 'https://i.pravatar.cc/100?img=9' },
            { id: 10, username: 'Player10', xp: 1890, level: 4, avatar: 'https://i.pravatar.cc/100?img=10' }
        ];

        let html = '<div class="xp-leaderboard">';

        // Top 3 players with special styling
        html += '<div class="xp-top-players">';

        for (let i = 0; i < 3 && i < mockXPData.length; i++) {
            const player = mockXPData[i];
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';

            html += `
                <div class="xp-top-player">
                    <div class="xp-top-medal">${medal}</div>
                    <div class="xp-top-avatar">
                        <img src="${player.avatar}" alt="${player.username}">
                        <div class="xp-top-level">Lvl ${player.level}</div>
                    </div>
                    <div class="xp-top-info">
                        <div class="xp-top-name">${player.username}</div>
                        <div class="xp-top-xp">${player.xp.toLocaleString()} XP</div>
                    </div>
                </div>
            `;
        }

        html += '</div>';

        // Rest of the leaderboard
        html += '<div class="xp-players-list">';

        for (let i = 3; i < mockXPData.length; i++) {
            const player = mockXPData[i];

            html += `
                <div class="xp-player-item">
                    <div class="xp-player-rank">#${i + 1}</div>
                    <div class="xp-player-avatar">
                        <img src="${player.avatar}" alt="${player.username}">
                    </div>
                    <div class="xp-player-info">
                        <div class="xp-player-name">${player.username}</div>
                        <div class="xp-player-level">Livello ${player.level}</div>
                    </div>
                    <div class="xp-player-xp">${player.xp.toLocaleString()} XP</div>
                </div>
            `;
        }

        html += '</div>';
        html += '</div>';

        container.innerHTML = html;
    }

    // Matchmaking functionality
    function loadMatchmakingStatus() {
        // This would normally fetch data from the server
        // For demo purposes, we'll create mock data
        const mockQueueData = {
            duo: [
                { id: 1, username: 'Player1', avatar: 'https://i.pravatar.cc/100?img=1' },
                { id: 2, username: 'Player2', avatar: 'https://i.pravatar.cc/100?img=2' }
            ],
            trio: [
                { id: 3, username: 'Player3', avatar: 'https://i.pravatar.cc/100?img=3' },
                { id: 4, username: 'Player4', avatar: 'https://i.pravatar.cc/100?img=4' }
            ]
        };

        // Update duo queue
        const duoQueueCount = document.getElementById('duoQueueCount');
        const duoQueuePlayers = document.getElementById('duoQueuePlayers');

        duoQueueCount.textContent = `${mockQueueData.duo.length}/2`;

        if (mockQueueData.duo.length === 0) {
            duoQueuePlayers.innerHTML = '<div class="empty-queue">Nessun giocatore in coda</div>';
        } else {
            let duoHTML = '';
            mockQueueData.duo.forEach(player => {
                duoHTML += `
                    <div class="queue-player">
                        <img src="${player.avatar}" alt="${player.username}">
                        <span>${player.username}</span>
                    </div>
                `;
            });
            duoQueuePlayers.innerHTML = duoHTML;
        }

        // Update trio queue
        const trioQueueCount = document.getElementById('trioQueueCount');
        const trioQueuePlayers = document.getElementById('trioQueuePlayers');

        trioQueueCount.textContent = `${mockQueueData.trio.length}/3`;

        if (mockQueueData.trio.length === 0) {
            trioQueuePlayers.innerHTML = '<div class="empty-queue">Nessun giocatore in coda</div>';
        } else {
            let trioHTML = '';
            mockQueueData.trio.forEach(player => {
                trioHTML += `
                    <div class="queue-player">
                        <img src="${player.avatar}" alt="${player.username}">
                        <span>${player.username}</span>
                    </div>
                `;
            });
            trioQueuePlayers.innerHTML = trioHTML;
        }

        // Add event listeners to queue buttons
        document.querySelectorAll('.queue-button').forEach(button => {
            button.addEventListener('click', function() {
                const queueType = this.getAttribute('data-queue');
                alert(`Funzionalità di coda ${queueType} non disponibile nella demo. Usa il comando !queue ${queueType} su Discord.`);
            });
        });
    }

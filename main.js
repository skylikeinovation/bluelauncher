        // Tentamos importar as ferramentas do Tauri
        // Se estiveres a correr no Browser normal, isto vai falhar (o que é esperado)
        let tauriFS, tauriPath;
        
        try {
            // No Tauri, estas APIs permitem ler o disco a sério
            const { fs, path } = window.__TAURI__;
            tauriFS = fs;
            tauriPath = path;
        } catch (e) {
            console.log("Ambiente Tauri não detetado. A usar modo de demonstração.");
        }

        function initIcons() {
            if (window.lucide) {
                window.lucide.createIcons();
            }
        }

        function updateClock() {
            const now = new Date();
            document.getElementById('clock').textContent = 
                `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        }

        // Função Real de Mapeamento
        async function scanFilesystem() {
            const grid = document.getElementById('game-grid');
            const status = document.getElementById('status');
            const pathDisplay = document.getElementById('path-display');
            
            if (!window.__TAURI__) {
                status.textContent = "Modo de Pré-visualização";
                pathDisplay.textContent = "Executa via Tauri para mapear ficheiros reais";
                return;
            }

            try {
                status.textContent = "A mapear ficheiros...";
                
                // 1. Obtém o caminho da pasta Downloads usando comando Rust
                const { invoke } = window.__TAURI__.core;
                const downloadDir = await invoke('get_download_dir');
                pathDisplay.textContent = `Diretório: ${downloadDir}`;

                // 2. Lê todos os ficheiros da pasta usando comando Rust
                const files = await invoke('read_directory', { path: downloadDir });
                
                // 3. Filtra apenas os que terminam em .game
                const games = files.filter(file => file.endsWith('.game'));

                if (games.length === 0) {
                    document.getElementById('no-games').classList.remove('hidden');
                    status.textContent = "Pasta limpa";
                } else {
                    grid.innerHTML = '';
                    games.forEach(game => {
                        const fullPath = `${downloadDir}/${game}`;
                        createWidget(game, fullPath);
                    });
                    status.textContent = `${games.length} Jogos encontrados`;
                    initIcons();
                }
            } catch (err) {
                console.error(err);
                status.textContent = "Erro no mapeamento";
                pathDisplay.textContent = `Erro: ${err}`;
            }
        }

        function createWidget(name, fullPath) {
            const grid = document.getElementById('game-grid');
            const gameTitle = name.replace('.game', '');
            
            const card = document.createElement('div');
            card.className = 'game-card group';
            card.onclick = () => launchGame(fullPath);

            card.innerHTML = `
                <div class="icon-container">
                    <i data-lucide="gamepad-2" class="text-teal-400 w-10 h-10"></i>
                </div>
                <h2 class="text-xl font-semibold capitalize">${gameTitle}</h2>
                <span class="text-xs opacity-40 mt-2 uppercase tracking-widest">Lançar Jogo</span>
            `;
            grid.appendChild(card);
        }

        async function launchGame(path) {
            if (window.__TAURI__) {
                try {
                    const { invoke } = window.__TAURI__.core;
                    // Usa o comando customizado que dá permissão e executa
                    await invoke('launch_game', { path: path });
                } catch (err) {
                    console.error('Erro ao lançar jogo:', err);
                    alert(`Erro ao abrir: ${err}`);
                }
            }
        }

        window.onload = () => {
            updateClock();
            setInterval(updateClock, 1000);
            scanFilesystem();
        };
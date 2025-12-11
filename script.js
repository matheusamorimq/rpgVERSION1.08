window.addEventListener("load", () => {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const xpBarElem = document.getElementById("xpBar");
    
    // =================================================================
    // REFERÊNCIAS DOS MENUS E BOTÕES (Correção Essencial!)
    // =================================================================
    // Estes IDs vieram do seu HTML corrigido
    const mainMenu = document.getElementById("mainMenu");
    const pauseMenu = document.getElementById("pauseMenu");
    const controlsMenu = document.getElementById("controlsMenu");
    const upgradeMenu = document.getElementById("upgradeMenu"); // O DIV principal

    // Botões de navegação
    const startButton = document.getElementById("startButton");
    const resumeButton = document.getElementById("resumeButton");
    const returnToMainButton = document.getElementById("returnToMainButton");
    const controlsFromMainButton = document.getElementById("controlsFromMainButton");
    const controlsFromPauseButton = document.getElementById("controlsFromPauseButton");
    const backFromControlsButton = document.getElementById("backFromControlsButton");

    // NOVO: Créditos
    const creditsMenu = document.getElementById("creditsMenu");
    const creditsButton = document.getElementById("creditsButton");
    const backFromCreditsButton = document.getElementById("backFromCreditsButton");
    // =================================================================

    const IMG_PATH = "assets/";

    // --- SPRITES: agora temos caminhos para esquerda (padrão) e direita
    const playerSpritesLeft = {
        1: IMG_PATH + "COURO.png",
        2: IMG_PATH + "PRATA.png",
        3: IMG_PATH + "OURO.png",
        4: IMG_PATH + "DIAMANTE.png",
        5: IMG_PATH + "LENDARIO.png"
    };
    const playerSpritesRight = {
        1: IMG_PATH + "COURODIREITA.png",
        2: IMG_PATH + "PRATADIREITA.png",
        3: IMG_PATH + "OURODIREITA.png",
        4: IMG_PATH + "DIAMANTEDIREITA.png",
        5: IMG_PATH + "LENDARIODIREITA.png"
    };

    const monsterSpritesByTier = {
        1: IMG_PATH + "JELLY.png",
        2: IMG_PATH + "ROXINHO.png",
        3: IMG_PATH + "AZULAO.png",
        4: IMG_PATH + "TIGRAO.png",
        5: IMG_PATH + "FINALBOSS.png"
    };

    const mapImg = new Image(); mapImg.src = IMG_PATH + "MAP.png";
    const mapDarkImg = new Image(); mapDarkImg.src = IMG_PATH + "MAPDARK.png";
    const gameOverImg = new Image(); gameOverImg.src = IMG_PATH + "GAMEOVER.png";
    const winImg = new Image(); winImg.src = IMG_PATH + "WIN.png";
    const coracaoImg = new Image(); coracaoImg.src = IMG_PATH + "CORACAO.png";
    const coracaoRoxoImg = new Image(); coracaoRoxoImg.src = IMG_PATH + "CORACAOROXO.png";
        
    // NOVO: Sprite e Configuração da Bola de Fogo
    const fireballImg = new Image(); fireballImg.src = IMG_PATH + "BOLADEFOGO.png";
    const FIREBALL_DMG_PERCENT = 0.25; // Dano em % do HP Máximo do jogador
    const FIREBALL_SPEED = 2.5;	
    const BOSS_FIRE_RATE = 3000; // 3 segundos (3000 ms)

    // NOVO: Sprite do Sangue
    const bloodImg = new Image(); bloodImg.src = IMG_PATH + "SANGUE.png"; // Certifique-se que o nome do arquivo é SANGUE.png

    // =================================================================
    // MODIFICADO/NOVO: Definição e Carregamento dos Sprites da ESPADA por TIER
    const weaponSpritesByTier = {
        1: IMG_PATH + "ESPADA.png", // Nível 1-9 (Madeira/Padrão)
        2: IMG_PATH + "ESPADAPRATA.png", // Nível 10-19
        3: IMG_PATH + "ESPADAOURO.png", // Nível 20-29
        4: IMG_PATH + "ESPADADIAMANTE.png", // Nível 30-39
        5: IMG_PATH + "ESPADALENDARIA.png" // Nível 40+ (Lendário)
    };

    // MODIFICADO: Pre-carrega todas as imagens de espada para evitar criar novas
    const loadedWeaponImgs = {};
    for(const tier in weaponSpritesByTier) {
        const img = new Image();
        img.src = weaponSpritesByTier[tier];
        loadedWeaponImgs[tier] = img;
    }

    // weaponImg agora aponta para a imagem atual (padrão)
    let weaponImg = loadedWeaponImgs[1];	

    const WEAPON_SCALE_FACTOR = 0.2;	
    const WEAPON_W = 504 * WEAPON_SCALE_FACTOR; // 100.8
    const WEAPON_H = 346 * WEAPON_SCALE_FACTOR; // 69.2
    // =================================================================

    const PLAYER_BASE = { maxHp: 350, atk: 14, def: 1, speed: 2.5 };
    const MONSTER_BASE_SPEED = 1.30;
    const PLAYER_ATTACK_RANGE = 120;
    const PLAYER_ATTACK_COOLDOWN = 220;

    const MONSTER_SCALING = {
        1: { dmgPercent: 0.06, cd: 2000 },
        2: { dmgPercent: 0.09, cd: 1900 },
        3: { dmgPercent: 0.12, cd: 1700 },
        4: { dmgPercent: 0.20, cd: 1500 },
        5: { dmgPercent: 0.50, cd: 3000 }
    };

    const player = {
        x: 380, y: 280, w: 48, h: 48,
        maxHp: PLAYER_BASE.maxHp,
        hp: PLAYER_BASE.maxHp,
        atk: PLAYER_BASE.atk,
        def: PLAYER_BASE.def,
        speed: PLAYER_BASE.speed,
        level: 1,
        xp: 0,
        xpToNext: 80, // AJUSTE DE BALANCEAMENTO: De 25 para 40 (Início mais lento)
        xpMultiplier: 1.0,
        sprite: new Image(),
        facing: "left",
        
        // Variáveis para a Animação de Ataque Giratório
        isAttacking: false,	
        attackAngle: 0,	 	
        attackRadius: PLAYER_ATTACK_RANGE * 0.7,	
        attackDuration: 550,	
        attackTimer: 0,	 	 	
        
        // MODIFICADO/NOVO: Variáveis para o Dash
        isDashing: false,
        dashDuration: 80, // Duração do dash em ms
        dashSpeed: 5, // MODIFICADO: Multiplicador de velocidade (era 10, agora 5)
        dashCooldown: 1000, // Cooldown de 1 segundo (1000 ms)
        lastDash: 0,
        lastHitByProjectile: 0 // NOVO: Cooldown de dano para projéteis
    };

    // Variáveis de Estado de Jogo
    let gameState = "mainMenu"; // Estados: "mainMenu", "running", "paused", "controls", "credits", "upgrade", "gameOver"
    let lastGameState = "mainMenu"; // Para saber para onde voltar após a tela de controles
    let monsters = [];
    let hearts = [];
    let projectiles = [];	
    let swordTrail = []; // Array para o rastro da espada
    let bloodParticles = []; // NOVO: Array para as partículas de sangue
    let dustParticles = []; // NOVO: Array para partículas de poeira do Dash
    let isGameOver = false;
    let isVictory = false;
    let lastPlayerHit = 0;
    let keys = {};
    let lastTimestamp = performance.now();
    let trailCounter = 0; // Contador para controlar a taxa de spawn do rastro
    let animationFrameId; // Para controlar o requestAnimationFrame

    updatePlayerSprite();
    updateWeaponSprite(); // NOVO: Carrega o sprite inicial da espada

    function clamp(v, a, b){ return Math.max(a, Math.min(b,v)); }
    function rectOverlap(a,b){ return !(a.x+a.w<b.x || a.x>b.x+b.w || a.y+a.h<b.y || a.y>b.y+b.h); }

    function calculateMaxMonsters(){ return player.level>=40 ? 1 : 3 + Math.floor(Math.random()*2); }

    // =================================================================
    // CORREÇÃO ESSENCIAL: Lógica de Menus (setGameState)
    // =================================================================
    function setGameState(newState) {
        // Esconde todos os menus
        mainMenu.style.display = 'none';
        pauseMenu.style.display = 'none';
        controlsMenu.style.display = 'none';
        upgradeMenu.style.display = 'none';
        creditsMenu.style.display = 'none'; 

        // Antes de mudar, guarda o estado atual se estivermos indo para CONTROLES ou CRÉDITOS
        if (newState === "controls" || newState === "credits") {
            lastGameState = gameState;
        }
        
        // Atualiza a variável de estado
        gameState = newState;

        // Exibe o menu correspondente
        if (gameState === "mainMenu") {
            mainMenu.style.display = 'flex';
        } else if (gameState === "paused") {
            pauseMenu.style.display = 'flex';
        } else if (gameState === "controls") {
            controlsMenu.style.display = 'flex';
        } else if (gameState === "credits") {
            creditsMenu.style.display = 'flex';
        } else if (gameState === "upgrade") {
            showUpgradeMenu(); // Chama a função que gera e exibe o menu de upgrade
        }
        // Os estados "running", "gameOver" e "loading" não exibem menus HTML.
    }
    
    // Função para iniciar o jogo (chamada pelo botão START)
    function startGame() {
        if(animationFrameId) cancelAnimationFrame(animationFrameId); // Garante que o loop anterior parou
        restartGame();
        setGameState("running");
        animationFrameId = requestAnimationFrame(mainLoop); // Inicia o loop
    }
    // =================================================================

    // MODIFICAÇÃO: Aumentar o tamanho e mudar a velocidade do Tier 5 (Boss)
    function createMonsterForTier(tier){
        const isBoss = tier === 5;
        
        // Define o tamanho: 150x150 para o boss, 54x54 para os outros
        const monsterWidth = isBoss ? 150 : 54;
        const monsterHeight = isBoss ? 150 : 54;

        // NOVO CÁLCULO DE HP
        const baseHealth = 80 + tier * 50; // HP base é 80
        const bossBonus = isBoss ? 2000 : 0; // Bônus de 2000 HP só para o Boss

        const m = {
            x: 40 + Math.random()*(canvas.width-100),
            y: 80 + Math.random()*(canvas.height-150),
            w: monsterWidth,	
            h: monsterHeight,	
            tier,
            maxHp: baseHealth + bossBonus,
            hp: baseHealth + bossBonus,
            // Boss é mais lento
            speed: isBoss ? 0.4 : MONSTER_BASE_SPEED + tier*0.06,	
            lastHitAt: 0,
            sprite: new Image()
        };
        m.sprite.src = monsterSpritesByTier[tier] || monsterSpritesByTier[1];
        if(Math.hypot(m.x-player.x,m.y-player.y)<80){
            m.x = clamp(m.x+120,0,canvas.width-m.w);
            m.y = clamp(m.y+80,0,canvas.height-m.h);
        }
        return m;
    }
    // =================================================================

    function spawnWave(){
        if(isVictory) return;
        monsters=[]; hearts=[];
        let count = calculateMaxMonsters();

        let baseTier;
        if(player.level>=40) baseTier=5;
        else if(player.level>=30) baseTier=4;
        else if(player.level>=20) baseTier=3;
        else if(player.level>=10) baseTier=2;
        else baseTier=1;

        for(let i=0;i<count;i++){
            let varTier = baseTier;
            if(baseTier<5 && Math.random()<0.12) varTier = Math.max(1, baseTier-1);
            monsters.push(createMonsterForTier(varTier));
        }
    }

    // CORREÇÃO: Usa a função setGameState e os estilos CSS da classe .game-menu
    function showUpgradeMenu(){
        // Usa setGameState para garantir que o estado é 'upgrade'
        // (Já chamado no levelUp, mas garantido aqui)
        // pendingUpgrade = true; // Não é mais necessário, o estado "upgrade" já pausa o jogo.
        
        if(!upgradeMenu) return; // Se por algum motivo não encontrou (não deve ocorrer com a correção do HTML)

        upgradeMenu.innerHTML="";
        
        const title = document.createElement("h2");
        title.textContent = "⬆️ NÍVEL CONCLUÍDO! Escolha um upgrade:";
        title.style.color = "#4cd137";
        upgradeMenu.appendChild(title);

        const upgrades = [
            {text:"Aumentar ATK (+8)", type:"atk"},
            {text:"Aumentar HP (+45)", type:"hp"},
            {text:"Aumentar DEF (+1)", type:"def"},
            {text:"Aumentar VEL (+0.15)", type:"spd"},
            {text:"Aumentar EXP (+10%)", type:"exp"}
        ];

        for(let u of upgrades){
            const btn = document.createElement("button");
            btn.textContent = u.text;
            // O estilo é herdado do CSS da classe .game-menu no HTML
            btn.onclick = ()=> applyUpgrade(u.type);
            upgradeMenu.appendChild(btn);
        }
        
        // A função setGameState("upgrade") já exibe o menu
        upgradeMenu.style.display="flex"; 
    }

    function applyUpgrade(type){
        // Verifica se o jogo está no estado correto para evitar cliques duplicados
        if(gameState !== "upgrade") return; 
        
        if(type==="atk") player.atk+=8;
        else if(type==="hp"){ player.maxHp+=45; player.hp=player.maxHp; }
        else if(type==="def") player.def+=1;
        else if(type==="spd") player.speed=Math.min(6,player.speed+0.15);
        else if(type==="exp") player.xpMultiplier=+(player.xpMultiplier*1.10).toFixed(2);

        // AJUSTE DE BALANCEAMENTO: De 1.17 para 1.12 (Suaviza a curva final)
        player.xpToNext = Math.max(10,Math.floor(player.xpToNext*1.25)); 
        
        // Retorna o jogo ao estado de rodando
        setGameState("running");
        spawnWave();
        updateUI();
    }

    function giveXP(raw){
        if(player.level>=40) return;
        const gained = Math.max(1, Math.floor(raw*player.xpMultiplier));
        player.xp += gained;

        while(player.xp >= player.xpToNext && player.level<40){
            player.xp -= player.xpToNext;
            player.level++;
            
            updatePlayerSprite();
            updateWeaponSprite(); // NOVO: Chama a atualização da espada após o level up
            // CHAVE DA CORREÇÃO: Muda o estado para UPGRADE
            setGameState("upgrade"); 
            break;
        }
        updateUI();
    }

    function getPlayerTier(){
        return player.level>=40 ? 5 :
                player.level>=30 ? 4 :
                player.level>=20 ? 3 :
                player.level>=10 ? 2 : 1;
    }

    function updatePlayerSprite(){
        const tierNum = getPlayerTier();
        const path = (player.facing === "right") ? playerSpritesRight[tierNum] : playerSpritesLeft[tierNum];
        if(player.sprite.src !== path){
            player.sprite.src = path;
        }
    }

    // Função para carregar o sprite da espada baseado no nível
    function updateWeaponSprite(){
        const tierNum = getPlayerTier();
        weaponImg = loadedWeaponImgs[tierNum]; // Usa a imagem pré-carregada
    }

    // NOVO: Lógica de ativação do Dash
    function playerDash(){
        if(gameState !== "running" || player.isDashing || isGameOver || isVictory) return;
        
        const now = Date.now();
        if(now - player.lastDash < player.dashCooldown) return;

        // Verifica se alguma tecla de movimento está pressionada (O dash só é útil se houver direção)
        if(keys["w"] || keys["s"] || keys["a"] || keys["d"] || 
            keys["arrowup"] || keys["arrowdown"] || keys["arrowleft"] || keys["arrowright"]){
            
            player.isDashing = true;
            player.lastDash = now;
            
            // Configura o timer para terminar o dash
            setTimeout(() => {
                player.isDashing = false;
            }, player.dashDuration);
        }
    }

    // MODIFICADO: Inclui a multiplicação de velocidade durante o dash e a geração da poeira
    function movePlayer(delta){
        if(gameState !== "running" && gameState !== "paused") return; // Apenas se estiver rodando
        if(isGameOver || isVictory) return;

        // Calcula a velocidade base
        let currentSpeed = player.speed * delta;
        
        // Se estiver em Dash, multiplica a velocidade
        if(player.isDashing){
            currentSpeed *= player.dashSpeed;	
        }

        // Variáveis para o cálculo da direção do Dash/Poeira
        let dir_x = 0;
        let dir_y = 0;

        if(keys["w"]||keys["arrowup"]){ player.y-=currentSpeed; dir_y = -1; }
        if(keys["s"]||keys["arrowdown"]){ player.y+=currentSpeed; dir_y = 1; }

        if(keys["a"]||keys["arrowleft"]){
            player.x-=currentSpeed;
            player.facing = "left";
            dir_x = -1;
            updatePlayerSprite();
        }
        if(keys["d"]||keys["arrowright"]){
            player.x+=currentSpeed;
            player.facing = "right";
            dir_x = 1;
            updatePlayerSprite();
        }

        // NOVO: Geração de poeira se estiver em dash E se houver movimento
        if(player.isDashing && (dir_x !== 0 || dir_y !== 0)){
            // Gera 3 partículas por frame
            for (let i = 0; i < 3; i++){
                // O centro da partícula será o centro do jogador
                const cx = player.x + player.w / 2;
                const cy = player.y + player.h / 2;
                
                // Lança a partícula na direção OPOSTA ao movimento (poeira para trás)
                dustParticles.push({
                    x: cx + (Math.random() - 0.5) * 5, // Pequena variação lateral
                    y: cy + (Math.random() - 0.5) * 5,
                    
                    // Velocidade oposta (movimento - oposto) e ligeiramente aleatória
                    vx: -dir_x * (0.5 + Math.random() * 0.5), 
                    vy: -dir_y * (0.5 + Math.random() * 0.5), 
                    
                    size: 8 + Math.random() * 6,
                    opacity: 1.0,
                    color: "rgba(200, 200, 200, 1)" // Cor cinza/branca para poeira
                });
            }
        }


        player.x=clamp(player.x,0,canvas.width-player.w);
        player.y=clamp(player.y,0,canvas.height-player.h);
    }

    function checkMonsterCollision(monster){
        if(rectOverlap(player, monster)){
            const now = Date.now();
            const tier = monster.tier || 1;
            const cfg = MONSTER_SCALING[tier] || MONSTER_SCALING[1];

            if(now - (monster.lastHitAt || 0) >= cfg.cd){
                monster.lastHitAt = now;
                let dmg = Math.floor(player.maxHp * cfg.dmgPercent);
                dmg = Math.max(1, dmg - player.def);

                player.hp -= dmg;

                const dx = (player.x + player.w/2) - (monster.x + monster.w/2);
                const dy = (player.y + player.h/2) - (monster.y + monster.h/2);
                const dist = Math.hypot(dx, dy) || 1;
                const push = 15;
                player.x += (dx/dist) * push;
                player.y += (dy/dist) * push;
                player.x = clamp(player.x, 0, canvas.width - player.w);
                player.y = clamp(player.y, 0, canvas.height - player.h);

                if(player.hp <= 0) triggerGameOver();
                updateUI();
            }
        }
    }

    function monstersAIandDamage(delta){
        if(gameState !== "running" || isGameOver || isVictory) return;
        const now = Date.now();
        for(let m of monsters){
            const dx=(player.x+player.w/2)-(m.x+m.w/2);
            const dy=(player.y+player.h/2)-(m.y+m.h/2);
            const dist=Math.hypot(dx,dy);
            if(dist>2){ m.x+=(dx/dist)*m.speed*delta; m.y+=(dy/dist)*m.speed*delta; }

            checkMonsterCollision(m);
            
            // NOVO: LÓGICA DO BOSS - ATIRAR PROJÉTIL
            if(m.tier === 5 && dist < 500){ // Boss atira se o jogador estiver a menos de 500px
                if(!m.lastShot || now - m.lastShot >= BOSS_FIRE_RATE){
                    m.lastShot = now;
                    const angle = Math.atan2(dy, dx);
                    
                    projectiles.push({
                        x: m.x + m.w / 2 - 16, // Posição inicial (centralizada)
                        y: m.y + m.h / 2 - 16,
                        w: 32, // Tamanho do projétil
                        h: 32,
                        vx: Math.cos(angle) * FIREBALL_SPEED,
                        vy: Math.sin(angle) * FIREBALL_SPEED,
                        damage: FIREBALL_DMG_PERCENT,
                        sprite: fireballImg,
                        angle: angle, // Para desenhar rotacionado
                        lastHitByProjectile: 0 // Cooldown de dano para o jogador
                    });
                }
            }
            
        }

        // Colisão entre monstros
        for(let i=0;i<monsters.length;i++){
            for(let j=i+1;j<monsters.length;j++){
                const a=monsters[i],b=monsters[j];
                const dx=(a.x+a.w/2)-(b.x+b.w/2);
                const dy=(a.y+a.h/2)-(b.y+b.h/2);
                const d=Math.hypot(dx,dy)||1;
                const minDist=48;
                if(d<minDist){
                    const overlap=(minDist-d)/2;
                    const nx=dx/d, ny=dy/d;
                    a.x+=nx*overlap; a.y+=ny*overlap;
                    b.x-=nx*overlap; b.y-=ny*overlap;
                }
            }
        }
    }

    function handleHearts(delta){
        if(gameState !== "running") return;
        for(let i=hearts.length-1; i>=0; i--){
            const h = hearts[i];
            h.ttl -= delta*16.6667;
            if(rectOverlap(player,h)){
                player.hp = Math.min(player.maxHp, player.hp + h.heal);
                hearts.splice(i,1);
                updateUI();
                continue;
            }
            if(h.ttl <= 0) hearts.splice(i,1);
        }
    }
    
    // Movimento e Colisão dos Projéteis
    function updateProjectiles(delta){
        if(gameState !== "running") return;
        const now = Date.now();
        for(let i = projectiles.length - 1; i >= 0; i--){
            const p = projectiles[i];
            
            // Movimento
            p.x += p.vx * delta;
            p.y += p.vy * delta;

            // Colisão com o jogador
            if(rectOverlap(p, player)){
                if(now - player.lastHitByProjectile > 300){ // Cooldown de 300ms de dano de projétil
                    player.lastHitByProjectile = now;
                    
                    let dmg = Math.floor(player.maxHp * p.damage);
                    dmg = Math.max(1, dmg - player.def); // Aplica defesa

                    player.hp -= dmg;
                    projectiles.splice(i, 1); // Remove o projétil
                    
                    if(player.hp <= 0) triggerGameOver();
                    updateUI();
                    continue;
                }
            }

            // Remoção se sair da tela (bounding box)
            if(p.x < -100 || p.x > canvas.width + 100 || p.y < -100 || p.y > canvas.height + 100){
                projectiles.splice(i, 1);
            }
        }
    }
    
    // Lógica de atualização do Rastro da Espada
    function updateTrail(delta){
        if(gameState !== "running") return;
        for(let i = swordTrail.length - 1; i >= 0; i--){
            const t = swordTrail[i];
            
            // Faz a opacidade diminuir, fazendo o rastro desaparecer
            // O 0.15 controla a velocidade que ele somem. Ajustamos pela delta.
            t.opacity -= 0.15 * delta;	

            if(t.opacity <= 0){
                swordTrail.splice(i, 1);
            }
        }
    }
    
    // NOVO: Lógica de atualização da Poeira do Dash
    function updateDust(delta) {
        if(gameState !== "running" && gameState !== "paused") return; // Atualiza a poeira mesmo se pausado
        for(let i = dustParticles.length - 1; i >= 0; i--){
            const p = dustParticles[i];
            
            // Movimento: Partículas seguem uma direção lenta e aleatória
            p.x += p.vx * delta;
            p.y += p.vy * delta;
            
            p.opacity -= 0.08 * delta; // Desaparece rapidamente
            p.size *= 0.98; // Diminui de tamanho

            if(p.opacity <= 0 || p.size < 1){
                dustParticles.splice(i, 1);
            }
        }
    }
    
    // NOVO: Lógica de atualização do Sangue (Blood Splatter)
    function updateBlood(delta){
        if(gameState !== "running" && gameState !== "paused") return; // Atualiza o sangue mesmo se pausado
        for(let i = bloodParticles.length - 1; i >= 0; i--){
            const p = bloodParticles[i];
            
            // Aplica física (velocidade horizontal desacelera, vertical acelera com gravidade)
            p.vx *= (0.95)**delta; // Fricção (desaceleração)
            p.vy += p.gravity * delta; // Aplica gravidade
            p.x += p.vx * delta;
            p.y += p.vy * delta;
            
            p.opacity -= 0.04 * delta; // O sangue some gradualmente

            if(p.opacity <= 0){
                bloodParticles.splice(i, 1);
            }
        }
    }

    // MODIFICADO: Adiciona lógica para o sangue quando o monstro é atingido
    function playerAttack(){
        if(gameState !== "running" || isGameOver || isVictory) return;
        const now = Date.now();
        if(now-lastPlayerHit<PLAYER_ATTACK_COOLDOWN) return;
        
        lastPlayerHit=now;
        
        // ATIVAÇÃO DA ANIMAÇÃO
        player.isAttacking = true;
        player.attackTimer = 0;	
        player.attackAngle = 0;	

        for(let i=monsters.length-1;i>=0;i--){
            const m=monsters[i];
            const dx=(player.x+player.w/2)-(m.x+m.w/2);
            const dy=(player.y+player.h/2)-(m.y+m.h/2);
            
            // O ataque é válido se a distância entre os centros for menor ou igual
            // ao alcance do jogador MAIS o raio do monstro (m.w / 2)
            const monsterRadius = m.w / 2;
            if(Math.hypot(dx,dy) <= PLAYER_ATTACK_RANGE + monsterRadius){	
                const dmg=Math.max(2,player.atk-Math.floor((m.tier||1)*0.3));

                m.hp-=dmg;

                // NOVO: Geração de partículas de sangue no ataque
                if (m.hp > 0) { // Sangue só sai se o monstro estiver vivo
                    for (let j = 0; j < 4; j++) { // Cria 4 partículas de sangue
                        bloodParticles.push({
                            x: m.x + m.w / 2,
                            y: m.y + m.h / 2,
                            // Dá uma velocidade aleatória para que se espalhem
                            vx: (Math.random() - 0.5) * 6,
                            vy: (Math.random() - 0.5) * 6,
                            size: 15 + Math.random() * 10,
                            opacity: 1.0,
                            gravity: 0.1	
                        });
                    }
                }

                if(m.hp<=0){
                    if(Math.random()<0.18) hearts.push({x:m.x+8,y:m.y+8,w:28,h:28,ttl:6000,heal:50,sprite:coracaoImg});
                    if(player.level>=20 && Math.random()<0.10) hearts.push({x:m.x+8,y:m.y+8,w:28,h:28,ttl:6000,heal:120,sprite:coracaoRoxoImg});

                    if(m.tier===5){ isVictory=true; monsters=[]; }
                    else monsters.splice(i,1);

                    // AJUSTE DE BALANCEAMENTO: De 18 para 25 (Aumenta o ganho de XP)
                    giveXP(15*(m.tier||1));
                }
            }
        }

        if(monsters.length===0 && !isVictory) spawnWave();
    }

    // CORREÇÃO ESSENCIAL: Novo estado "gameOver"
    function triggerGameOver(){ 
        isGameOver=true; 
        setGameState("gameOver"); // Define o novo estado para mostrar a tela do Canvas
    }

    function restartGame(){
        // AJUSTE DE BALANCEAMENTO: De 25 para 40 (Início mais lento)
        player.level=1; player.xp=0; player.xpToNext=40; player.xpMultiplier=1.0; 
        player.maxHp=PLAYER_BASE.maxHp;	
        player.hp=PLAYER_BASE.maxHp;	
        player.atk=PLAYER_BASE.atk; player.def=PLAYER_BASE.def; player.speed=PLAYER_BASE.speed;
        player.facing = "left";
        player.isDashing = false; // Reseta Dash
        player.lastDash = 0;	
        player.lastHitByProjectile = 0;
        player.isAttacking = false;
        player.attackTimer = 0;
        updatePlayerSprite();
        updateWeaponSprite(); // NOVO: Garante que a espada volta ao padrão
        player.sprite.src = playerSpritesLeft[1];
        projectiles = [];	
        swordTrail = []; // Zera o rastro
        bloodParticles = []; // NOVO: Zera o sangue
        dustParticles = []; // NOVO: Zera a poeira
        monsters=[]; hearts=[]; isGameOver=false; isVictory=false;
        spawnWave(); updateUI();
    }

    // =================================================================
    // LISTENERS DE TECLADO E BOTÕES
    // =================================================================
    window.addEventListener("keydown", e=> {
        const key = e.key.toLowerCase();
        keys[key] = true;

        if(gameState === "running"){
            if(key==="k") playerAttack();
            if(key==="shift") playerDash(); // NOVO: Ativa o Dash com SHIFT
            if(key==="p") setGameState("paused"); // Tecla 'P' para Pausar
        } else if (gameState === "paused") {
            if(key==="p") setGameState("running"); // Tecla 'P' para Despausar
        }

        // CORREÇÃO: Permite pressionar R se o estado for 'gameOver' (ou se ganhou)
        if((gameState === "gameOver" || isVictory) && key==="r") {
            setGameState("mainMenu");
            restartGame();
        }
    });
    
    window.addEventListener("keyup", e=> keys[e.key.toLowerCase()]=false);
    canvas.addEventListener("click",()=>playerAttack());

    // Configuração dos Listeners de Botões de Menu
    startButton.onclick = startGame;
    resumeButton.onclick = () => setGameState("running");

    returnToMainButton.onclick = () => {
        setGameState("mainMenu");
        restartGame(); 
    };

    // Navegação para Controles
    controlsFromMainButton.onclick = () => setGameState("controls");
    controlsFromPauseButton.onclick = () => setGameState("controls");
    
    // Botão Voltar (sai da tela de Controles e volta para o estado anterior)
    backFromControlsButton.onclick = () => setGameState(lastGameState);

    // Navegação para Créditos (NOVO)
    creditsButton.onclick = () => setGameState("credits");
    backFromCreditsButton.onclick = () => setGameState("mainMenu");
    // =================================================================

    function drawHUD(){
        ctx.fillStyle="white";
        ctx.font="15px Arial"; ctx.textAlign="left";
        ctx.fillText(`HP: ${Math.max(0,player.hp)} / ${player.maxHp}`,12,22);
        ctx.fillText(`ATK: ${player.atk}`,12,44);
        ctx.fillText(`DEF: ${player.def}`,12,66);
        ctx.fillText(`VEL: ${player.speed.toFixed(2)}`,12,88);
        ctx.fillText(`Lv: ${player.level}`,12,110);
        ctx.fillText(`XP Mult: ${player.xpMultiplier.toFixed(2)}x`,12,132);
    }

    function updateUI(){
        // Atualiza as barras de XP (e HP, se houver)
        if(xpBarElem){
            const ratio=player.xpToNext>0?player.xp/player.xpToNext:1;
            xpBarElem.style.width=Math.floor(clamp(ratio,0,1)*100)+"%";
        }
        // Se você tiver uma barra de HP no HTML com ID "hpBar", ela seria atualizada aqui:
        // const hpBarElem = document.getElementById("hpBar");
        // if(hpBarElem) hpBarElem.style.width = Math.floor(clamp(player.hp / player.maxHp, 0, 1) * 100) + "%";
    }

    // MODIFICADO: Inclui a criação do rastro
    function updateAttackAnimation(delta) {
        if (!player.isAttacking) return;

        player.attackTimer += delta * (1000 / 60);	

        const rotationPerMs = 360 / player.attackDuration;
        player.attackAngle = (player.attackTimer * rotationPerMs) % 360;	

        // =================================================================
        // Lógica do Rastro (Trail)
        trailCounter++;
        if(trailCounter >= 4){ // Cria um "eco" a cada 4 frames
            trailCounter = 0;
            const angleInRadians = player.attackAngle * (Math.PI / 180);

            swordTrail.push({
                angle: angleInRadians,
                radius: player.attackRadius,
                opacity: 1.0, // Opacidade inicial
                playerX: player.x,
                playerY: player.y,
                tier: getPlayerTier() // Para o rastro usar a espada correta
            });
        }
        // =================================================================
        
        if (player.attackTimer >= player.attackDuration) {
            player.isAttacking = false;
            player.attackAngle = 0;
            player.attackTimer = 0;
        }
    }

    function draw(){
        const isMenuOpen = (gameState !== "running" && gameState !== "gameOver" && gameState !== "upgrade" && gameState !== "paused");
        
        if(isMenuOpen && mapDarkImg.complete) ctx.drawImage(mapDarkImg,0,0,canvas.width,canvas.height);
        else if(mapImg.complete) ctx.drawImage(mapImg,0,0,canvas.width,canvas.height);
        else ctx.fillStyle="#7ec850",ctx.fillRect(0,0,canvas.width,canvas.height);

        // =======================================================================
        // DESENHO DA POEIRA DO DASH (DUST PARTICLES) - Antes de tudo, mas visível
        if (!isMenuOpen) {
            for(let p of dustParticles) {
                ctx.save();
                ctx.globalAlpha = p.opacity; 
                ctx.fillStyle = p.color; 
                
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }
        }
        // =======================================================================

        // =======================================================================
        // DESENHO DO SANGUE (BLOOD PARTICLES) - Antes dos outros para ficar por baixo
        if (!isMenuOpen && bloodImg.complete) {
            for(let p of bloodParticles) {
                ctx.save();
                ctx.globalAlpha = p.opacity;	
                // Desenha a partícula de sangue
                ctx.drawImage(bloodImg, p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
                ctx.restore();
            }
        }
        // =======================================================================
        
        // =======================================================================
        // DESENHO DO RASTRO DA ESPADA (DRAW TRAIL)
        if (!isMenuOpen) {
            for(let t of swordTrail) {
                const trailWeaponImg = loadedWeaponImgs[t.tier]; // Usa a imagem pré-carregada e correta

                if(trailWeaponImg.complete) {
                    const angleInRadians = t.angle; // Já está em radianos
                    const playerCenterX = t.playerX + player.w / 2;
                    const playerCenterY = t.playerY + player.h / 2;
                    
                    const attack_x_center = playerCenterX + t.radius * Math.cos(angleInRadians);
                    const attack_y_center = playerCenterY + t.radius * Math.sin(angleInRadians);
                    
                    ctx.save();
                    // Aplica a opacidade que está diminuindo
                    ctx.globalAlpha = t.opacity;	
                    
                    ctx.translate(attack_x_center, attack_y_center);
                    ctx.rotate(angleInRadians + Math.PI * 0.75);	
                    
                    ctx.drawImage(trailWeaponImg, -WEAPON_W / 2, -WEAPON_H / 2, WEAPON_W, WEAPON_H);
                    
                    ctx.restore(); // Restaura opacidade e transformações
                }
            }
        }
        // =======================================================================


        // Desenha o Raio de Ataque (Círculo Amarelo)
        ctx.beginPath();
        ctx.arc(player.x+player.w/2, player.y+player.h/2, PLAYER_ATTACK_RANGE,0,Math.PI*2);
        ctx.strokeStyle="rgba(255,255,0,0.6)";
        ctx.lineWidth=2;
        ctx.stroke();

        // =======================================================================
        // Desenho da Animação do SPRITE da ESPADA (Rotacionada)
        if (!isMenuOpen && player.isAttacking && weaponImg.complete) {
            const angleInRadians = player.attackAngle * (Math.PI / 180);
            const playerCenterX = player.x + player.w / 2;
            const playerCenterY = player.y + player.h / 2;
            
            // 1. Calcula o ponto central onde a espada será desenhada
            const attack_x_center = playerCenterX + player.attackRadius * Math.cos(angleInRadians);
            const attack_y_center = playerCenterY + player.attackRadius * Math.sin(angleInRadians);
            
            
            ctx.save(); // Salva o estado atual do canvas
            
            // 2. Translação: Move o ponto de rotação para o centro da espada
            ctx.translate(attack_x_center, attack_y_center);
            
            // 3. Rotação: Gira o canvas. O ajuste de PI*0.75 (135 graus) é para alinhar o sprite
            ctx.rotate(angleInRadians + Math.PI * 0.75);	
            
            // 4. Desenho: Desenha a imagem (centralizada no ponto de translação)
            ctx.drawImage(weaponImg, -WEAPON_W / 2, -WEAPON_H / 2, WEAPON_W, WEAPON_H);
            
            ctx.restore(); // Restaura o estado original do canvas
        }
        // =======================================================================

        if(gameState === "running" || gameState === "paused" || gameState === "gameOver"){
            
            // NOVO: Desenho dos Projéteis
            for(let p of projectiles){
                if(p.sprite && p.sprite.complete){
                    ctx.save();
                    ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
                    ctx.rotate(p.angle + Math.PI / 2); // Rotaciona a imagem de fogo
                    ctx.drawImage(p.sprite, -p.w / 2, -p.h / 2, p.w, p.h);
                    ctx.restore();
                } else {
                    ctx.fillStyle = "red";
                    ctx.fillRect(p.x, p.y, p.w, p.h);
                }
            }
            
            for(let h of hearts){
                if(h.sprite && h.sprite.complete) ctx.drawImage(h.sprite,h.x,h.y,h.w,h.h);
                else ctx.fillStyle="pink",ctx.fillRect(h.x,h.y,h.w,h.h);
            }

            for(let m of monsters){
                if(m.sprite && m.sprite.complete) ctx.drawImage(m.sprite,m.x,m.y,m.w,m.h);
                else ctx.fillStyle="maroon",ctx.fillRect(m.x,m.y,m.w,m.h);

                ctx.fillStyle="black";
                ctx.fillRect(m.x, m.y-10, m.w, 6);
                ctx.fillStyle="lime";
                ctx.fillRect(m.x, m.y-10, Math.max(0, m.w*(m.hp/m.maxHp)), 6);
            }

            if(player.sprite && player.sprite.complete) {
                // NOVO: Efeito visual para o Dash: muda o globalAlpha
                ctx.save();
                if (player.isDashing) {
                    ctx.globalAlpha = 0.6; // Deixa o jogador semi-transparente durante o dash
                }

                ctx.drawImage(player.sprite,player.x,player.y,player.w,player.h);

                ctx.restore(); // Restaura a opacidade
            } else {
                ctx.fillStyle="blue";
                ctx.fillRect(player.x,player.y,player.w,player.h);
            }

            ctx.fillStyle="black";
            ctx.fillRect(player.x,player.y-12,player.w,6);
            ctx.fillStyle="red";
            ctx.fillRect(player.x,player.y-12,Math.max(0,player.w*(player.hp/player.maxHp)),6);
        }

        drawHUD();

        // CORREÇÃO: Apenas exibe o Game Over se o estado for "gameOver"
        if(isGameOver && gameState === "gameOver"){
            ctx.fillStyle="rgba(0,0,0,0.8)"; // Fundo mais escuro para destaque
            ctx.fillRect(0,0,canvas.width,canvas.height);
            if(gameOverImg.complete){
                const iw=Math.min(canvas.width*0.8,gameOverImg.naturalWidth);
                const ih=(gameOverImg.naturalHeight/gameOverImg.naturalWidth)*iw;
                ctx.drawImage(gameOverImg,(canvas.width-iw)/2,(canvas.height-ih)/2-40,iw,ih);
            }
            ctx.font="18px Arial"; ctx.fillStyle="white";
            ctx.textAlign="center";
            ctx.fillText("Pressione R para ir para o Menu Principal",canvas.width/2,canvas.height/2+80);
        }

        if(isVictory){
            ctx.fillStyle="rgba(0,0,0,0.6)";
            ctx.fillRect(0,0,canvas.width,canvas.height);
            if(winImg.complete){
                const iw=Math.min(canvas.width*0.8,winImg.naturalWidth);
                const ih=(winImg.naturalHeight/winImg.naturalWidth)*iw;
                ctx.drawImage(winImg,(canvas.width-iw)/2,(canvas.height-ih)/2-40,iw,ih);
            }
            ctx.font="18px Arial"; ctx.fillStyle="white";
            ctx.textAlign="center";
            ctx.fillText("Pressione R para ir para o Menu Principal",canvas.width/2,canvas.height/2+80);
        }
    }

    function mainLoop(timestamp){
        const delta=(timestamp-lastTimestamp)/16.6667;
        lastTimestamp=timestamp;

        // APENAS ATUALIZA A LÓGICA SE ESTIVER RODANDO
        if(gameState === "running"){
            updateAttackAnimation(delta);	
            movePlayer(delta);
            monstersAIandDamage(delta);
            updateProjectiles(delta);	
            handleHearts(delta);
            updateUI();
        }

        // Atualiza a lógica de partículas e rastro MESMO se estiver pausado (para que eles desapareçam)
        updateTrail(delta);	
        updateBlood(delta); // NOVO: Atualiza e move o sangue
        updateDust(delta); // NOVO: Atualiza e move a poeira
        
        draw();
        animationFrameId = requestAnimationFrame(mainLoop);
    }

    // =================================================================
    // INICIALIZAÇÃO
    // =================================================================
    // Inicia no Menu Principal
    setGameState("mainMenu"); 
    restartGame(); // Configura o estado inicial do jogo

    // Inicia o loop de renderização (ele não fará update se o estado não for "running")
    animationFrameId = requestAnimationFrame(mainLoop);
});
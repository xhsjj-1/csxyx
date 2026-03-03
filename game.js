// 游戏主类
class ParkourGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // 游戏状态
        this.gameState = 'menu'; // menu, playing, gameover
        this.difficulty = 'easy';
        this.score = 0;
        this.coins = 0;
        this.lives = 3;
        this.gameSpeed = 1.0;
        this.distance = 0;
        this.gameTime = 0;

        // 游戏元素
        this.player = {
            x: 100,
            y: 300,
            width: 30,  // 缩小玩家宽度
            height: 45, // 缩小玩家高度
            velocityY: 0,
            isJumping: false,
            isSliding: false,
            jumpPower: -12, // 调整跳跃力度
            gravity: 0.6,   // 调整重力
            slideHeight: 22 // 缩小滑行高度
        };

        this.ground = {
            y: 360,
            height: 30  // 缩小地面高度
        };

        this.obstacles = [];
        this.coinsList = [];
        this.clouds = [];
        this.flyingBlocks = []; // 新增：空中方块
        this.dodgeEffects = []; // 新增：躲避效果

        // 游戏设置
        this.obstacleInterval = 2500; // 障碍物生成间隔(ms) - 增加间隔
        this.coinInterval = 2000; // 金币生成间隔(ms) - 增加间隔
        this.cloudInterval = 4000; // 云生成间隔(ms)
        this.lastObstacleTime = 0;
        this.lastCoinTime = 0;
        this.lastCloudTime = 0;
        this.lastGeneratedType = null; // 记录上次生成的类型，避免连续生成同类

        // 控制状态
        this.keys = {};
        this.isTouchDevice = 'ontouchstart' in window;
        this.touchStartY = 0;
        this.touchStartTime = 0;

        // 音效
        this.soundEnabled = true;
        this.sounds = {
            jump: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-player-jumping-in-a-video-game-2043.mp3'),
            coin: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3'),
            hit: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-retro-arcade-game-hit-2187.mp3'),
            gameover: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-sad-game-over-trombone-471.mp3')
        };

        // 最高记录
        this.highScore = localStorage.getItem('parkourHighScore') || 0;
        this.highCoins = localStorage.getItem('parkourHighCoins') || 0;
        this.longestTime = localStorage.getItem('parkourLongestTime') || 0;

        // 总金币数
        this.totalCoins = parseInt(localStorage.getItem('totalCoins') || '0');

        // 商店系统
        this.skins = {
            default: { name: '默认皮肤', price: 0, color: '#4cc9f0', unlocked: true },
            gold: { name: '黄金皮肤', price: 50, color: '#ffd700', unlocked: localStorage.getItem('skin_gold') === 'true' },
            diamond: { name: '钻石皮肤', price: 100, color: '#b9f2ff', unlocked: localStorage.getItem('skin_diamond') === 'true' },
            rainbow: { name: '彩虹皮肤', price: 150, color: 'rainbow', unlocked: localStorage.getItem('skin_rainbow') === 'true' }
        };
        this.currentSkin = localStorage.getItem('currentSkin') || 'default';

        // 初始化
        this.init();
    }

    init() {
        try {
            // 隐藏加载提示
            const loading = document.getElementById('loading');
            if (loading) loading.style.display = 'none';

            // 检查画布是否可用
            if (!this.canvas || !this.ctx) {
                throw new Error('画布初始化失败');
            }

            // 设置画布尺寸
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());

            // 初始化音效
            this.initSounds();

            // 绑定事件
            this.bindEvents();

            // 初始化商店
            this.initShop();

            // 更新UI
            this.updateUI();

            // 开始游戏循环
            this.gameLoop();

            // 预生成一些云
            for (let i = 0; i < 5; i++) {
                this.createCloud();
            }

            console.log('游戏初始化成功！');
        } catch (error) {
            console.error('游戏初始化失败:', error);
            this.showError('游戏初始化失败: ' + error.message);
        }
    }

    showError(message) {
        // 显示错误信息
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(233, 69, 96, 0.9);
            color: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            z-index: 10000;
            max-width: 80%;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        `;

        errorDiv.innerHTML = `
            <h3 style="margin-bottom: 15px; color: white;">
                <i class="fas fa-exclamation-triangle"></i> 游戏错误
            </h3>
            <p style="margin-bottom: 20px;">${message}</p>
            <button onclick="location.reload()" style="
                background: white;
                color: #e94560;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                font-weight: bold;
                cursor: pointer;
            ">
                <i class="fas fa-redo"></i> 重新加载
            </button>
        `;

        document.body.appendChild(errorDiv);
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;

        // 根据设备类型调整高度比例
        const isMobile = 'ontouchstart' in window;
        let containerHeight;

        if (isMobile) {
            // 手机端：使用更宽的比例，让玩家能看到更多前方区域
            // 使用窗口高度的80%，确保游戏区域足够大
            const maxHeight = window.innerHeight * 0.80;
            containerHeight = Math.min(containerWidth * 0.9, maxHeight, 700); // 降低高度比例
        } else {
            // 电脑端：使用适中的比例
            containerHeight = Math.min(containerWidth * 0.6, 550);
        }

        // 确保最小高度
        containerHeight = Math.max(containerHeight, 350);

        this.canvas.width = containerWidth;
        this.canvas.height = containerHeight;

        // 更新地面位置 - 使用更小的地面高度
        this.ground.y = this.canvas.height - 30;
        this.player.y = this.ground.y - this.player.height;

        // 重新计算金币生成范围
        this.updateCoinHeightRange();

        console.log(`画布尺寸: ${containerWidth}×${containerHeight}, 设备: ${isMobile ? '手机' : '电脑'}, 比例: ${(containerHeight/containerWidth).toFixed(2)}`);
    }

    updateCoinHeightRange() {
        // 根据当前画布高度更新金币生成范围
        // 使用更小的范围，适应缩小后的游戏元素
        this.coinMinHeight = this.ground.y - 90;   // 降低最低高度
        this.coinMaxHeight = this.ground.y - 140;  // 降低最高高度

        // 确保高度范围有效
        if (this.coinMinHeight < 40) this.coinMinHeight = 40;
        if (this.coinMaxHeight < 60) this.coinMaxHeight = 60;
        if (this.coinMinHeight > this.coinMaxHeight) {
            this.coinMinHeight = this.coinMaxHeight - 25;
        }
    }

    initSounds() {
        // 设置音效音量
        Object.values(this.sounds).forEach(sound => {
            sound.volume = 0.3;
            sound.preload = 'auto';
        });
    }

    bindEvents() {
        // 键盘控制
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;

            // 防止空格键滚动页面
            if (e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
            }

            // 游戏控制
            if (this.gameState === 'menu' && (e.key === ' ' || e.key === 'enter')) {
                this.startGame();
            } else if (this.gameState === 'gameover' && e.key === ' ') {
                this.restartGame();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // 触摸控制
        if (this.isTouchDevice) {
            this.canvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.touchStartY = e.touches[0].clientY;
                this.touchStartTime = Date.now();
                this.keys['touch'] = true;
            });

            this.canvas.addEventListener('touchend', (e) => {
                e.preventDefault();
                const touchDuration = Date.now() - this.touchStartTime;

                if (touchDuration < 300) {
                    // 短按 - 跳跃
                    this.keys['arrowup'] = true;
                    setTimeout(() => {
                        this.keys['arrowup'] = false;
                    }, 100);
                } else {
                    // 长按结束 - 停止滑行
                    this.keys['arrowdown'] = false;
                }

                this.keys['touch'] = false;
            });

            this.canvas.addEventListener('touchmove', (e) => {
                e.preventDefault();
                const currentY = e.touches[0].clientY;
                const touchDuration = Date.now() - this.touchStartTime;

                if (touchDuration > 300 && currentY > this.touchStartY + 50) {
                    // 长按并向下滑动 - 滑行
                    this.keys['arrowdown'] = true;
                }
            });
        }

        // 按钮事件
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('backToMenuBtn').addEventListener('click', () => this.backToMenu());
        document.getElementById('soundToggle').addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleSound();
        });
        document.getElementById('instructionsBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.showInstructions();
        });

        // 难度选择
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.difficulty = e.target.dataset.difficulty;
                this.updateDifficulty();
            });
        });

        // 关闭模态框
        document.querySelector('.close-modal').addEventListener('click', () => {
            document.getElementById('instructionsModal').style.display = 'none';
        });

        // 点击模态框外部关闭
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('instructionsModal');
            if (e.target === modal) {
                modal.style.display = 'none';
            }

            const shopModal = document.getElementById('shopModal');
            if (e.target === shopModal) {
                shopModal.style.display = 'none';
            }
        });

        // 商店按钮
        document.getElementById('shopBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.showShop();
        });

        // 商店关闭按钮
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('shopModal').style.display = 'none';
            });
        });
    }

    initShop() {
        // 更新商店显示
        this.updateShopDisplay();

        // 绑定皮肤购买和选择事件
        document.querySelectorAll('.buy-skin').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const skin = e.target.dataset.skin;
                const price = parseInt(e.target.dataset.price);
                this.buySkin(skin, price);
            });
        });

        document.querySelectorAll('.select-skin').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const skin = e.target.dataset.skin;
                this.selectSkin(skin);
            });
        });
    }

    showShop() {
        this.updateShopDisplay();
        document.getElementById('shopModal').style.display = 'flex';
    }

    updateShopDisplay() {
        // 更新当前总金币
        this.totalCoins = parseInt(localStorage.getItem('totalCoins') || '0');
        document.getElementById('currentCoins').textContent = this.totalCoins;

        // 更新当前皮肤
        const currentSkin = this.skins[this.currentSkin];
        document.getElementById('currentSkinName').textContent = currentSkin.name;

        // 更新每个皮肤的状态
        Object.keys(this.skins).forEach(skinKey => {
            const skin = this.skins[skinKey];
            const skinItem = document.querySelector(`.skin-item[data-skin="${skinKey}"]`);

            if (skinItem) {
                // 更新购买/选择按钮
                const buyBtn = skinItem.querySelector('.buy-skin');
                const selectBtn = skinItem.querySelector('.select-skin');

                if (skin.unlocked) {
                    // 已解锁，显示选择按钮
                    if (buyBtn) buyBtn.style.display = 'none';
                    if (selectBtn) selectBtn.style.display = 'inline-block';

                    // 如果是当前选择的皮肤，添加选中样式
                    if (skinKey === this.currentSkin) {
                        skinItem.classList.add('selected');
                    } else {
                        skinItem.classList.remove('selected');
                    }
                } else {
                    // 未解锁，显示购买按钮
                    if (buyBtn) buyBtn.style.display = 'inline-block';
                    if (selectBtn) selectBtn.style.display = 'none';
                    skinItem.classList.remove('selected');

                    // 检查是否有足够金币购买
                    if (this.totalCoins >= skin.price) {
                        buyBtn.disabled = false;
                        buyBtn.textContent = '购买';
                    } else {
                        buyBtn.disabled = true;
                        buyBtn.textContent = '金币不足';
                    }
                }
            }
        });
    }

    buySkin(skinKey, price) {
        if (this.totalCoins >= price) {
            // 扣除总金币
            this.totalCoins -= price;
            localStorage.setItem('totalCoins', this.totalCoins);

            // 解锁皮肤
            this.skins[skinKey].unlocked = true;
            localStorage.setItem(`skin_${skinKey}`, 'true');

            // 自动选择新皮肤
            this.selectSkin(skinKey);

            // 更新商店显示
            this.updateShopDisplay();

            console.log(`成功购买${this.skins[skinKey].name}！`);
        }
    }

    selectSkin(skinKey) {
        if (this.skins[skinKey] && this.skins[skinKey].unlocked) {
            this.currentSkin = skinKey;
            localStorage.setItem('currentSkin', skinKey);
            this.updateShopDisplay();
            console.log(`已切换到${this.skins[skinKey].name}`);
        }
    }

    updateDifficulty() {
        switch(this.difficulty) {
            case 'easy':
                this.obstacleInterval = 3000; // 增加间隔
                this.coinInterval = 2500;     // 增加间隔
                this.gameSpeed = 1.0;
                this.player.jumpPower = -14;
                this.flyingBlockProbability = 0.3; // 空中方块概率
                break;
            case 'medium':
                this.obstacleInterval = 2500;
                this.coinInterval = 2000;
                this.gameSpeed = 1.2;
                this.player.jumpPower = -15;
                this.flyingBlockProbability = 0.4; // 空中方块概率
                break;
            case 'hard':
                this.obstacleInterval = 2000;
                this.coinInterval = 1500;
                this.gameSpeed = 1.5;
                this.player.jumpPower = -16;
                this.flyingBlockProbability = 0.5; // 空中方块概率
                break;
        }
        document.getElementById('speed').textContent = this.gameSpeed.toFixed(1) + 'x';
        console.log(`难度: ${this.difficulty}, 障碍物间隔: ${this.obstacleInterval}ms, 金币间隔: ${this.coinInterval}ms, 空中方块概率: ${this.flyingBlockProbability}`);
    }

    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.coins = 0; // 每局游戏金币从0开始
        this.lives = 3;
        this.distance = 0;
        this.gameTime = 0;
        this.gameSpeed = 1.0;

        this.player = {
            x: 100,
            y: this.ground.y - 45,
            width: 30,
            height: 45,
            velocityY: 0,
            isJumping: false,
            isSliding: false,
            jumpPower: this.difficulty === 'easy' ? -11 : this.difficulty === 'medium' ? -12 : -13,
            gravity: 0.6,
            slideHeight: 22
        };

        this.obstacles = [];
        this.coinsList = [];
        this.dodgeEffects = [];

        this.updateDifficulty();
        this.updateUI();

        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameOverScreen').style.display = 'none';
    }

    restartGame() {
        this.startGame();
    }

    backToMenu() {
        this.gameState = 'menu';
        document.getElementById('startScreen').style.display = 'flex';
        document.getElementById('gameOverScreen').style.display = 'none';
    }

    gameOver() {
        this.gameState = 'gameover';

        // 保存金币总数（累加）
        const totalCoins = parseInt(localStorage.getItem('totalCoins') || '0') + this.coins;
        localStorage.setItem('totalCoins', totalCoins);

        // 更新最高记录
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('parkourHighScore', this.highScore);
        }

        if (this.coins > this.highCoins) {
            this.highCoins = this.coins;
            localStorage.setItem('parkourHighCoins', this.highCoins);
        }

        if (this.gameTime > this.longestTime) {
            this.longestTime = Math.floor(this.gameTime);
            localStorage.setItem('parkourLongestTime', this.longestTime);
        }

        // 更新最终分数显示
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalCoins').textContent = this.coins;
        document.getElementById('finalSpeed').textContent = this.gameSpeed.toFixed(1) + 'x';

        // 显示游戏结束界面
        document.getElementById('gameOverScreen').style.display = 'flex';

        // 播放音效
        if (this.soundEnabled) {
            this.sounds.gameover.currentTime = 0;
            this.sounds.gameover.play().catch(e => console.log('音效播放失败:', e));
        }

        // 更新UI
        this.updateUI();
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('coins').textContent = this.coins;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('speed').textContent = this.gameSpeed.toFixed(1) + 'x';

        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('highCoins').textContent = this.highCoins;
        document.getElementById('longestTime').textContent = this.longestTime + '秒';

        document.getElementById('soundToggle').innerHTML =
            `<i class="fas fa-volume-${this.soundEnabled ? 'up' : 'mute'}"></i> 音效: ${this.soundEnabled ? '开' : '关'}`;
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.updateUI();
    }

    showInstructions() {
        document.getElementById('instructionsModal').style.display = 'flex';
    }

    createObstacle() {
        // 随机决定创建地面障碍还是空中方块
        const flyingBlockProbability = this.flyingBlockProbability || 0.4;
        const createFlyingBlock = Math.random() < flyingBlockProbability;

        if (createFlyingBlock) {
            this.createFlyingBlock();
        } else {
            this.createGroundObstacle();
        }
    }

    createGroundObstacle() {
        const types = [
            { width: 25, height: 40, color: '#e94560' }, // 高障碍（缩小）
            { width: 50, height: 25, color: '#ff6b8b' }, // 宽障碍（缩小）
            { width: 35, height: 35, color: '#ff4757' }  // 方形障碍（缩小）
        ];

        const type = types[Math.floor(Math.random() * types.length)];
        const obstacle = {
            x: this.canvas.width,
            y: this.ground.y - type.height,
            width: type.width,
            height: type.height,
            color: type.color,
            speed: 5 * this.gameSpeed,
            type: 'ground' // 标记为地面障碍
        };

        this.obstacles.push(obstacle);
    }

    createFlyingBlock() {
        // 蓝色方块出现在玩家站立时头部高度（需要下蹲才能躲避）
        const playerStandingHeadHeight = this.ground.y - this.player.height - 10; // 玩家站立时头部位置
        const minHeight = playerStandingHeadHeight - 20;
        const maxHeight = playerStandingHeadHeight + 10;

        const block = {
            x: this.canvas.width,
            y: Math.random() * (maxHeight - minHeight) + minHeight,
            width: 40,
            height: 40,
            color: '#4cc9f0', // 蓝色方块
            speed: 5 * this.gameSpeed,
            type: 'flying' // 标记为空中方块
        };

        this.obstacles.push(block);
    }

    createCoin() {
        // 使用动态计算的高度范围
        if (!this.coinMinHeight || !this.coinMaxHeight) {
            this.updateCoinHeightRange();
        }

        // 随机决定金币类型：地面金币或空中金币
        const isGroundCoin = Math.random() < 0.3; // 30%的概率生成地面金币

        let coinY;
        if (isGroundCoin) {
            // 地面金币：放在地面上方，玩家站立时就能吃到
            coinY = this.ground.y - 25; // 提高地面金币高度，让玩家不需要蹲下就能吃到
        } else {
            // 空中金币：使用原有的高度范围
            coinY = Math.random() * (this.coinMaxHeight - this.coinMinHeight) + this.coinMinHeight;
        }

        const coin = {
            x: this.canvas.width,
            y: coinY,
            radius: 12, // 缩小金币半径
            color: isGroundCoin ? '#ff9800' : '#ffd700', // 地面金币用橙色，空中金币用金色
            speed: 4 * this.gameSpeed,
            collected: false,
            isGroundCoin: isGroundCoin // 标记是否为地面金币
        };

        this.coinsList.push(coin);
    }

    createCloud() {
        const cloud = {
            x: this.canvas.width + Math.random() * 200,
            y: Math.random() * 150 + 50,
            width: 80 + Math.random() * 60,
            height: 40 + Math.random() * 30,
            speed: 1 + Math.random() * 2,
            opacity: 0.6 + Math.random() * 0.3
        };

        this.clouds.push(cloud);
    }

    updatePlayer() {
        // 跳跃控制
        if ((this.keys['arrowup'] || this.keys[' '] || this.keys['w']) && !this.player.isJumping && !this.player.isSliding) {
            this.player.velocityY = this.player.jumpPower;
            this.player.isJumping = true;

            if (this.soundEnabled) {
                this.sounds.jump.currentTime = 0;
                this.sounds.jump.play().catch(e => console.log('音效播放失败:', e));
            }
        }

        // 滑行控制
        if ((this.keys['arrowdown'] || this.keys['s']) && !this.player.isJumping) {
            this.player.isSliding = true;
            this.player.height = this.player.slideHeight;
        } else {
            this.player.isSliding = false;
            this.player.height = 60;
        }

        // 应用重力
        this.player.velocityY += this.player.gravity;
        this.player.y += this.player.velocityY;

        // 地面碰撞
        if (this.player.y > this.ground.y - this.player.height) {
            this.player.y = this.ground.y - this.player.height;
            this.player.velocityY = 0;
            this.player.isJumping = false;
        }

        // 清除按键状态（触摸控制）
        this.keys['arrowup'] = false;
        this.keys['arrowdown'] = false;
    }

    updateObstacles() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.x -= obstacle.speed;

            // 碰撞检测
            if (this.checkCollision(this.player, obstacle)) {
                // 检查是否是空中方块且玩家正在滑行
                const isFlyingBlock = obstacle.type === 'flying';
                const canDodge = isFlyingBlock && this.player.isSliding;

                if (canDodge) {
                    // 成功躲避空中方块，给予奖励
                    this.score += 5;
                    this.obstacles.splice(i, 1);

                    // 添加躲避效果
                    this.addDodgeEffect(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);

                    // 播放躲避成功音效（如果有的话）
                    console.log('成功躲避空中方块！');
                } else {
                    // 发生碰撞
                    this.lives--;
                    this.obstacles.splice(i, 1);

                    if (this.soundEnabled) {
                        this.sounds.hit.currentTime = 0;
                        this.sounds.hit.play().catch(e => console.log('音效播放失败:', e));
                    }

                    if (this.lives <= 0) {
                        this.gameOver();
                        return;
                    }
                }

                this.updateUI();
                continue;
            }

            // 移除屏幕外的障碍物
            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
                this.score += 10;
                this.updateUI();
            }
        }
    }

    updateCoins() {
        for (let i = this.coinsList.length - 1; i >= 0; i--) {
            const coin = this.coinsList[i];
            coin.x -= coin.speed;

            // 碰撞检测
            if (!coin.collected && this.checkCoinCollision(this.player, coin)) {
                coin.collected = true;
                this.coins++;
                this.score += 10;

                if (this.soundEnabled) {
                    this.sounds.coin.currentTime = 0;
                    this.sounds.coin.play().catch(e => console.log('音效播放失败:', e));
                }

                this.updateUI();
            }

            // 移除屏幕外的金币
            if (coin.x + coin.radius < 0) {
                this.coinsList.splice(i, 1);
            }
        }
    }

    updateClouds() {
        for (let i = this.clouds.length - 1; i >= 0; i--) {
            const cloud = this.clouds[i];
            cloud.x -= cloud.speed * 0.5;

            // 移除屏幕外的云
            if (cloud.x + cloud.width < 0) {
                this.clouds.splice(i, 1);
            }
        }
    }

    addDodgeEffect(x, y) {
        const effect = {
            x: x,
            y: y,
            radius: 20,
            alpha: 1.0,
            duration: 500, // 效果持续时间（毫秒）
            startTime: Date.now()
        };

        this.dodgeEffects.push(effect);
    }

    updateDodgeEffects() {
        const currentTime = Date.now();
        for (let i = this.dodgeEffects.length - 1; i >= 0; i--) {
            const effect = this.dodgeEffects[i];
            const elapsed = currentTime - effect.startTime;

            if (elapsed >= effect.duration) {
                this.dodgeEffects.splice(i, 1);
            } else {
                // 更新透明度
                effect.alpha = 1.0 - (elapsed / effect.duration);
                // 半径逐渐增大
                effect.radius = 20 + (elapsed / effect.duration) * 30;
            }
        }
    }

    drawDodgeEffects() {
        this.dodgeEffects.forEach(effect => {
            // 绘制圆形波纹效果
            this.ctx.save();
            this.ctx.globalAlpha = effect.alpha * 0.7;

            // 外层波纹
            this.ctx.strokeStyle = '#4cc9f0';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
            this.ctx.stroke();

            // 内层波纹
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(effect.x, effect.y, effect.radius * 0.7, 0, Math.PI * 2);
            this.ctx.stroke();

            // 中心亮点
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(effect.x, effect.y, 5, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.restore();

            // 绘制"躲避成功"文字
            this.ctx.save();
            this.ctx.globalAlpha = effect.alpha;
            this.ctx.fillStyle = '#4cc9f0';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('躲避成功!', effect.x, effect.y - effect.radius - 20);
            this.ctx.restore();
        });
    }

    checkCollision(player, obstacle) {
        // 基本碰撞检测
        const isColliding = player.x < obstacle.x + obstacle.width &&
                           player.x + player.width > obstacle.x &&
                           player.y < obstacle.y + obstacle.height &&
                           player.y + player.height > obstacle.y;

        // 如果是空中方块，检查玩家是否可以通过滑行躲避
        if (obstacle.type === 'flying' && isColliding) {
            // 计算玩家滑行时的高度
            const playerSlidingHeight = player.isSliding ? player.slideHeight : player.height;
            const playerSlidingY = player.y + (player.height - playerSlidingHeight);

            // 如果玩家正在滑行，并且滑行后的高度可以避开方块
            if (player.isSliding && playerSlidingY + playerSlidingHeight <= obstacle.y) {
                return false; // 成功躲避
            }
        }

        return isColliding;
    }

    checkCoinCollision(player, coin) {
        const dx = (player.x + player.width / 2) - (coin.x + coin.radius);
        const dy = (player.y + player.height / 2) - (coin.y + coin.radius);
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance < (player.width / 2) + coin.radius;
    }

    drawBackground() {
        // 天空渐变
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0a1929');
        gradient.addColorStop(1, '#0d1b2a');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制云
        this.clouds.forEach(cloud => {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;

            // 绘制云朵（多个圆形组成）
            this.ctx.beginPath();
            this.ctx.arc(cloud.x + cloud.width * 0.3, cloud.y + cloud.height * 0.5, cloud.height * 0.4, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.width * 0.5, cloud.y + cloud.height * 0.3, cloud.height * 0.5, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.width * 0.7, cloud.y + cloud.height * 0.5, cloud.height * 0.4, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // 绘制远处的山
        this.ctx.fillStyle = 'rgba(30, 40, 60, 0.8)';
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.ground.y);
        for (let i = 0; i < this.canvas.width; i += 50) {
            const height = 60 + Math.sin(i * 0.01) * 30;
            this.ctx.lineTo(i, this.ground.y - height);
        }
        this.ctx.lineTo(this.canvas.width, this.ground.y);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawGround() {
        // 地面
        this.ctx.fillStyle = '#2d3748';
        this.ctx.fillRect(0, this.ground.y, this.canvas.width, this.ground.height);

        // 地面纹理
        this.ctx.fillStyle = '#4a5568';
        for (let i = 0; i < this.canvas.width; i += 40) {
            this.ctx.fillRect(i, this.ground.y, 20, 5);
        }

        // 地面阴影
        const groundGradient = this.ctx.createLinearGradient(0, this.ground.y, 0, this.ground.y + 10);
        groundGradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
        groundGradient.addColorStop(1, 'transparent');
        this.ctx.fillStyle = groundGradient;
        this.ctx.fillRect(0, this.ground.y, this.canvas.width, 10);
    }

    drawPlayer() {
        this.ctx.save();

        // 玩家阴影
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(this.player.x + 5, this.player.y + 5, this.player.width, this.player.height);

        // 根据当前皮肤绘制玩家
        this.drawPlayerBySkin();

        this.ctx.restore();
    }

    drawPlayerBySkin() {
        const skin = this.skins[this.currentSkin];

        switch(this.currentSkin) {
            case 'default':
                this.drawDefaultPlayer();
                break;
            case 'gold':
                this.drawGoldPlayer();
                break;
            case 'diamond':
                this.drawDiamondPlayer();
                break;
            case 'rainbow':
                this.drawRainbowPlayer();
                break;
            default:
                this.drawDefaultPlayer();
        }
    }

    drawDefaultPlayer() {
        // 默认皮肤
        const playerGradient = this.ctx.createLinearGradient(
            this.player.x, this.player.y,
            this.player.x, this.player.y + this.player.height
        );
        playerGradient.addColorStop(0, '#4cc9f0');
        playerGradient.addColorStop(1, '#4361ee');

        this.ctx.fillStyle = playerGradient;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);

        // 头部
        this.ctx.fillStyle = '#4361ee';
        this.ctx.beginPath();
        this.ctx.ellipse(
            this.player.x + this.player.width / 2,
            this.player.y - 5,
            15, 10, 0, 0, Math.PI * 2
        );
        this.ctx.fill();

        // 眼睛
        this.drawPlayerEyes();
    }

    drawGoldPlayer() {
        // 黄金皮肤
        const goldGradient = this.ctx.createLinearGradient(
            this.player.x, this.player.y,
            this.player.x, this.player.y + this.player.height
        );
        goldGradient.addColorStop(0, '#ffd700');
        goldGradient.addColorStop(0.5, '#ff9800');
        goldGradient.addColorStop(1, '#ff6b00');

        this.ctx.fillStyle = goldGradient;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);

        // 头部
        this.ctx.fillStyle = '#ff9800';
        this.ctx.beginPath();
        this.ctx.ellipse(
            this.player.x + this.player.width / 2,
            this.player.y - 5,
            15, 10, 0, 0, Math.PI * 2
        );
        this.ctx.fill();

        // 眼睛
        this.drawPlayerEyes();

        // 黄金光泽
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(this.player.x + 5, this.player.y + 5, this.player.width - 10, 8);
    }

    drawDiamondPlayer() {
        // 钻石皮肤
        const diamondGradient = this.ctx.createLinearGradient(
            this.player.x, this.player.y,
            this.player.x + this.player.width, this.player.y + this.player.height
        );
        diamondGradient.addColorStop(0, '#b9f2ff');
        diamondGradient.addColorStop(0.5, '#89c2d9');
        diamondGradient.addColorStop(1, '#468faf');

        this.ctx.fillStyle = diamondGradient;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);

        // 头部
        this.ctx.fillStyle = '#89c2d9';
        this.ctx.beginPath();
        this.ctx.ellipse(
            this.player.x + this.player.width / 2,
            this.player.y - 5,
            15, 10, 0, 0, Math.PI * 2
        );
        this.ctx.fill();

        // 眼睛
        this.drawPlayerEyes();

        // 钻石光泽
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.fillRect(this.player.x + 8, this.player.y + 8, 5, this.player.height - 16);
        this.ctx.fillRect(this.player.x + this.player.width - 13, this.player.y + 8, 5, this.player.height - 16);
    }

    drawRainbowPlayer() {
        // 彩虹皮肤 - 使用彩虹渐变
        const rainbowGradient = this.ctx.createLinearGradient(
            this.player.x, this.player.y,
            this.player.x + this.player.width, this.player.y + this.player.height
        );
        rainbowGradient.addColorStop(0, '#ff0000');
        rainbowGradient.addColorStop(0.2, '#ff9900');
        rainbowGradient.addColorStop(0.4, '#ffff00');
        rainbowGradient.addColorStop(0.6, '#00ff00');
        rainbowGradient.addColorStop(0.8, '#0099ff');
        rainbowGradient.addColorStop(1, '#6633ff');

        this.ctx.fillStyle = rainbowGradient;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);

        // 头部
        const headGradient = this.ctx.createRadialGradient(
            this.player.x + this.player.width / 2,
            this.player.y - 5,
            0,
            this.player.x + this.player.width / 2,
            this.player.y - 5,
            15
        );
        headGradient.addColorStop(0, '#ff0000');
        headGradient.addColorStop(1, '#6633ff');

        this.ctx.fillStyle = headGradient;
        this.ctx.beginPath();
        this.ctx.ellipse(
            this.player.x + this.player.width / 2,
            this.player.y - 5,
            15, 10, 0, 0, Math.PI * 2
        );
        this.ctx.fill();

        // 眼睛
        this.drawPlayerEyes();

        // 彩虹光泽
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.fillRect(this.player.x + 3, this.player.y + 3, this.player.width - 6, 3);
        this.ctx.fillRect(this.player.x + 3, this.player.y + this.player.height - 6, this.player.width - 6, 3);
    }

    drawPlayerEyes() {
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x + this.player.width / 2 - 5, this.player.y - 5, 3, 0, Math.PI * 2);
        this.ctx.arc(this.player.x + this.player.width / 2 + 5, this.player.y - 5, 3, 0, Math.PI * 2);
        this.ctx.fill();

        // 眼珠
        this.ctx.fillStyle = '#333';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x + this.player.width / 2 - 5, this.player.y - 5, 1.5, 0, Math.PI * 2);
        this.ctx.arc(this.player.x + this.player.width / 2 + 5, this.player.y - 5, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawObstacles() {
        this.obstacles.forEach(obstacle => {
            if (obstacle.type === 'flying') {
                this.drawFlyingBlock(obstacle);
            } else {
                this.drawGroundObstacle(obstacle);
            }
        });
    }

    drawGroundObstacle(obstacle) {
        // 障碍物阴影
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(obstacle.x + 3, obstacle.y + 3, obstacle.width, obstacle.height);

        // 障碍物主体
        const obstacleGradient = this.ctx.createLinearGradient(
            obstacle.x, obstacle.y,
            obstacle.x, obstacle.y + obstacle.height
        );
        obstacleGradient.addColorStop(0, obstacle.color);
        obstacleGradient.addColorStop(1, this.darkenColor(obstacle.color, 30));

        this.ctx.fillStyle = obstacleGradient;
        this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

        // 障碍物纹理
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, 3);
        this.ctx.fillRect(obstacle.x + 5, obstacle.y + obstacle.height - 8, obstacle.width - 10, 3);
    }

    drawFlyingBlock(block) {
        // 空中方块发光效果
        const glowGradient = this.ctx.createRadialGradient(
            block.x + block.width / 2, block.y + block.height / 2,
            0,
            block.x + block.width / 2, block.y + block.height / 2,
            block.width * 0.8
        );
        glowGradient.addColorStop(0, 'rgba(76, 201, 240, 0.3)');
        glowGradient.addColorStop(1, 'rgba(76, 201, 240, 0)');

        this.ctx.fillStyle = glowGradient;
        this.ctx.fillRect(
            block.x - block.width * 0.3,
            block.y - block.height * 0.3,
            block.width * 1.6,
            block.height * 1.6
        );

        // 方块主体
        const blockGradient = this.ctx.createLinearGradient(
            block.x, block.y,
            block.x + block.width, block.y + block.height
        );
        blockGradient.addColorStop(0, '#4cc9f0');
        blockGradient.addColorStop(0.5, '#4361ee');
        blockGradient.addColorStop(1, '#3a0ca3');

        this.ctx.fillStyle = blockGradient;
        this.ctx.fillRect(block.x, block.y, block.width, block.height);

        // 方块边框
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(block.x + 2, block.y + 2, block.width - 4, block.height - 4);

        // 方块内部装饰
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fillRect(block.x + 8, block.y + 8, block.width - 16, 4);
        this.ctx.fillRect(block.x + 8, block.y + block.height - 12, block.width - 16, 4);
        this.ctx.fillRect(block.x + 8, block.y + 8, 4, block.height - 16);
        this.ctx.fillRect(block.x + block.width - 12, block.y + 8, 4, block.height - 16);
    }

    drawCoins() {
        this.coinsList.forEach(coin => {
            if (coin.collected) return;

            // 金币发光效果
            const glowColor = coin.isGroundCoin ? 'rgba(255, 152, 0, 0.5)' : 'rgba(255, 215, 0, 0.5)';
            const glowGradient = this.ctx.createRadialGradient(
                coin.x + coin.radius, coin.y + coin.radius,
                0,
                coin.x + coin.radius, coin.y + coin.radius,
                coin.radius * 1.5
            );
            glowGradient.addColorStop(0, glowColor);
            glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

            this.ctx.fillStyle = glowGradient;
            this.ctx.beginPath();
            this.ctx.arc(coin.x + coin.radius, coin.y + coin.radius, coin.radius * 1.5, 0, Math.PI * 2);
            this.ctx.fill();

            // 金币主体
            const startColor = coin.isGroundCoin ? '#ff9800' : '#ffd700';
            const endColor = coin.isGroundCoin ? '#ff6b00' : '#ff9800';

            const coinGradient = this.ctx.createRadialGradient(
                coin.x + coin.radius * 0.3, coin.y + coin.radius * 0.3,
                0,
                coin.x + coin.radius, coin.y + coin.radius,
                coin.radius
            );
            coinGradient.addColorStop(0, startColor);
            coinGradient.addColorStop(1, endColor);

            this.ctx.fillStyle = coinGradient;
            this.ctx.beginPath();
            this.ctx.arc(coin.x + coin.radius, coin.y + coin.radius, coin.radius, 0, Math.PI * 2);
            this.ctx.fill();

            // 金币符号
            this.ctx.fillStyle = coin.isGroundCoin ? '#ff4500' : '#ff6b00';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('$', coin.x + coin.radius, coin.y + coin.radius);

            // 如果是地面金币，添加地面阴影效果
            if (coin.isGroundCoin) {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                this.ctx.beginPath();
                this.ctx.ellipse(
                    coin.x + coin.radius,
                    coin.y + coin.radius + 3,
                    coin.radius * 0.8,
                    coin.radius * 0.3,
                    0, 0, Math.PI * 2
                );
                this.ctx.fill();
            }
        });
    }

    drawHUD() {
        // 分数显示
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 200, 80);

        this.ctx.fillStyle = '#4cc9f0';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillText(`分数: ${this.score}`, 20, 40);
        this.ctx.fillText(`金币: ${this.coins}`, 20, 70);
        this.ctx.fillText(`生命: ${'❤️'.repeat(this.lives)}`, 120, 40);
        this.ctx.fillText(`速度: ${this.gameSpeed.toFixed(1)}x`, 120, 70);

        // 距离显示
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(this.canvas.width - 210, 10, 200, 40);

        this.ctx.fillStyle = '#e94560';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`距离: ${Math.floor(this.distance)}米`, this.canvas.width - 20, 40);
        this.ctx.textAlign = 'left';
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;

        return '#' + (
            0x1000000 +
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1);
    }

    gameLoop(timestamp) {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.gameState === 'playing') {
            // 更新游戏时间
            if (!this.lastFrameTime) this.lastFrameTime = timestamp;
            const deltaTime = timestamp - this.lastFrameTime;
            this.lastFrameTime = timestamp;

            this.gameTime += deltaTime / 1000;
            this.distance += this.gameSpeed * deltaTime / 100;

            // 每30秒增加速度
            if (Math.floor(this.gameTime) % 30 === 0 && Math.floor(this.gameTime) > 0) {
                if (!this.speedIncreased) {
                    this.gameSpeed += 0.1;
                    this.speedIncreased = true;
                    this.updateUI();
                }
            } else {
                this.speedIncreased = false;
            }

            // 智能生成系统 - 避免金币和障碍物出现得太近
            const timeSinceLastObstacle = timestamp - this.lastObstacleTime;
            const timeSinceLastCoin = timestamp - this.lastCoinTime;

            // 确保至少间隔一定时间再生成新物体
            const minInterval = 800; // 最小间隔800ms

            // 生成障碍物
            if (timeSinceLastObstacle > this.obstacleInterval &&
                timeSinceLastCoin > minInterval) {
                this.createObstacle();
                this.lastObstacleTime = timestamp;
                this.lastGeneratedType = 'obstacle';
            }

            // 生成金币
            if (timeSinceLastCoin > this.coinInterval &&
                timeSinceLastObstacle > minInterval) {
                this.createCoin();
                this.lastCoinTime = timestamp;
                this.lastGeneratedType = 'coin';
            }

            // 生成云
            if (timestamp - this.lastCloudTime > this.cloudInterval) {
                this.createCloud();
                this.lastCloudTime = timestamp;
            }

            // 更新游戏元素
            this.updatePlayer();
            this.updateObstacles();
            this.updateCoins();
            this.updateClouds();
            this.updateDodgeEffects();
        }

        // 绘制游戏
        this.drawBackground();
        this.drawGround();
        this.drawCoins();
        this.drawObstacles();
        this.drawPlayer();
        this.drawDodgeEffects(); // 绘制躲避效果

        if (this.gameState === 'playing') {
            this.drawHUD();
        }

        // 继续游戏循环
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }
}

// 初始化游戏
function initGame() {
    try {
        // 显示加载提示
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'flex';

        // 检查浏览器兼容性
        if (!window.requestAnimationFrame) {
            throw new Error('您的浏览器不支持requestAnimationFrame，请使用现代浏览器');
        }

        // 检查Canvas支持
        const canvas = document.getElementById('gameCanvas');
        if (!canvas || !canvas.getContext) {
            throw new Error('您的浏览器不支持Canvas，请使用现代浏览器');
        }

        // 创建游戏实例
        const game = new ParkourGame();

        // 隐藏加载提示
        setTimeout(() => {
            if (loading) loading.style.display = 'none';
        }, 500);

        // 添加加载完成提示
        console.log('跑酷游戏加载完成！');
        console.log('控制方式：');
        console.log('- 电脑：上箭头/空格键跳跃，下箭头滑行');
        console.log('- 手机：点击屏幕跳跃，长按滑行');

        return game;
    } catch (error) {
        console.error('游戏初始化失败:', error);

        // 显示错误信息
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(233, 69, 96, 0.95);
            color: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            z-index: 10000;
            max-width: 90%;
            width: 400px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.5);
            border: 2px solid white;
        `;

        errorDiv.innerHTML = `
            <h3 style="margin-bottom: 15px; color: white; font-size: 1.5rem;">
                <i class="fas fa-exclamation-triangle"></i> 游戏加载失败
            </h3>
            <p style="margin-bottom: 20px; line-height: 1.5; font-size: 1.1rem;">
                ${error.message}<br><br>
                <small style="opacity: 0.8;">
                    建议：<br>
                    1. 使用Chrome、Firefox等现代浏览器<br>
                    2. 检查网络连接<br>
                    3. 确保JavaScript已启用
                </small>
            </p>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button onclick="location.reload()" style="
                    background: white;
                    color: #e94560;
                    border: none;
                    padding: 12px 25px;
                    border-radius: 8px;
                    font-weight: bold;
                    cursor: pointer;
                    font-size: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                ">
                    <i class="fas fa-redo"></i> 重新加载
                </button>
                <button onclick="document.body.removeChild(this.parentElement.parentElement)" style="
                    background: transparent;
                    color: white;
                    border: 2px solid white;
                    padding: 12px 25px;
                    border-radius: 8px;
                    font-weight: bold;
                    cursor: pointer;
                    font-size: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                ">
                    <i class="fas fa-times"></i> 关闭
                </button>
            </div>
        `;

        document.body.appendChild(errorDiv);

        // 隐藏加载提示
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';

        return null;
    }
}

// 页面加载完成后初始化游戏
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    // DOMContentLoaded已经触发
    initGame();
}

// 防止手机端双击缩放
document.addEventListener('touchstart', function(event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
}, { passive: false });

// 防止手机端手势缩放
document.addEventListener('gesturestart', function(event) {
    event.preventDefault();
});

// 添加手机端优化提示
if ('ontouchstart' in window) {
    console.log('检测到移动设备，已启用触摸优化');

    // 添加手机端提示
    setTimeout(() => {
        const tip = document.createElement('div');
        tip.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(76, 201, 240, 0.9);
            color: white;
            padding: 15px 25px;
            border-radius: 25px;
            font-size: 0.9rem;
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            animation: fadeInUp 0.5s ease-out;
        `;

        tip.innerHTML = `
            <i class="fas fa-mobile-alt"></i>
            <span>提示：点击屏幕跳跃，长按滑行</span>
            <button onclick="this.parentElement.style.display='none'" style="
                background: transparent;
                border: none;
                color: white;
                margin-left: 10px;
                cursor: pointer;
            ">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(tip);

        // 3秒后自动隐藏
        setTimeout(() => {
            if (tip.parentElement) {
                tip.style.opacity = '0';
                tip.style.transition = 'opacity 0.5s';
                setTimeout(() => {
                    if (tip.parentElement) {
                        tip.parentElement.removeChild(tip);
                    }
                }, 500);
            }
        }, 3000);
    }, 1000);
}
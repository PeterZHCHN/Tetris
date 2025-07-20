document.addEventListener('DOMContentLoaded', () => {
    // 获取Canvas元素和上下文
    const canvas = document.getElementById('tetris');
    const ctx = canvas.getContext('2d');
    const nextCanvas = document.getElementById('next-piece');
    const nextCtx = nextCanvas.getContext('2d');
    
    // 设置方块大小和游戏区域尺寸
    const blockSize = 30;
    const rows = 20;
    const cols = 10;
    
    // 游戏状态
    let score = 0;
    let level = 1;
    let linesCleared = 0;
    let gameOver = false;
    let isPaused = false;
    let dropCounter = 0;
    let dropInterval = 1000;
    let lastTime = 0;
    
    // 游戏板
    const board = Array.from({length: rows}, () => Array(cols).fill(0));
    
    // 方块形状和颜色
    const pieces = [
        { shape: [[1, 1, 1, 1]], color: '#00ffff' },
        { shape: [[1, 1, 1], [0, 1, 0]], color: '#ff00ff' },
        { shape: [[1, 1, 1], [1, 0, 0]], color: '#ff9900' },
        { shape: [[1, 1, 1], [0, 0, 1]], color: '#0000ff' },
        { shape: [[1, 1], [1, 1]], color: '#ffff00' },
        { shape: [[0, 1, 1], [1, 1, 0]], color: '#00ff00' },
        { shape: [[1, 1, 0], [0, 1, 1]], color: '#ff0000' }
    ];
    
    // 当前方块和下一个方块
    let currentPiece = null;
    let nextPiece = null;
    
    // 游戏元素
    const scoreElement = document.getElementById('score');
    const levelElement = document.getElementById('level');
    const finalScoreElement = document.getElementById('final-score');
    const finalLevelElement = document.getElementById('final-level');
    const gameOverElement = document.getElementById('game-over');
    const startButton = document.getElementById('start-btn');
    const pauseButton = document.getElementById('pause-btn');
    const restartButton = document.getElementById('restart-btn');
    const starElements = document.querySelectorAll('.star');
    
    // 初始化游戏
    function init() {
        createParticles();
        resetGame();
        startButton.addEventListener('click', startGame);
        pauseButton.addEventListener('click', togglePause);
        restartButton.addEventListener('click', resetGame);
        
        document.addEventListener('keydown', event => {
            if (gameOver || isPaused) return;
            
            switch(event.keyCode) {
                case 37: movePiece(-1); break;
                case 39: movePiece(1); break;
                case 40: movePiece(0, 1); break;
                case 38: rotatePiece(); break;
                case 32: hardDrop(); break;
            }
        });
    }
    
    // 重置游戏
    function resetGame() {
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                board[y][x] = 0;
            }
        }
        
        score = 0;
        level = 1;
        linesCleared = 0;
        gameOver = false;
        isPaused = false;
        dropInterval = 1000;
        
        updateScore();
        updateLevel();
        gameOverElement.style.display = 'none';
        
        if (!nextPiece) nextPiece = randomPiece();
        spawnPiece();
    }
    
    // 开始游戏
    function startGame() {
        if (gameOver) resetGame();
        isPaused = false;
        lastTime = 0;
        window.requestAnimationFrame(gameLoop);
    }
    
    // 暂停/继续游戏
    function togglePause() {
        isPaused = !isPaused;
        if (!isPaused && !gameOver) {
            lastTime = 0;
            window.requestAnimationFrame(gameLoop);
        }
        pauseButton.textContent = isPaused ? '继续' : '暂停';
    }
    
    // 游戏主循环
    function gameLoop(time = 0) {
        if (isPaused || gameOver) return;
        
        const deltaTime = time - lastTime;
        lastTime = time;
        
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            movePiece(0, 1);
            dropCounter = 0;
        }
        
        draw();
        drawNextPiece();
        window.requestAnimationFrame(gameLoop);
    }
    
    // 绘制游戏
    function draw() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawBoard();
        
        if (currentPiece) drawPiece(currentPiece);
        
        ctx.strokeStyle = 'rgba(0, 255, 204, 0.2)';
        ctx.lineWidth = 0.5;
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                ctx.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
            }
        }
    }
    
    // 绘制游戏板
    function drawBoard() {
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (board[y][x]) {
                    drawBlock(x, y, board[y][x]);
                }
            }
        }
    }
    
    // 绘制方块
    function drawPiece(piece) {
        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) drawBlock(piece.x + x, piece.y + y, piece.color);
            });
        });
    }
    
    // 绘制单个方块
    function drawBlock(x, y, color) {
        const gradient = ctx.createRadialGradient(
            x * blockSize + blockSize/2,
            y * blockSize + blockSize/2,
            0,
            x * blockSize + blockSize/2,
            y * blockSize + blockSize/2,
            blockSize/2
        );
        
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, '#000');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
    }
    
    // 绘制下一个方块
    function drawNextPiece() {
        nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
        if (!nextPiece) return;
        
        const piece = {
            ...nextPiece,
            x: Math.floor((4 - nextPiece.shape[0].length) / 2),
            y: Math.floor((4 - nextPiece.shape.length) / 2)
        };
        
        const scale = nextCanvas.width / 120;
        nextCtx.save();
        nextCtx.scale(scale, scale);
        
        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    nextCtx.fillStyle = piece.color;
                    nextCtx.fillRect(piece.x * 30 + x * 30 + 5, piece.y * 30 + y * 30 + 5, 25, 25);
                    nextCtx.shadowColor = piece.color;
                    nextCtx.shadowBlur = 10;
                    nextCtx.fillRect(piece.x * 30 + x * 30 + 5, piece.y * 30 + y * 30 + 5, 25, 25);
                    nextCtx.shadowBlur = 0;
                    nextCtx.strokeStyle = '#fff';
                    nextCtx.lineWidth = 1;
                    nextCtx.strokeRect(piece.x * 30 + x * 30 + 5, piece.y * 30 + y * 30 + 5, 25, 25);
                }
            });
        });
        
        nextCtx.restore();
    }
    
    // 生成随机方块
    function randomPiece() {
        const piece = JSON.parse(JSON.stringify(pieces[Math.floor(Math.random() * pieces.length)]));
        piece.x = Math.floor((cols - piece.shape[0].length) / 2);
        piece.y = 0;
        return piece;
    }
    
    // 生成新方块
    function spawnPiece() {
        currentPiece = nextPiece || randomPiece();
        nextPiece = randomPiece();
        if (collision()) {
            gameOver = true;
            showGameOver();
        }
    }
    
    // 移动方块
    function movePiece(dx, dy = 0) {
        if (!currentPiece) return;
        
        currentPiece.x += dx;
        currentPiece.y += dy;
        
        if (collision()) {
            currentPiece.x -= dx;
            currentPiece.y -= dy;
            
            if (dy) {
                mergePiece();
                clearLines();
                spawnPiece();
                dropCounter = 0;
            }
        }
    }
    
    // 旋转方块
    function rotatePiece() {
        if (!currentPiece) return;
        
        const originalShape = currentPiece.shape;
        const rows = currentPiece.shape.length;
        const cols = currentPiece.shape[0].length;
        
        const rotated = Array.from({length: cols}, (_, y) => 
            Array.from({length: rows}, (_, x) => 
                currentPiece.shape[rows - 1 - x][y]
            )
        );
        
        currentPiece.shape = rotated;
        
        if (collision()) {
            const kicks = [-1, 1, -2, 2];
            for (const kick of kicks) {
                currentPiece.x += kick;
                if (!collision()) return;
                currentPiece.x -= kick;
            }
            currentPiece.shape = originalShape;
        }
    }
    
    // 快速下落
    function hardDrop() {
        while (!collision(0, 1)) currentPiece.y++;
        mergePiece();
        clearLines();
        spawnPiece();
        dropCounter = 0;
    }
    
    // 检测碰撞
    function collision(dx = 0, dy = 0) {
        for (let y = 0; y < currentPiece.shape.length; y++) {
            for (let x = 0; x < currentPiece.shape[y].length; x++) {
                if (!currentPiece.shape[y][x]) continue;
                
                const newX = currentPiece.x + x + dx;
                const newY = currentPiece.y + y + dy;
                
                if (newX < 0 || newX >= cols || newY >= rows || (newY >= 0 && board[newY][newX])) {
                    return true;
                }
            }
        }
        return false;
    }
    
    // 合并方块到游戏板
    function mergePiece() {
        for (let y = 0; y < currentPiece.shape.length; y++) {
            for (let x = 0; x < currentPiece.shape[y].length; x++) {
                if (currentPiece.shape[y][x]) {
                    const boardY = currentPiece.y + y;
                    if (boardY >= 0) board[boardY][currentPiece.x + x] = currentPiece.color;
                }
            }
        }
    }
    
    // 清除完整的行
    function clearLines() {
        let lines = 0;
        
        for (let y = rows - 1; y >= 0; y--) {
            if (board[y].every(cell => cell)) {
                board.splice(y, 1);
                board.unshift(Array(cols).fill(0));
                lines++;
                y++;
            }
        }
        
        if (lines > 0) {
            const points = [0, 100, 300, 500, 800][lines] * level;
            score += points;
            linesCleared += lines;
            
            const newLevel = Math.floor(linesCleared / 10) + 1;
            if (newLevel > level) {
                level = newLevel;
                dropInterval = Math.max(100, 1000 - (level - 1) * 100);
                updateLevel();
            }
            
            updateScore();
            createExplosion(lines);
        }
    }
    
    // 更新分数显示
    function updateScore() {
        scoreElement.textContent = score;
    }
    
    // 更新等级显示
    function updateLevel() {
        levelElement.textContent = level;
        starElements.forEach((star, index) => {
            star.classList.toggle('active', (level >= 3*index + 1) && (index < 2 || level >= 7));
        });
    }
    
    // 显示游戏结束
    function showGameOver() {
        finalScoreElement.textContent = score;
        finalLevelElement.textContent = level;
        gameOverElement.style.display = 'flex';
        createGameOverParticles();
    }
    
    // 创建粒子效果
    function createParticles() {
        for (let i = 0; i < 50; i++) createParticle();
    }
    
    function createParticle() {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        const size = Math.random() * 5 + 1;
        const posX = Math.random() * window.innerWidth;
        const posY = Math.random() * window.innerHeight;
        const duration = Math.random() * 10 + 10;
        const delay = Math.random() * 5;
        const opacity = Math.random() * 0.5 + 0.1;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}px`;
        particle.style.top = `${posY}px`;
        particle.style.opacity = opacity;
        particle.style.animation = `float ${duration}s linear ${delay}s infinite`;
        
        document.body.appendChild(particle);
        
        setTimeout(() => {
            particle.remove();
            createParticle();
        }, (duration + delay) * 1000);
    }
    
    // 创建消除行的爆炸效果
    function createExplosion(lines) {
        const colors = ['#00ffcc', '#ff00ff', '#ffff00', '#ff9900'];
        
        for (let i = 0; i < lines * 20; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.classList.add('particle');
                
                const size = Math.random() * 8 + 2;
                const posX = Math.random() * canvas.width + canvas.offsetLeft;
                const posY = Math.random() * canvas.height / 2 + canvas.offsetTop + canvas.height / 2;
                const duration = Math.random() * 2 + 1;
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
                particle.style.left = `${posX}px`;
                particle.style.top = `${posY}px`;
                particle.style.backgroundColor = color;
                particle.style.boxShadow = `0 0 10px ${color}`;
                
                document.body.appendChild(particle);
                
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 100 + 50;
                const endX = posX + Math.cos(angle) * distance;
                const endY = posY + Math.sin(angle) * distance - 50;
                
                particle.animate([
                    { transform: 'translate(0, 0)', opacity: 1 },
                    { transform: `translate(${endX - posX}px, ${endY - posY}px)`, opacity: 0 }
                ], { duration: duration * 1000, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' });
                
                setTimeout(() => particle.remove(), duration * 1000);
            }, Math.random() * 500);
        }
    }
    
    // 创建游戏结束粒子效果
    function createGameOverParticles() {
        for (let i = 0; i < 100; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.classList.add('particle');
                
                const size = Math.random() * 10 + 5;
                const posX = canvas.offsetLeft + canvas.width / 2;
                const posY = canvas.offsetTop + canvas.height / 2;
                const duration = Math.random() * 3 + 2;
                const color = i % 2 ? '#ff3366' : '#00ffcc';
                
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
                particle.style.left = `${posX}px`;
                particle.style.top = `${posY}px`;
                particle.style.backgroundColor = color;
                particle.style.boxShadow = `0 0 15px ${color}`;
                
                document.body.appendChild(particle);
                
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 300 + 100;
                const endX = posX + Math.cos(angle) * distance;
                const endY = posY + Math.sin(angle) * distance;
                
                particle.animate([
                    { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                    { transform: `translate(${endX - posX}px, ${endY - posY}px) scale(0.2)`, opacity: 0 }
                ], { duration: duration * 1000, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' });
                
                setTimeout(() => particle.remove(), duration * 1000);
            }, Math.random() * 1000);
        }
    }
    
    // 初始化游戏
    init();
});
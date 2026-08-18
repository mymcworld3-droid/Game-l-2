const joystick = document.getElementById("joystick");
const knob = document.getElementById("joystick-knob");
const player = document.getElementById("player");
const attackButton = document.getElementById("attack-button");
const dummy = document.getElementById("dummy");
const dummyBody = document.getElementById("dummy-body");
const dummyHpBar = document.getElementById("dummy-hp-bar");
const dummyHpText = document.getElementById("dummy-hp-text");
const gameWorld = document.getElementById("game-world");

// =========================
// 玩家座標 / 移動
// =========================

let playerX = window.innerWidth / 2;
let playerY = window.innerHeight / 2;
let lastFrameTime = performance.now();

function updatePlayer() {
    player.style.left = `${playerX}px`;
    player.style.top = `${playerY}px`;
}

// =========================
// Dummy 座標
// =========================

const dummyX = () => window.innerWidth * 0.70;
const dummyY = () => window.innerHeight * 0.50;

function updateDummyPosition() {
    dummy.style.left = `${dummyX()}px`;
    dummy.style.top = `${dummyY()}px`;
}

// =========================
// 自由虛擬搖桿
// 只有左下 1/4 區域可以啟動
// =========================

let joystickActive = false;
let joystickX = 0;
let joystickY = 0;
let joystickPointerId = null;

const joystickSize = 140;
const joystickRadius = joystickSize / 2;
const knobRadius = 35;
const maxDistance = joystickRadius - knobRadius;

function isInLeftBottomQuarter(clientX, clientY) {
    return (
        clientX <= window.innerWidth / 2 &&
        clientY >= window.innerHeight / 2
    );
}

function startJoystick(clientX, clientY, pointerId = null) {
    if (!isInLeftBottomQuarter(clientX, clientY)) return false;

    joystickActive = true;
    joystickPointerId = pointerId;

    joystick.style.left = `${clientX}px`;
    joystick.style.top = `${clientY}px`;
    joystick.classList.add("active");

    moveJoystick(clientX, clientY);
    return true;
}

function moveJoystick(clientX, clientY) {
    if (!joystickActive) return;

    const centerX = parseFloat(joystick.style.left);
    const centerY = parseFloat(joystick.style.top);

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > maxDistance) {
        dx = (dx / distance) * maxDistance;
        dy = (dy / distance) * maxDistance;
    }

    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    joystickX = dx / maxDistance;
    joystickY = dy / maxDistance;
}

function resetJoystick() {
    joystickActive = false;
    joystickPointerId = null;
    joystickX = 0;
    joystickY = 0;
    knob.style.transform = "translate(-50%, -50%)";
    joystick.classList.remove("active");
}

// =========================
// Touch 搖桿
// =========================

document.addEventListener("touchstart", (event) => {
    if (event.target === attackButton) return;
    if (joystickActive) return;

    const touch = event.changedTouches[0];
    startJoystick(touch.clientX, touch.clientY, touch.identifier);
}, { passive: false });

document.addEventListener("touchmove", (event) => {
    if (!joystickActive) return;

    for (const touch of event.changedTouches) {
        if (touch.identifier === joystickPointerId) {
            event.preventDefault();
            moveJoystick(touch.clientX, touch.clientY);
            break;
        }
    }
}, { passive: false });

document.addEventListener("touchend", (event) => {
    if (!joystickActive) return;

    for (const touch of event.changedTouches) {
        if (touch.identifier === joystickPointerId) {
            resetJoystick();
            break;
        }
    }
}, { passive: false });

// =========================
// 滑鼠測試
// =========================

document.addEventListener("mousedown", (event) => {
    if (event.target === attackButton) return;
    if (joystickActive) return;
    startJoystick(event.clientX, event.clientY);
});

document.addEventListener("mousemove", (event) => {
    if (!joystickActive) return;
    moveJoystick(event.clientX, event.clientY);
});

document.addEventListener("mouseup", () => {
    if (joystickActive) resetJoystick();
});

// =========================
// 玩家移動
// moveSpeed = 650 px / 秒
// =========================

function gameLoop(now) {
    const deltaTime = Math.min((now - lastFrameTime) / 1000, 0.05);
    lastFrameTime = now;

    if (joystickActive) {
        playerX += joystickX * playerStats.moveSpeed * deltaTime;
        playerY += joystickY * playerStats.moveSpeed * deltaTime;

        const halfPlayer = 25;
        playerX = Math.max(halfPlayer, Math.min(window.innerWidth - halfPlayer, playerX));
        playerY = Math.max(halfPlayer, Math.min(window.innerHeight - halfPlayer, playerY));
        updatePlayer();
    }

    requestAnimationFrame(gameLoop);
}

// =========================
// Dummy 血條
// =========================

function updateDummyHealth() {
    const percentage = Math.max(0, dummyStats.health / dummyStats.maxHealth) * 100;
    dummyHpBar.style.width = `${percentage}%`;
    dummyHpText.textContent = `${dummyStats.health} / ${dummyStats.maxHealth}`;
}

// =========================
// 傷害飄字
// =========================

function showDamageNumber(damage) {
    const number = document.createElement("div");
    number.className = "damage-number";
    number.textContent = `-${damage}`;

    // 飄字從 Dummy 上方開始
    number.style.left = `${dummyX()}px`;
    number.style.top = `${dummyY() - 65}px`;

    gameWorld.appendChild(number);

    setTimeout(() => {
        number.remove();
    }, 700);
}

// =========================
// 攻擊冷卻
// 0.5 秒只能攻擊一次
// =========================

let lastAttackTime = -Infinity;

function isDummyInAttackRange() {
    const dx = playerX - dummyX();
    const dy = playerY - dummyY();
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 玩家半徑 + Dummy 約半徑後，再使用攻擊範圍判定
    return distance <= combatConfig.attackRange + 45;
}

function attack() {
    const now = performance.now();

    if (now - lastAttackTime < combatConfig.attackCooldown) {
        return;
    }

    lastAttackTime = now;

    // 攻擊動畫
    player.style.transform = "translate(-50%, -50%) scale(1.3)";
    setTimeout(() => {
        player.style.transform = "translate(-50%, -50%) scale(1)";
    }, 100);

    // Dummy 已死亡，不再受到攻擊
    if (dummyStats.health <= 0) return;

    // 超出攻擊距離：只有揮空，不造成傷害
    if (!isDummyInAttackRange()) {
        console.log("普攻揮空：Dummy 不在攻擊範圍內");
        return;
    }

    const damage = Math.max(1, playerStats.attack - dummyStats.defense);
    dummyStats.health = Math.max(0, dummyStats.health - damage);

    updateDummyHealth();
    showDamageNumber(damage);

    // Dummy 受擊效果
    dummyBody.style.transform = "translateX(-50%) scale(1.12)";
    setTimeout(() => {
        dummyBody.style.transform = "translateX(-50%) scale(1)";
    }, 100);

    console.log(`造成 ${damage} 傷害，Dummy HP：${dummyStats.health}/${dummyStats.maxHealth}`);

    if (dummyStats.health <= 0) {
        dummyBody.textContent = "DEAD";
        dummyBody.style.opacity = "0.45";
        console.log("Dummy死亡");
    }
}

attackButton.addEventListener("touchstart", (event) => {
    event.preventDefault();
    event.stopPropagation();
    attack();
}, { passive: false });

attackButton.addEventListener("mousedown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    attack();
});

// =========================
// 視窗大小改變
// =========================

window.addEventListener("resize", () => {
    playerX = Math.max(25, Math.min(window.innerWidth - 25, playerX));
    playerY = Math.max(25, Math.min(window.innerHeight - 25, playerY));
    updatePlayer();
    updateDummyPosition();
});

// =========================
// 開始遊戲
// =========================

updatePlayer();
updateDummyPosition();
updateDummyHealth();
requestAnimationFrame(gameLoop);

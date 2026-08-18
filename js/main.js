const joystick = document.getElementById("joystick");
const knob = document.getElementById("joystick-knob");
const player = document.getElementById("player");
const attackButton = document.getElementById("attack-button");
const knife = document.getElementById("knife");
const attackRange = document.getElementById("attack-range");
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

// 玩家面向角度：0 = 向右
let playerFacingAngle = 0;

function updatePlayer() {
    player.style.left = `${playerX}px`;
    player.style.top = `${playerY}px`;
}

function setPlayerFacing(angle) {
    playerFacingAngle = angle;
    knife.style.transform = `translateY(-50%) rotate(${angle}rad)`;
    attackRange.style.transform = `translateY(-50%) rotate(${angle}rad)`;
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
    return clientX <= window.innerWidth / 2 && clientY >= window.innerHeight / 2;
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

        // 移動時，角色自然面向移動方向
        if (Math.abs(joystickX) > 0.05 || Math.abs(joystickY) > 0.05) {
            setPlayerFacing(Math.atan2(joystickY, joystickX));
        }

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
    number.style.left = `${dummyX()}px`;
    number.style.top = `${dummyY() - 65}px`;
    gameWorld.appendChild(number);

    setTimeout(() => number.remove(), 700);
}

// =========================
// 小刀攻擊判定
// 70 長 x 46 寬的矩形，會跟著玩家面向旋轉
// =========================

function isTargetInKnifeRange(targetX, targetY) {
    const dx = targetX - playerX;
    const dy = targetY - playerY;

    // 將目標座標轉換到「小刀朝向的本地座標」
    const cos = Math.cos(playerFacingAngle);
    const sin = Math.sin(playerFacingAngle);

    const localX = dx * cos + dy * sin;
    const localY = -dx * sin + dy * cos;

    // 小刀從玩家中心向前延伸 70，寬度 46
    const halfPlayer = 25;
    const halfWidth = defaultWeapon.attackWidth / 2;

    return (
        localX >= halfPlayer &&
        localX <= halfPlayer + defaultWeapon.attackRange &&
        Math.abs(localY) <= halfWidth + 36
    );
}

// =========================
// 自動選取攻擊目標
// 現階段只有 Dummy，因此直接選 Dummy
// =========================

function findAttackTarget() {
    if (dummyStats.health <= 0) return null;

    if (isTargetInKnifeRange(dummyX(), dummyY())) {
        return {
            x: dummyX(),
            y: dummyY(),
            body: dummyBody
        };
    }

    return null;
}

// =========================
// 攻擊冷卻 + 自動面向 + 小刀攻擊
// =========================

let lastAttackTime = -Infinity;
let knifeAnimating = false;

function attack() {
    const now = performance.now();

    if (now - lastAttackTime < defaultWeapon.attackCooldown) {
        return;
    }

    lastAttackTime = now;

    const target = findAttackTarget();

    // 有目標：自動面向目標
    if (target) {
        const angle = Math.atan2(target.y - playerY, target.x - playerX);
        setPlayerFacing(angle);
    }

    // 小刀揮擊動畫
    if (!knifeAnimating) {
        knifeAnimating = true;
        knife.classList.add("knife-swing");

        setTimeout(() => {
            knife.classList.remove("knife-swing");
            knifeAnimating = false;
        }, 160);
    }

    // 沒有目標或不在矩形範圍內：揮空
    if (!target) {
        console.log("小刀揮空：攻擊範圍內沒有目標");
        return;
    }

    const damage = Math.max(1, playerStats.attack - dummyStats.defense);
    dummyStats.health = Math.max(0, dummyStats.health - damage);

    updateDummyHealth();
    showDamageNumber(damage);

    dummyBody.style.transform = "translateX(-50%) scale(1.12)";
    setTimeout(() => {
        dummyBody.style.transform = "translateX(-50%) scale(1)";
    }, 100);

    console.log(`小刀命中 Dummy，造成 ${damage} 傷害，HP：${dummyStats.health}/${dummyStats.maxHealth}`);

    if (dummyStats.health <= 0) {
        dummyBody.textContent = "DEAD";
        dummyBody.style.opacity = "0.45";
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
setPlayerFacing(0);
requestAnimationFrame(gameLoop);

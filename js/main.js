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

let playerX = window.innerWidth / 2;
let playerY = window.innerHeight / 2;
let lastFrameTime = performance.now();
let playerFacingAngle = 0;
let facingDirection = "right";

function updatePlayer() {
    player.style.left = `${playerX}px`;
    player.style.top = `${playerY}px`;
}

// 角色本體永遠不旋轉；只有小刀依左右方向改變角度
function setFacingDirection(direction) {
    facingDirection = direction;

    if (direction === "left") {
        player.style.transform = "translate(-50%, -50%) scaleX(-1)";
        knife.style.transform = "translateY(-50%) scaleX(-1) rotate(45deg)";
        attackRange.style.transform = "translateY(-50%) scaleX(-1)";
    } else {
        player.style.transform = "translate(-50%, -50%) scaleX(1)";
        knife.style.transform = "translateY(-50%) rotate(-45deg)";
        attackRange.style.transform = "translateY(-50%)";
    }
}

function faceTarget(targetX) {
    setFacingDirection(targetX < playerX ? "left" : "right");
}

const dummyX = () => window.innerWidth * 0.70;
const dummyY = () => window.innerHeight * 0.50;

function updateDummyPosition() {
    dummy.style.left = `${dummyX()}px`;
    dummy.style.top = `${dummyY()}px`;
}

// =========================
// 自由虛擬搖桿：只在左下 1/4 啟動
// =========================
let joystickActive = false;
let joystickX = 0;
let joystickY = 0;
let joystickPointerId = null;

const joystickRadius = 70;
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
    if (event.target === attackButton || joystickActive) return;
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
    if (event.target === attackButton || joystickActive) return;
    startJoystick(event.clientX, event.clientY);
});

document.addEventListener("mousemove", (event) => {
    if (joystickActive) moveJoystick(event.clientX, event.clientY);
});

document.addEventListener("mouseup", () => {
    if (joystickActive) resetJoystick();
});

// =========================
// 玩家移動
// =========================
function gameLoop(now) {
    const deltaTime = Math.min((now - lastFrameTime) / 1000, 0.05);
    lastFrameTime = now;

    if (joystickActive) {
        playerX += joystickX * playerStats.moveSpeed * deltaTime;
        playerY += joystickY * playerStats.moveSpeed * deltaTime;

        playerX = Math.max(25, Math.min(window.innerWidth - 25, playerX));
        playerY = Math.max(25, Math.min(window.innerHeight - 25, playerY));

        // 只判定左右，角色本體不旋轉
        if (joystickX < -0.05) setFacingDirection("left");
        else if (joystickX > 0.05) setFacingDirection("right");

        updatePlayer();
    }

    requestAnimationFrame(gameLoop);
}

function updateDummyHealth() {
    const percentage = Math.max(0, dummyStats.health / dummyStats.maxHealth) * 100;
    dummyHpBar.style.width = `${percentage}%`;
    dummyHpText.textContent = `${dummyStats.health} / ${dummyStats.maxHealth}`;
}

function showDamageNumber(damage) {
    const number = document.createElement("div");
    number.className = "damage-number";
    number.textContent = `-${damage}`;
    number.style.left = `${dummyX()}px`;
    number.style.top = `${dummyY() - 65}px`;
    gameWorld.appendChild(number);
    setTimeout(() => number.remove(), 700);
}

// 小刀只要距離玩家 70 以內即可攻擊
function isTargetInKnifeRange(targetX, targetY) {
    const dx = targetX - playerX;
    const dy = targetY - playerY;
    return Math.sqrt(dx * dx + dy * dy) <= defaultWeapon.attackRange;
}

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

let lastAttackTime = -Infinity;
let knifeAnimating = false;

function attack() {
    const now = performance.now();

    if (now - lastAttackTime < defaultWeapon.attackCooldown) return;
    lastAttackTime = now;

    const target = findAttackTarget();

    // 70 距離內：自動判斷左右並面向目標
    if (target) faceTarget(target.x);

    if (!knifeAnimating) {
        knifeAnimating = true;
        knife.classList.add("knife-swing");
        setTimeout(() => {
            knife.classList.remove("knife-swing");
            knifeAnimating = false;
            setFacingDirection(facingDirection);
        }, 160);
    }

    if (!target) {
        console.log("小刀揮空：70 距離內沒有目標");
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

updatePlayer();
updateDummyPosition();
updateDummyHealth();
setFacingDirection("right");
requestAnimationFrame(gameLoop);

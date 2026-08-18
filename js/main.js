const joystick = document.getElementById("joystick");
const knob = document.getElementById("joystick-knob");
const player = document.getElementById("player");
const attackButton = document.getElementById("attack-button");
const skillButton = document.getElementById("skill-button");
const skillTarget = document.getElementById("skill-target");
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
let facingDirection = "right";

// 移速數值以 0.1 為實際移動單位：650 = 65 px/s
const MOVE_SPEED_UNIT = 0.1;

function updatePlayer() {
    player.style.left = `${playerX}px`;
    player.style.top = `${playerY}px`;
}

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

let joystickActive = false;
let joystickX = 0;
let joystickY = 0;
let joystickPointerId = null;
const joystickRadius = 70;
const knobRadius = 35;
const maxDistance = joystickRadius - knobRadius;

function isInLeftBottomQuarter(x, y) {
    return x <= window.innerWidth / 2 && y >= window.innerHeight / 2;
}

function startJoystick(x, y, pointerId = null) {
    if (!isInLeftBottomQuarter(x, y)) return false;
    joystickActive = true;
    joystickPointerId = pointerId;
    joystick.style.left = `${x}px`;
    joystick.style.top = `${y}px`;
    joystick.classList.add("active");
    moveJoystick(x, y);
    return true;
}

function moveJoystick(x, y) {
    if (!joystickActive) return;
    const centerX = parseFloat(joystick.style.left);
    const centerY = parseFloat(joystick.style.top);
    let dx = x - centerX;
    let dy = y - centerY;
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
    if (event.target === attackButton || event.target === skillButton || joystickActive) return;
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
    if (event.target === attackButton || event.target === skillButton || joystickActive) return;
    startJoystick(event.clientX, event.clientY);
});

document.addEventListener("mousemove", (event) => {
    if (joystickActive) moveJoystick(event.clientX, event.clientY);
});

document.addEventListener("mouseup", () => {
    if (joystickActive) resetJoystick();
});

function gameLoop(now) {
    const deltaTime = Math.min((now - lastFrameTime) / 1000, 0.05);
    lastFrameTime = now;

    if (joystickActive && !skillDragging) {
        // moveSpeed 以 0.1 為單位，因此 650 實際為 65 px/s
        const actualMoveSpeed = playerStats.moveSpeed * MOVE_SPEED_UNIT;
        playerX += joystickX * actualMoveSpeed * deltaTime;
        playerY += joystickY * actualMoveSpeed * deltaTime;
        playerX = Math.max(25, Math.min(window.innerWidth - 25, playerX));
        playerY = Math.max(25, Math.min(window.innerHeight - 25, playerY));
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

function showHealNumber(amount) {
    if (amount <= 0) return;
    const number = document.createElement("div");
    number.className = "heal-number";
    number.textContent = `+${amount}`;
    number.style.left = `${playerX}px`;
    number.style.top = `${playerY - 45}px`;
    gameWorld.appendChild(number);
    setTimeout(() => number.remove(), 800);
}

function isTargetInKnifeRange(targetX, targetY) {
    const dx = targetX - playerX;
    const dy = targetY - playerY;
    return Math.sqrt(dx * dx + dy * dy) <= defaultWeapon.attackRange;
}

function findAttackTarget() {
    if (dummyStats.health <= 0) return null;
    if (!isTargetInKnifeRange(dummyX(), dummyY())) return null;
    return { x: dummyX(), y: dummyY(), body: dummyBody };
}

let lastAttackTime = -Infinity;
let knifeAnimating = false;

function attack() {
    const now = performance.now();
    if (now - lastAttackTime < defaultWeapon.attackCooldown) return;
    lastAttackTime = now;

    const target = findAttackTarget();
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

    if (!target) return;

    const damage = Math.max(1, playerStats.attack - dummyStats.defense);
    dummyStats.health = Math.max(0, dummyStats.health - damage);
    updateDummyHealth();
    showDamageNumber(damage);

    dummyBody.style.transform = "translateX(-50%) scale(1.12)";
    setTimeout(() => dummyBody.style.transform = "translateX(-50%) scale(1)", 100);

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

let skillDragging = false;
let skillPointerId = null;
let skillStartX = 0;
let skillStartY = 0;
let skillTargetX = 0;
let skillTargetY = 0;

function clampSkillTarget(x, y) {
    const dx = x - skillStartX;
    const dy = y - skillStartY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= defaultClass.dashRange) return { x, y };
    const scale = defaultClass.dashRange / distance;
    return { x: skillStartX + dx * scale, y: skillStartY + dy * scale };
}

function updateSkillTarget(x, y) {
    const target = clampSkillTarget(x, y);
    skillTargetX = target.x;
    skillTargetY = target.y;
    skillTarget.style.left = `${target.x}px`;
    skillTarget.style.top = `${target.y}px`;
    skillTarget.classList.add("active");
}

function beginSkillDrag(x, y, pointerId = null) {
    skillDragging = true;
    skillPointerId = pointerId;
    skillStartX = playerX;
    skillStartY = playerY;
    updateSkillTarget(x, y);
    skillButton.classList.add("dragging");
}

function endSkillDrag() {
    if (!skillDragging) return;
    skillDragging = false;
    skillPointerId = null;
    skillButton.classList.remove("dragging");
    skillTarget.classList.remove("active");
    playerX = skillTargetX;
    playerY = skillTargetY;
    playerX = Math.max(25, Math.min(window.innerWidth - 25, playerX));
    playerY = Math.max(25, Math.min(window.innerHeight - 25, playerY));
    updatePlayer();
    fireAssassinDarts();
}

function createDart(angle) {
    const dart = document.createElement("div");
    dart.className = "assassin-dart";
    dart.style.left = `${playerX}px`;
    dart.style.top = `${playerY}px`;
    dart.style.setProperty("--dart-angle", `${angle}rad`);
    gameWorld.appendChild(dart);
    requestAnimationFrame(() => dart.classList.add("fly"));
    setTimeout(() => dart.remove(), 420);
}

function pointToSegmentDistance(px, py, ax, ay, bx, by) {
    const abx = bx - ax;
    const aby = by - ay;
    const ab2 = abx * abx + aby * aby;
    if (ab2 === 0) return Math.sqrt((px - ax) ** 2 + (py - ay) ** 2);
    const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / ab2));
    const cx = ax + abx * t;
    const cy = ay + aby * t;
    return Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
}

function fireAssassinDarts() {
    let hitCount = 0;
    const dartLength = 190;
    for (let i = 0; i < defaultClass.dartCount; i++) {
        const angle = (Math.PI * 2 * i) / defaultClass.dartCount;
        createDart(angle);
        if (dummyStats.health > 0) {
            const endX = playerX + Math.cos(angle) * dartLength;
            const endY = playerY + Math.sin(angle) * dartLength;
            if (pointToSegmentDistance(dummyX(), dummyY(), playerX, playerY, endX, endY) <= 28) hitCount++;
        }
    }
    if (hitCount > 0) {
        const heal = Math.min(hitCount * defaultClass.healPerDart, playerStats.maxHealth - playerStats.health);
        playerStats.health += heal;
        showHealNumber(heal);
    }
}

function skillTouchStart(event) {
    event.preventDefault();
    event.stopPropagation();
    const touch = event.changedTouches[0];
    beginSkillDrag(touch.clientX, touch.clientY, touch.identifier);
}

function skillTouchMove(event) {
    if (!skillDragging) return;
    for (const touch of event.changedTouches) {
        if (touch.identifier === skillPointerId) {
            event.preventDefault();
            updateSkillTarget(touch.clientX, touch.clientY);
            break;
        }
    }
}

function skillTouchEnd(event) {
    if (!skillDragging) return;
    for (const touch of event.changedTouches) {
        if (touch.identifier === skillPointerId) {
            event.preventDefault();
            endSkillDrag();
            break;
        }
    }
}

skillButton.addEventListener("touchstart", skillTouchStart, { passive: false });
skillButton.addEventListener("touchmove", skillTouchMove, { passive: false });
skillButton.addEventListener("touchend", skillTouchEnd, { passive: false });
skillButton.addEventListener("mousedown", (event) => {
    event.preventDefault();
    beginSkillDrag(event.clientX, event.clientY);
});
document.addEventListener("mousemove", (event) => {
    if (skillDragging && skillPointerId === null) updateSkillTarget(event.clientX, event.clientY);
});
document.addEventListener("mouseup", () => {
    if (skillDragging && skillPointerId === null) endSkillDrag();
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

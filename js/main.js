const joystick = document.getElementById("joystick");
const knob = document.getElementById("joystick-knob");
const player = document.getElementById("player");
const attackButton = document.getElementById("attack-button");

// =========================
// 玩家
// =========================

let playerX = window.innerWidth / 2;
let playerY = window.innerHeight / 2;

const playerSpeed = 4;

function updatePlayer() {
    player.style.left = `${playerX}px`;
    player.style.top = `${playerY}px`;
}

// =========================
// 自由虛擬搖桿
// 只有左下 1/4 區域可以啟動
// 第一次碰觸的位置就是搖桿中心
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

    // 把搖桿中心放在玩家第一次觸碰的位置
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

    knob.style.transform =
        `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

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
// Touch
// =========================

document.addEventListener("touchstart", (event) => {
    // 不讓攻擊按鍵搶走搖桿觸控
    if (event.target === attackButton) return;

    if (joystickActive) return;

    const touch = event.changedTouches[0];

    startJoystick(
        touch.clientX,
        touch.clientY,
        touch.identifier
    );
}, { passive: false });

document.addEventListener("touchmove", (event) => {
    if (!joystickActive) return;

    for (const touch of event.changedTouches) {
        if (touch.identifier === joystickPointerId) {
            event.preventDefault();

            moveJoystick(
                touch.clientX,
                touch.clientY
            );

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

    startJoystick(
        event.clientX,
        event.clientY
    );
});

document.addEventListener("mousemove", (event) => {
    if (!joystickActive) return;

    moveJoystick(
        event.clientX,
        event.clientY
    );
});

document.addEventListener("mouseup", () => {
    if (joystickActive) {
        resetJoystick();
    }
});

// =========================
// 玩家移動
// =========================

function gameLoop() {
    if (joystickActive) {
        playerX += joystickX * playerSpeed;
        playerY += joystickY * playerSpeed;

        // 防止玩家跑出畫面
        const halfPlayer = 25;

        playerX = Math.max(
            halfPlayer,
            Math.min(
                window.innerWidth - halfPlayer,
                playerX
            )
        );

        playerY = Math.max(
            halfPlayer,
            Math.min(
                window.innerHeight - halfPlayer,
                playerY
            )
        );

        updatePlayer();
    }

    requestAnimationFrame(gameLoop);
}

// =========================
// 普攻
// =========================

function attack() {
    console.log("普攻!");

    player.style.transform =
        "translate(-50%, -50%) scale(1.3)";

    setTimeout(() => {
        player.style.transform =
            "translate(-50%, -50%) scale(1)";
    }, 100);
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
// 開始遊戲
// =========================

updatePlayer();
gameLoop();

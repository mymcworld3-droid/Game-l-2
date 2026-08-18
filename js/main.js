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
// 虛擬搖桿
// =========================

let joystickActive = false;

let joystickX = 0;
let joystickY = 0;

const joystickRadius = 70;
const knobRadius = 35;

function moveJoystick(clientX, clientY) {
    const rect = joystick.getBoundingClientRect();

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;

    const distance = Math.sqrt(dx * dx + dy * dy);

    const maxDistance = joystickRadius - knobRadius;

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

    joystickX = 0;
    joystickY = 0;

    knob.style.transform =
        "translate(-50%, -50%)";
}

// =========================
// Touch
// =========================

joystick.addEventListener("touchstart", (event) => {
    event.preventDefault();

    joystickActive = true;

    const touch = event.touches[0];

    moveJoystick(
        touch.clientX,
        touch.clientY
    );
});

joystick.addEventListener("touchmove", (event) => {
    event.preventDefault();

    if (!joystickActive) return;

    const touch = event.touches[0];

    moveJoystick(
        touch.clientX,
        touch.clientY
    );
});

joystick.addEventListener("touchend", (event) => {
    event.preventDefault();

    resetJoystick();
});

// =========================
// 滑鼠測試
// =========================

joystick.addEventListener("mousedown", (event) => {
    joystickActive = true;

    moveJoystick(
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
    resetJoystick();
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

    // 暫時讓玩家變大，模擬攻擊
    player.style.transform =
        "translate(-50%, -50%) scale(1.3)";

    setTimeout(() => {
        player.style.transform =
            "translate(-50%, -50%) scale(1)";
    }, 100);
}

attackButton.addEventListener("touchstart", (event) => {
    event.preventDefault();

    attack();
});

attackButton.addEventListener("mousedown", (event) => {
    event.preventDefault();

    attack();
});

// =========================
// 開始遊戲
// =========================

updatePlayer();
gameLoop();

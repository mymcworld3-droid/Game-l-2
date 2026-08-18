// 玩家基本數值
const playerStats = {
    maxHealth: 1145,
    health: 1145,
    attack: 66,
    moveSpeed: 650
};

// Dummy 基本數值
const dummyStats = {
    maxHealth: 1000,
    health: 1000,
    defense: 0,
    moveSpeed: 0
};

// 默認武器：小刀
const defaultWeapon = {
    id: "knife",
    name: "小刀",
    attackRange: 70,
    attackWidth: 46,
    attackSpeed: 0.25,
    attackCooldown: 250
};

// 默認職業：刺客
const defaultClass = {
    id: "assassin",
    name: "刺客",
    skillName: "飛鏢突襲",
    dashRange: 240,
    dartCount: 10,
    healPerDart: 20
};

const combatConfig = {
    attackCooldown: 250
};

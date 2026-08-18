extends CharacterBody3D

@export var speed := 5.5
@export var max_hp := 100
@export var attack_damage := 25
@export var attack_range := 2.6
var hp := max_hp
var attack_cooldown := 0.0

func _ready():
    add_to_group("player")

func _physics_process(delta):
    var input_2d := Input.get_vector("move_left", "move_right", "move_up", "move_down")
    var direction := Vector3(input_2d.x, 0.0, input_2d.y)
    velocity.x = direction.x * speed
    velocity.z = direction.z * speed
    if direction.length() > 0.1:
        look_at(global_position + Vector3(direction.x, 0, direction.z), Vector3.UP)
    move_and_slide()

    attack_cooldown = maxf(0.0, attack_cooldown - delta)
    if Input.is_action_just_pressed("attack") and attack_cooldown <= 0.0:
        attack()

func attack():
    attack_cooldown = 0.45
    for enemy in get_tree().get_nodes_in_group("enemies"):
        if is_instance_valid(enemy) and enemy.global_position.distance_to(global_position) <= attack_range:
            enemy.take_damage(attack_damage)

func take_damage(amount: int):
    hp -= amount
    if hp <= 0:
        hp = max_hp
        global_position = Vector3.ZERO

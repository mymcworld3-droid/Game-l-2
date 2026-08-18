extends CharacterBody3D

@export var speed := 6.0
@export var max_hp := 100
var hp := max_hp
var attack_cooldown := 0.0

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
    var enemies = get_tree().get_nodes_in_group("enemies")
    for enemy in enemies:
        if enemy.global_position.distance_to(global_position) <= 2.5:
            enemy.take_damage(25)

func take_damage(amount: int):
    hp -= amount
    if hp <= 0:
        hp = max_hp
        global_position = Vector3.ZERO

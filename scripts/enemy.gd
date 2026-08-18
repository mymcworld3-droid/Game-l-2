extends CharacterBody3D

@export var speed := 2.2
@export var max_hp := 60
var hp := max_hp
var attack_timer := 0.0
var target: Node3D

func _ready():
    add_to_group("enemies")
    target = get_tree().get_first_node_in_group("player")

func _physics_process(delta):
    if not is_instance_valid(target):
        target = get_tree().get_first_node_in_group("player")
        return
    var distance := global_position.distance_to(target.global_position)
    if distance > 1.7:
        var direction := (target.global_position - global_position).normalized()
        velocity = direction * speed
        velocity.y = 0.0
        move_and_slide()
    else:
        velocity = Vector3.ZERO
        attack_timer -= delta
        if attack_timer <= 0.0:
            attack_timer = 1.0
            target.take_damage(8)

func take_damage(amount: int):
    hp -= amount
    if hp <= 0:
        queue_free()

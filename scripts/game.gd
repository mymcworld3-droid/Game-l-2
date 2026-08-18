extends Node3D

@onready var player = $Player
@onready var hp_label = $HUD/HP

func _ready():
    _bind_button($HUD/MoveUp, "move_up")
    _bind_button($HUD/MoveDown, "move_down")
    _bind_button($HUD/MoveLeft, "move_left")
    _bind_button($HUD/MoveRight, "move_right")
    $HUD/Attack.button_down.connect(func(): Input.action_press("attack"))
    $HUD/Attack.button_up.connect(func(): Input.action_release("attack"))

func _bind_button(button: Button, action: String):
    button.button_down.connect(func(): Input.action_press(action))
    button.button_up.connect(func(): Input.action_release(action))

func _process(_delta):
    if is_instance_valid(player):
        hp_label.text = "HP %d / %d" % [player.hp, player.max_hp]

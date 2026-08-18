extends Control

@export var radius := 82.0
@export var knob_radius := 34.0
@export var deadzone := 0.12

var value := Vector2.ZERO
var dragging := false
var touch_id := -1

func _ready():
    custom_minimum_size = Vector2(radius * 2.4, radius * 2.4)
    mouse_filter = Control.MOUSE_FILTER_STOP
    queue_redraw()

func _draw():
    var center := size * 0.5
    draw_circle(center, radius, Color(0.08, 0.08, 0.1, 0.42))
    draw_arc(center, radius, 0.0, TAU, 48, Color(1, 1, 1, 0.32), 3.0)
    var knob_center := center + value * (radius - knob_radius)
    draw_circle(knob_center, knob_radius, Color(0.9, 0.9, 0.95, 0.78))
    draw_arc(knob_center, knob_radius, 0.0, TAU, 32, Color(1, 1, 1, 0.7), 2.0)

func _gui_input(event):
    if event is InputEventScreenTouch:
        if event.pressed:
            touch_id = event.index
            dragging = true
            _update_value(event.position)
        elif event.index == touch_id:
            _release()
    elif event is InputEventScreenDrag and event.index == touch_id:
        _update_value(event.position)
    elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
        dragging = event.pressed
        if dragging:
            _update_value(event.position)
        else:
            _release()
    elif event is InputEventMouseMotion and dragging and touch_id == -1:
        _update_value(event.position)

func _update_value(local_position: Vector2):
    var center := size * 0.5
    var offset := local_position - center
    if offset.length() > radius:
        offset = offset.normalized() * radius
    value = offset / radius
    if value.length() < deadzone:
        value = Vector2.ZERO
    queue_redraw()

func _release():
    dragging = false
    touch_id = -1
    value = Vector2.ZERO
    queue_redraw()

func get_value() -> Vector2:
    return value

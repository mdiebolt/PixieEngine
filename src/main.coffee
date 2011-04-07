b2Vec2 = Box2D.Common.Math.b2Vec2
b2AABB = Box2D.Collision.b2AABB
{b2BodyDef, b2Body, b2FixtureDef, b2Fixture, b2World, b2DebugDraw} = Box2D.Dynamics
{b2MassData, b2PolygonShape, b2CircleShape} = Box2D.Collision.Shapes

window.engine = Engine
  canvas: $("canvas").powerCanvas()
  FPS: 60

block = 
  color: "#CB8"
  width: 32
  height: 32
  solid: true
    
engine.loadState(Local.get("level"))
  
engine.start()

developer = false
savedState = null

objectToUpdate = null
window.updateObjectProperties = (newProperties) ->
  if objectToUpdate
    $.extend objectToUpdate, engine.construct(newProperties)

$(document).bind "contextmenu", (event) ->
  event.preventDefault()

$(document).mousedown (event) ->
  if developer

    if event.which == 3
      if object = engine.objectAt(event.pageX, event.pageY)
        parent.editProperties(object.I)
        
        objectToUpdate = object
        
    else if event.which == 2 || keydown.shift
      engine.add $.extend(
        x: event.pageX.snap(32)
        y: event.pageY.snap(32)
      , block)

$(document).bind "keydown", "esc", () ->
  developer = !developer

  if developer
    engine.pause()
  else
    engine.play()

$(document).bind "keydown", "f3 meta+s", () ->
  Local.set("level", engine.saveState())
  
$(document).bind "keydown", "f4 meta+l", () ->
  engine.loadState(Local.get("level"))
  
$(document).bind "keydown", "f5", () ->
  engine.reload()


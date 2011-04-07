b2Vec2 = Box2D.Common.Math.b2Vec2
b2AABB = Box2D.Collision.b2AABB
{b2BodyDef, b2Body, b2FixtureDef, b2Fixture, b2World, b2DebugDraw} = Box2D.Dynamics
{b2MassData, b2PolygonShape, b2CircleShape} = Box2D.Collision.Shapes

world = new b2World(new b2Vec2(0, 10), true)

fixDef = new b2FixtureDef
fixDef.density = 1.0
fixDef.friction = 0.5
fixDef.restitution = 0.2

bodyDef = new b2BodyDef

bodyDef.type = b2Body.b2_staticBody
fixDef.shape = new b2PolygonShape
fixDef.shape.SetAsBox(20, 2)
bodyDef.position.Set(10, 400 / 30 + 1.8)
world.CreateBody(bodyDef).CreateFixture(fixDef)
bodyDef.position.Set(10, -1.8)
world.CreateBody(bodyDef).CreateFixture(fixDef)
fixDef.shape.SetAsBox(2, 14)
bodyDef.position.Set(-1.8, 13)
world.CreateBody(bodyDef).CreateFixture(fixDef)
bodyDef.position.Set(21.8, 13)
world.CreateBody(bodyDef).CreateFixture(fixDef)

bodyDef.type = b2Body.b2_dynamicBody
10.times (i) ->
  if rand() > 0.5 
    fixDef.shape = new b2PolygonShape
    fixDef.shape.SetAsBox(rand() + 0.1, rand() + 0.1)
  else
    fixDef.shape = new b2CircleShape(rand() + 0.1)

  bodyDef.position.x = rand() * 10;
  bodyDef.position.y = rand() * 10;
  world.CreateBody(bodyDef).CreateFixture(fixDef);
  
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


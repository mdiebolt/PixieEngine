( ($) ->
  defaults =
    FPS: 33.3333
    backgroundColor: "#FFFFFF"

  window.Engine = (options) ->
    options = $.extend({}, defaults, options)

    intervalId = null
    savedState = null
    age = 0
    paused = false

    backgroundColor = options.backgroundColor
    FPS = options.FPS

    queuedObjects = []
    objects = []

    cameraTransform = Matrix.IDENTITY

    # Physics
    window.vec = (x, y) ->
      new b2Vec2(x, y)

    window.rect = (x, y) ->
      fixDef.shape = new b2PolygonShape
      fixDef.shape.SetAsBox(x, y)

    window.SCALE = 0.1
    DENSITY = 1.0
    FRICTION = 0.5
    RESTITUTION = 0.2

    world = null

    b2Vec2 = Box2D.Common.Math.b2Vec2
    b2AABB = Box2D.Collision.b2AABB
    {b2BodyDef, b2Body, b2FixtureDef, b2Fixture, b2World, b2DebugDraw} = Box2D.Dynamics
    {b2MassData, b2PolygonShape, b2CircleShape} = Box2D.Collision.Shapes     

    world = new b2World(vec(0, 40), true)

    fixDef = new b2FixtureDef
    fixDef.density = DENSITY
    fixDef.friction = FRICTION
    fixDef.restitution = RESTITUTION

    bodyDef = new b2BodyDef

    # ground   
    bodyDef.position = vec(65, 90)
    bodyDef.fixedRotation = true
    rect(60, 2)
    world.CreateBody(bodyDef).CreateFixture(fixDef)

    # setup debug draw
    debugDraw = new b2DebugDraw()      
    debugDraw.SetSprite(options.canvas.get(0).getContext("2d"))
    debugDraw.SetDrawScale(5.0)
    debugDraw.SetFillAlpha(0.3)
    debugDraw.SetLineThickness(1.0)
    debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit)
    world.SetDebugDraw(debugDraw)   

    updatePhysics = ->
      world.Step(1 / 60, 10, 10)     
      world.DrawDebugData()
      world.ClearForces()  

    # End Physics

    update = ->
      objects = objects.select (object) ->
        object?.update(true)

      objects = objects.concat(queuedObjects)
      queuedObjects = []

      updatePhysics()

    draw = ->
      canvas.withTransform cameraTransform, (canvas) ->
        if backgroundColor
          canvas.fill('transparent')
        objects.invoke("draw", canvas)

    step = ->
      unless paused
        update()
        age += 1

      draw()

    canvas = options.canvas || $("<canvas />").powerCanvas()

    construct = (entityData) -> 
      if entityData.class == "Moogle"      
        bodyDef.type = b2Body.b2_dynamicBody
        rect(entityData.width * SCALE, entityData.height * SCALE) 
        bodyDef.position = vec(entityData.x * SCALE, entityData.y * SCALE)

        body = world.CreateBody(bodyDef)        
        body.CreateFixture(fixDef) 

        $.extend(entityData, { bodyData: body })

      if entityData.class
        entityData.class.constantize()(entityData)
      else
        GameObject(entityData)

    self =
      add: (entityData) ->
        obj = construct entityData

        if intervalId && !paused
          queuedObjects.push obj
        else
          objects.push obj

      construct: construct

      #TODO: This is only used in testing and should be removed when possible
      age: ->
        age

      #TODO: This is a bad idea in case access is attempted during update
      objects: ->
        objects

      objectAt: (x, y) ->
        targetObject = null
        bounds =
          x: x
          y: y
          width: 1
          height: 1

        self.eachObject (object) ->
          targetObject = object if object.collides(bounds)

        return targetObject

      eachObject: (iterator) ->
        objects.each iterator

      collides: (bounds, selector) ->            
        objects.inject [], (collidingObjects, object) ->
          if object.solid() && object.collides(bounds)
            collidingObjects.push(object) 

          collidingObjects   

        .length

      rayCollides: (source, direction) ->
        hits = objects.map (object) ->
          hit = object.solid() && Collision.rayRectangle(source, direction, object.centeredBounds())
          hit.object = object if hit

          hit

        nearestDistance = Infinity
        nearestHit = null

        hits.each (hit) ->
          if hit && (d = hit.distance(source)) < nearestDistance
            nearestDistance = d
            nearestHit = hit

        nearestHit

      saveState: () ->
        savedState = objects.map (object) ->
          $.extend({}, object.I)

      loadState: (newState) ->
        if newState ||= savedState
          objects = newState.map (objectData) ->
            construct $.extend({}, objectData)

      reload: () ->
        objects = objects.map (object) ->
          construct object.I

      start: () ->
        unless intervalId
          intervalId = setInterval(() ->
            step()
          , 1000 / FPS)

      stop: () ->
        clearInterval(intervalId)
        intervalId = null

      play: -> paused = false
      pause: -> paused = true
      paused: -> paused
)(jQuery)


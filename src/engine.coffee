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

    world = null

    b2Vec2 = Box2D.Common.Math.b2Vec2
    b2AABB = Box2D.Collision.b2AABB
    {b2BodyDef, b2Body, b2FixtureDef, b2Fixture, b2World, b2DebugDraw} = Box2D.Dynamics
    {b2MassData, b2PolygonShape, b2CircleShape} = Box2D.Collision.Shapes     

    world = new b2World(vec(0, 40), true)
    world.SetWarmStarting(true)

    fixDef = new b2FixtureDef
    fixDef.density = 1.0
    fixDef.friction = 0.5
    fixDef.restitution = 0.2

    bodyDef = new b2BodyDef
    bodyDef.bullet = false

    updatePhysics = ->
      world.Step(1 / 60, 10, 10)     
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
          canvas.fill(backgroundColor)

        objects.each (object) ->
          object.draw(canvas)
          if object.I
            x = object.I.bodyData?.GetPosition().x / SCALE - (object.I.width / 2)
            y = object.I.bodyData?.GetPosition().y / SCALE - (object.I.height / 2)

            canvas.strokeColor 'rgba(0, 200, 0, 0.3)'
            canvas.strokeRect(x, y, object.I.width, object.I.height)          

    step = ->
      unless paused
        update()
        age += 1

      draw()

    canvas = options.canvas || $("<canvas />").powerCanvas()

    construct = (entityData) -> 
      if entityData.class == "Moogle"      
        bodyDef.type = b2Body.b2_dynamicBody
        bodyDef.fixedRotation = true
        rect((entityData.width / 2) * SCALE, (entityData.height / 2) * SCALE) 
        bodyDef.position = vec(          
          (entityData.x + (entityData.width / 2)) * SCALE, 
          (entityData.y + (entityData.height / 2)) * SCALE
        )

        body = world.CreateBody(bodyDef)        
        body.CreateFixture(fixDef) 
        body.SetBullet(false)

        $.extend(entityData, { bodyData: body })
      else if entityData.class != "Contrasaur"
        bodyDef.type = b2Body.b2_staticBody
        rect((entityData.width / 2) * SCALE, (entityData.height / 2) * SCALE) 
        bodyDef.position = vec(
          (entityData.x + (entityData.width / 2)) * SCALE, 
          (entityData.y + (entityData.height / 2)) * SCALE
        )

        body = world.CreateBody(bodyDef)        
        body.CreateFixture(fixDef) 
        body.SetBullet(false)   

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


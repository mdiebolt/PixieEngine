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
    world = null
      
    init = ->
      b2Vec2 = Box2D.Common.Math.b2Vec2
      b2BodyDef = Box2D.Dynamics.b2BodyDef
      b2Body = Box2D.Dynamics.b2Body
      b2FixtureDef = Box2D.Dynamics.b2FixtureDef
      b2Fixture = Box2D.Dynamics.b2Fixture
      b2World = Box2D.Dynamics.b2World
      b2MassData = Box2D.Collision.Shapes.b2MassData
      b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
      b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
      b2DebugDraw = Box2D.Dynamics.b2DebugDraw
       
      world = new b2World(new b2Vec2(0, 10), true)
         
      fixDef = new b2FixtureDef
      fixDef.density = 1.0
      fixDef.friction = 0.5
      fixDef.restitution = 0.2
         
      bodyDef = new b2BodyDef
         
      # ground   
      bodyDef.type = b2Body.b2_staticBody
      bodyDef.position.x = 9
      bodyDef.position.y = 13
      fixDef.shape = new b2PolygonShape
      fixDef.shape.SetAsBox(10, 0.5)
      world.CreateBody(bodyDef).CreateFixture(fixDef)
         
      # create some objects
      bodyDef.type = b2Body.b2_dynamicBody
      10.times (i) ->
        if rand() > 0.5
          fixDef.shape = new b2PolygonShape
          fixDef.shape.SetAsBox(rand() + 0.1, rand() + 0.1)
        else
          fixDef.shape = new b2CircleShape(rand() + 0.1)
        
        bodyDef.position.x = rand() * 10
        bodyDef.position.y = rand() * 10
        world.CreateBody(bodyDef).CreateFixture(fixDef)
    
      # setup debug draw
      debugDraw = new b2DebugDraw()      
      debugDraw.SetSprite(options.canvas.get(0).getContext("2d"))
      debugDraw.SetDrawScale(30.0)
      debugDraw.SetFillAlpha(0.3)
      debugDraw.SetLineThickness(1.0)
      debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit)
      world.SetDebugDraw(debugDraw)   
    
    updatePhysics = ->
      world.Step(1 / 30, 10, 10)     
      world.DrawDebugData()
      world.ClearForces()  
 
    # End Physics
 
    init()   
  
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
        objects.invoke("draw", canvas)

    step = ->
      unless paused
        update()
        age += 1

      draw()
   
    canvas = options.canvas || $("<canvas />").powerCanvas()
    
    construct = (entityData) ->
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


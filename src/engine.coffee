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
    
    ###
    debugDraw = new b2DebugDraw()
    debugDraw.SetSprite($("canvas").powerCanvas())
    debugDraw.SetDrawScale(30.0)
    debugDraw.SetFillAlpha(0.5)
    debugDraw.SetLineThickness(1.0)
    debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit)
    world.SetDebugDraw(debugDraw)
    ###
    
    mouseX = mouseY = mousePVec = isMouseDown = selectedBody = mouseJoint = null
    canvasPosition = getElementPosition(document.getElementById("canvas"))
   
    document.addEventListener "mousedown", (e) ->
      isMouseDown = true
      handleMouseMove(e)
      document.addEventListener("mousemove", handleMouseMove, true)
    , true
   
    document.addEventListener "mouseup", ->
      document.removeEventListener("mousemove", handleMouseMove, true)
      isMouseDown = false
      mouseX = undefined
      mouseY = undefined
    , true
   
    handleMouseMove = (e) ->
      mouseX = (e.clientX - canvasPosition.x) / 30
      mouseY = (e.clientY - canvasPosition.y) / 30

    getBodyAtMouse = ->
      mousePVec = new b2Vec2(mouseX, mouseY)
      aabb = new b2AABB()
      aabb.lowerBound.Set(mouseX - 0.001, mouseY - 0.001)
      aabb.upperBound.Set(mouseX + 0.001, mouseY + 0.001)
      
      selectedBody = null
      world.QueryAABB(getBodyCB, aabb)
      return selectedBody
  
    getBodyCB = (fixture) ->
      if fixture.GetBody().GetType() != b2Body.b2_staticBody
        if fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), mousePVec)
          selectedBody = fixture.GetBody()
          return false
      return true
   
    updateWorld = ->   
      if isMouseDown && (!mouseJoint)
        body = getBodyAtMouse()

        if body
          md = new b2MouseJointDef()
          md.bodyA = world.GetGroundBody()
          md.bodyB = body
          md.target.Set(mouseX, mouseY)
          md.collideConnected = true
          md.maxForce = 300.0 * body.GetMass()
          mouseJoint = world.CreateJoint(md)
          body.SetAwake(true)
      
      if mouseJoint 
        if isMouseDown
          mouseJoint.SetTarget(new b2Vec2(mouseX, mouseY))
        else
          world.DestroyJoint(mouseJoint)
          mouseJoint = null
   
      world.Step(1 / 30, 10, 10)
      #world.DrawDebugData()
      world.ClearForces()
   
    getElementPosition = (element) ->
      elem = element 
      tagname = ""
      x = 0
      y = 0
       
      while (typeof(elem) == "object") && (typeof(elem.tagName) != "undefined")
        y += elem.offsetTop
        x += elem.offsetLeft
        tagname = elem.tagName.toUpperCase()
      
        if tagname == "BODY"
          elem = 0
      
        if typeof(elem) == "object"
          if typeof(elem.offsetParent) == "object"
            elem = elem.offsetParent
    
       return {x: x, y: y}
                        
    # End Physics   
  
    update = ->
      objects = objects.select (object) ->
        object?.update(true)
        
      objects = objects.concat(queuedObjects)
      queuedObjects = []
  
    draw = ->
      canvas.withTransform cameraTransform, (canvas) ->
        if backgroundColor
          canvas.fill(backgroundColor)
        objects.invoke("draw", canvas)

    step = ->
      unless paused
        update()
        age += 1
        
        updateWorld?()

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


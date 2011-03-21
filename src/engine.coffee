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
  
    update = ->
      objects = objects.select (object) ->
        object.update()
        
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
          if (selector && object.I.class == selector)      
            if object.solid() && object.collides(bounds)
              collidingObjects.push(object)
          else
            if object.solid() && object.collides(bounds)
              collidingObjects.push(object)          
         
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
        
      rewind: () ->
        
        
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
        
      play: ->
        paused = false
        
      pause: ->
        paused = true
        
      paused: ->
        paused
        
      setFramerate: (newFPS) ->
        FPS = newFPS
        self.stop()
        self.start()
)(jQuery)


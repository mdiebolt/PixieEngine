(() ->
  StateAnimation = (data, object) ->  
    spriteLookup = {}
    activeAnimation = data.animations[0]
    currentFrameIndex = activeAnimation.frames[0]
    
    advanceFrame = ->
      frames = activeAnimation.frames
       
      if currentFrameIndex == frames.last() 
        object?.trigger("Complete") 
        
        if activeAnimation.complete
          data.animations.each (animation) ->
            activeAnimation = animation if animation.name == activeAnimation.complete

      currentFrameIndex = activeAnimation.frames[(frames.indexOf(currentFrameIndex) + 1) % frames.length]
 
    data.tileset.each (spriteData, i) ->
      spriteLookup[i] = Sprite.fromURL(spriteData.src) 
    
    $.extend data,
      # TODO these two methods are only used in testing. Find a better way to access them in the tests
      currentFrameIndex: -> currentFrameIndex
      frames: -> activeAnimation.frames
      
      draw: (canvas, x, y) ->
        spriteLookup[currentFrameIndex].draw(canvas, x, y)
        
      find: (name) ->
        data.animations.each (animation) ->
          if animation.name == name
            return animation   
        
      transition: (newState) ->
        if newState
          data.animations.each (animation) ->
            activeAnimation = animation if animation.name == newState
                          
      update: -> advanceFrame()
            
      active: (name) ->
        if (name != undefined)
          if data.animations[name]
            currentFrameIndex = data.animations[name].frames[0] 
        else
          return activeAnimation

  window.StateAnimation = (data, object) ->
    StateAnimation(data, object)
 
  fromPixieId = (id, callback) ->
    url = "http://pixie.strd6.com/s3/animations/#{id}/data.json"
  
    proxy =
      active: $.noop
      draw: $.noop
      update: $.noop
      
    $.getJSON url, (data) ->
      $.extend(proxy, StateAnimation(data))
      
      callback proxy
      
    return proxy
    
  window.StateAnimation.fromPixieId = fromPixieId
)()
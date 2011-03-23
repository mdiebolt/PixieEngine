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
          activeAnimation = find(activeAnimation.complete) || activeAnimation        

      currentFrameIndex = activeAnimation.frames[(frames.indexOf(currentFrameIndex) + 1) % frames.length]

    find = (name) ->
      result = null
      
      data.animations.each (animation) ->
        result = animation if animation.name == name
                 
      return result  
 
    data.tileset.each (spriteData, i) ->
      spriteLookup[i] = Sprite.fromURL(spriteData.src) 
    
    $.extend data,
      # TODO these two methods are only used in testing. Find a better way to access them in the tests
      currentFrameIndex: -> currentFrameIndex
      frames: -> activeAnimation.frames
      
      draw: (canvas, x, y) ->
        spriteLookup[currentFrameIndex].draw(canvas, x, y)
                
      transition: (newState) ->
        activeAnimation = find(newState) || activeAnimation
                           
      update: -> 
        if activeAnimation.events && activeAnimation.events[currentFrameIndex] && object
          activeAnimation.events[currentFrameIndex].each (event) ->
            object.trigger(event)
          
        advanceFrame()
            
      active: (name) -> 
        activeAnimation

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
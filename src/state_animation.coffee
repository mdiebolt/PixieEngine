(() ->
  StateAnimation = (I, object) ->  
    I ||= {}
    
    $.reverseMerge I,
      data: {}
      spriteLookup: {}
      activeAnimation: []
      currentFrameIndex: 0
    
    I.activeAnimation = I.data.animations[0]
    I.currentFrameIndex = I.activeAnimation.frames[0]
        
    advanceFrame = ->
      frames = I.activeAnimation.frames
       
      if I.currentFrameIndex == frames.last() 
        object?.trigger("Complete") 
        
        if I.activeAnimation.complete 
          I.activeAnimation = find(I.activeAnimation.complete) || I.activeAnimation        

      I.currentFrameIndex = I.activeAnimation.frames[(frames.indexOf(I.currentFrameIndex) + 1) % frames.length]

    find = (name) ->
      result = null
      
      I.data.animations.each (animation) ->
        result = animation if animation.name == name
                 
      return result  
 
    I.data.tileset.each (spriteData, i) ->
      I.spriteLookup[i] = Sprite.fromURL(spriteData.src) 
    
    $.extend I.data,
      # TODO these two methods are only used in testing. Find a better way to access them in the tests
      currentFrameIndex: -> I.currentFrameIndex
      frames: -> I.activeAnimation.frames
      
      draw: (canvas, x, y) ->
        I.spriteLookup[I.currentFrameIndex].draw(canvas, x, y)
                
      transition: (newState) ->
        I.activeAnimation = find(newState) || I.activeAnimation
                           
      update: -> 
        if I.activeAnimation.triggers && I.activeAnimation.triggers[I.currentFrameIndex] && object
          I.activeAnimation.triggers[I.currentFrameIndex].each (event) ->
            object.trigger(event)
          
        advanceFrame()
            
      active: (name) -> 
        I.activeAnimation

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
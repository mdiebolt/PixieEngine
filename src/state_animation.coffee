(() ->
  StateAnimation = (data) ->  
    spriteLookup = {}
    activeAnimation = data.animations[0]
    currentSprite = activeAnimation.frames[0]
    
    advanceFrame = ->
      frames = activeAnimation.frames
      currentSprite = frames[(frames.indexOf(currentSprite) + 1) % frames.length]
 
    data.tileset.each (spriteData, i) ->
      spriteLookup[i] = Sprite.fromURL(spriteData.src) 
    
    $.extend data,
      currentSprite: -> currentSprite
      frames: -> activeAnimation.frames
      
      draw: (canvas, x, y) ->
        spriteLookup[currentSprite].draw(canvas, x, y)
       
      transition: (newState) ->
        if newState
          data.animations.each (animation) ->
            log animation
            activeAnimation = animation if animation.name == newState
                    
      update: -> return advanceFrame()
            
      active: (name) ->
        if (name != undefined)
          if data.animations[name]
            currentSprite = data.animations[name].frames[0] 
        else
          return activeAnimation

  window.StateAnimation = (name, callback) ->
    fromPixieId(App.Animations[name], callback)
 
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
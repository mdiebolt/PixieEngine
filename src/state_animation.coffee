Animated = (I, self) ->  
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
      self.trigger("Complete") 
      
      nextState = I.activeAnimation.complete
      
      if nextState
        I.activeAnimation = find(nextState) || I.activeAnimation    

    I.currentFrameIndex = I.activeAnimation.frames[(frames.indexOf(I.currentFrameIndex) + 1) % frames.length]

  find = (name) ->
    result = null
    
    I.data.animations.each (animation) ->
      result = animation if animation.name == name
               
    return result  

  I.data.tileset.each (spriteData, i) ->
    I.spriteLookup[i] = Sprite.fromURL(spriteData.src) 
  
  draw: (canvas) ->
    if self.transform
      canvas.withTransform self.transform(), ->
        I.spriteLookup[I.currentFrameIndex].draw(canvas, I.x, I.y)
    else
      I.spriteLookup[I.currentFrameIndex].draw(canvas, I.x, I.y)
              
  transition: (newState) ->
    if newState != I.activeAnimation.name
      I.activeAnimation = find(newState) || I.activeAnimation
  
  before:  
    update: -> 
      if I.activeAnimation.triggers && I.activeAnimation.triggers[I.currentFrameIndex]
        I.activeAnimation.triggers[I.currentFrameIndex].each (event) ->
          self.trigger(event)
        
      advanceFrame()


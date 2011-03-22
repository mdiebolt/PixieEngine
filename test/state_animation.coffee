asyncTest "Animation should set proper frame", ->
  animation = StateAnimation.fromPixieId 45
  
  milliseconds = 300
  
  setTimeout ->
    equals animation.currentSprite(), animation.frames()[0], "Animation should default to initial sprite"
    
    animation.update()
    
    equals animation.currentSprite(), animation.frames()[1], "After an update the currentSprite has advanced"
    
    9.times ->
      animation.update()
      
    equals animation.currentSprite(), animation.frames()[0], "Animation should loop after it reaches the end"

    start()
  , milliseconds

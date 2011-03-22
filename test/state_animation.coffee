asyncTest "Animation should set proper frame", ->
  animation = StateAnimation.fromPixieId 45
  
  milliseconds = 100
  
  setTimeout ->
    equals animation.currentSprite(), animation.frames()[0], "Animation should default to initial sprite"
    
    animation.update()
    
    equals animation.currentSprite(), animation.frames()[1], "After an update the currentSprite has advanced"
    
    9.times ->
      animation.update()
      
    equals animation.currentSprite(), animation.frames()[0], "Animation should loop after it reaches the end"

    start()
  , milliseconds
  
asyncTest "Animation should be on correct frame after transition is called", ->
  animation = StateAnimation.fromPixieId 45
  
  milliseconds = 100
  
  setTimeout ->
    animation.transition("Stand")

    equals animation.active().name, "Stand", "Animation should be in stand state after transition is called"
    equals animation.frames[0], 0, "Animation should be on first frame after transition"

    start()
  , milliseconds

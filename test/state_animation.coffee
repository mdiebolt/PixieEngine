animationData = `{
   "version":"1.3",
   "tileset":[
      {
         "id":12354,
         "src":"http://images.pixie.strd6.com/sprites/12354/original.png?1300575176",
         "title":"Sprite 12354",
         "circles":[
            {
               "x":0,
               "y":2,
               "radius":40
            },
            {
               "x":90,
               "y":-40,
               "radius":30
            },
            {
               "x":-80,
               "y":10,
               "radius":15
            },
            {
               "x":0,
               "y":51,
               "radius":50
            },
            {
               "x":-120,
               "y":22,
               "radius":12
            }
         ]
      },
      {
         "id":12355,
         "src":"http://images.pixie.strd6.com/sprites/12355/original.png?1300575193",
         "title":"Sprite 12355",
         "circles":[
            {
               "x":0,
               "y":0,
               "radius":40
            },
            {
               "x":90,
               "y":-20,
               "radius":35
            },
            {
               "x":-80,
               "y":20,
               "radius":20
            },
            {
               "x":0,
               "y":50,
               "radius":50
            }
         ]
      },
      {
         "id":12356,
         "src":"http://images.pixie.strd6.com/sprites/12356/original.png?1300575271",
         "title":"Sprite 12356",
         "circles":[
            {
               "x":0,
               "y":0,
               "radius":40
            },
            {
               "x":71,
               "y":-55,
               "radius":35
            },
            {
               "x":-79,
               "y":20,
               "radius":20
            },
            {
               "x":0,
               "y":51,
               "radius":50
            }
         ]
      },
      {
         "id":12358,
         "src":"http://images.pixie.strd6.com/sprites/12358/original.png?1300575302",
         "title":"Sprite 12358",
         "circles":[
            {
               "x":0,
               "y":0,
               "radius":40
            },
            {
               "x":70,
               "y":-56,
               "radius":40
            },
            {
               "x":-67,
               "y":14,
               "radius":20
            },
            {
               "x":0,
               "y":50,
               "radius":50
            }
         ]
      },
      {
         "id":12359,
         "src":"http://images.pixie.strd6.com/sprites/12359/original.png?1300575324",
         "title":"Sprite 12359",
         "circles":[
            {
               "x":0,
               "y":10,
               "radius":40
            },
            {
               "x":-70,
               "y":-30,
               "radius":15
            },
            {
               "x":0,
               "y":50,
               "radius":50
            }
         ]
      },
      {
         "id":12360,
         "src":"http://images.pixie.strd6.com/sprites/12360/original.png?1300575342",
         "title":"Sprite 12360",
         "circles":[
            {
               "x":0,
               "y":10,
               "radius":40
            },
            {
               "x":-80,
               "y":-30,
               "radius":20
            },
            {
               "x":0,
               "y":50,
               "radius":45
            }
         ]
      },
      {
         "id":12361,
         "src":"http://images.pixie.strd6.com/sprites/12361/original.png?1300575359",
         "title":"Sprite 12361",
         "circles":[
            {
               "x":0,
               "y":8,
               "radius":40
            },
            {
               "x":104,
               "y":0,
               "radius":35
            },
            {
               "x":-84,
               "y":6,
               "radius":20
            },
            {
               "x":0,
               "y":50,
               "radius":50
            }
         ]
      },
      {
         "id":12362,
         "src":"http://images.pixie.strd6.com/sprites/12362/original.png?1300575379",
         "title":"Sprite 12362",
         "circles":[
            {
               "x":0,
               "y":1,
               "radius":40
            },
            {
               "x":90,
               "y":-38,
               "radius":30
            },
            {
               "x":-80,
               "y":10,
               "radius":20
            },
            {
               "x":0,
               "y":50,
               "radius":50
            }
         ]
      }
   ],
   "animations":[
      {
         "name":"Bite",
         "complete":"Stand",
         "events": {
           "0":["whiteParticles"],
           "4":["blueParticles","greenParticles","redParticles"]
         },
         "speed":"110",
         "frames":[0,1,2,3,4,5,6,7]
      },
      {
         "name":"Stand",
         "complete":"Stand",
         "speed":"110",
         "frames":[1]
      }
   ]
}`
 
test "Animation should set proper frame", ->
  animation = StateAnimation(animationData)
    
  equals animation.currentSprite(), animation.frames().first(), "Animation should default to initial sprite"
    
  animation.update()
    
  equals animation.currentSprite(), animation.frames()[1], "After an update the currentSprite has advanced"
    
  (animation.frames().length - 1).times ->
    animation.update()
      
  equals animation.currentSprite(), animation.frames().first(), "Animation should loop after it reaches the end"

test "Animation should be on correct frame after transition is called", ->
  animation = StateAnimation(animationData)
  
  animation.transition("Stand")
  
  equals animation.active().name, "Stand", "Animation should be in stand state after transition is called"
  equals animation.active().frames.first(), 1, "Animation should be on first frame after transition"
  
test "Animation should fire Complete event after updating past the last frame", ->
  window.completeFired = false
  
  gameObj = GameObject()
  gameObj.bind "Complete", ->
    window.completeFired = true
  
  animation = StateAnimation(animationData, gameObj)
  
  (animation.frames().length).times ->
    animation.update()
    
  ok window.completeFired, "Complete event fired"
  
test "Animation should advance to next state after last frame", ->
  animation = StateAnimation(animationData)
  
  (animation.frames().length).times ->
    animation.update()
    
  equals animation.active().name, "Stand", "After the bite cycle, we should end up in the stand state"
  
  50.times ->
    animation.update()
    
  equals animation.active().name, "Stand", "The stand state loops so after any number of updates we should still be there"
  

Contrasaur = (I) ->
  I ||= {}

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
      },
      {
         "id":12448,
         "src":"http://images.pixie.strd6.com/sprites/12448/original.png?1300944508",
         "title":"Idle1-1",
         "circles":[

         ]
      },
      {
         "id":12449,
         "src":"http://images.pixie.strd6.com/sprites/12449/original.png?1300944544",
         "title":"Idle1-2",
         "circles":[

         ]
      },
      {
         "id":12450,
         "src":"http://images.pixie.strd6.com/sprites/12450/original.png?1300944589",
         "title":"Idle1-3",
         "circles":[

         ]
      },
      {
         "id":12451,
         "src":"http://images.pixie.strd6.com/sprites/12451/original.png?1300944615",
         "title":"Idle1-4",
         "circles":[

         ]
      },
      {
         "id":12456,
         "src":"http://images.pixie.strd6.com/sprites/12456/original.png?1300945175",
         "title":"walk1",
         "circles":[

         ]
      },
      {
         "id":12457,
         "src":"http://images.pixie.strd6.com/sprites/12457/original.png?1300945201",
         "title":"walk2",
         "circles":[

         ]
      },
      {
         "id":12458,
         "src":"http://images.pixie.strd6.com/sprites/12458/original.png?1300945225",
         "title":"walk3",
         "circles":[

         ]
      },
      {
         "id":12459,
         "src":"http://images.pixie.strd6.com/sprites/12459/original.png?1300945249",
         "title":"walk4",
         "circles":[

         ]
      },
      {
         "id":12460,
         "src":"http://images.pixie.strd6.com/sprites/12460/original.png?1300945279",
         "title":"walk5",
         "circles":[

         ]
      },
      {
         "id":12461,
         "src":"http://images.pixie.strd6.com/sprites/12461/original.png?1300945300",
         "title":"walk6",
         "circles":[

         ]
      },
      {
         "id":12462,
         "src":"http://images.pixie.strd6.com/sprites/12462/original.png?1300945319",
         "title":"walk7",
         "circles":[

         ]
      },
      {
         "id":12463,
         "src":"http://images.pixie.strd6.com/sprites/12463/original.png?1300945343",
         "title":"walk8",
         "circles":[

         ]
      },
      {
         "id":12452,
         "src":"http://images.pixie.strd6.com/sprites/12452/original.png?1300944656",
         "title":"Idle2-1",
         "circles":[

         ]
      },
      {
         "id":12453,
         "src":"http://images.pixie.strd6.com/sprites/12453/original.png?1300944682",
         "title":"Idle2-2",
         "circles":[

         ]
      },
      {
         "id":12454,
         "src":"http://images.pixie.strd6.com/sprites/12454/original.png?1300944707",
         "title":"Idle2-3",
         "circles":[

         ]
      },
      {
         "id":12455,
         "src":"http://images.pixie.strd6.com/sprites/12455/original.png?1300944729",
         "title":"Idle2-4",
         "circles":[

         ]
      },
      {
         "id":12411,
         "src":"http://images.pixie.strd6.com/sprites/12411/original.png?1300844954",
         "title":"Sprite 12411",
         "circles":[

         ]
      }
   ],
   "animations":[
      {
         "name":"Bite",
         "complete":"Idle1",
         "continuous":true,
         "speed":"110",
         "triggers": {
           "0":["whiteParticles"],
           "4":["blueParticles","greenParticles"],
           "5":["chompSound"]
         },
         "frames":[0,1,2,3,4,5,6,7]
      },
      {
         "complete":"Idle1",
         "name":"Idle1",
         "speed":"110",
         "frames":[8,9,10,11]
      },
      {
         "complete":"Idle1",
         "name":"Walk",
         "speed":"110",
         "frames":[12,13,14,15,16,17,18,19]
      },
      {
         "complete":"Idle1",
         "name":"Idle2",
         "speed":"110",
         "frames":[20,21,22,23]
      },
      {
         "complete":"Fly",
         "name":"Fly",
         "speed":"110",
         "frames":[24]
      }
   ]
}`
 
  GRAVITY = Point(0, 1)
  
  $.reverseMerge I,
    data: animationData
    solid: false
    velocity: Point(0, 0)
    excludedModules: ["Movable"]
    
  # Cast acceleration and velocity to points
  I.velocity = Point(I.velocity.x, I.velocity.y)

  jumping = false
  falling = true
  lastDirection = 1
  
  PHYSICS =
    platform: () ->
      if jumping
        I.velocity.y += GRAVITY.scale(0.6).y
      else if falling
        I.velocity.y += GRAVITY.y
      else
        if keydown.w
          jumping = true
          I.velocity.y = -10 * GRAVITY.y - 2.1
        
      # Move around based on input
      if keydown.d
        I.velocity.x += 0.75
      if keydown.a
        I.velocity.x -= 0.75
      unless keydown.a || keydown.d
        I.velocity.x = 0
      unless keydown.w
        jumping = false
        
      shooting = keydown.space
        
      if I.velocity.x.sign()
        lastDirection = I.velocity.x.sign() 
        
      I.velocity.x = I.velocity.x.clamp(-8, 8)
        
  physics = PHYSICS.platform
    
  self = GameObject(I).extend
    before:            
      update: ->      
        if engine.collides(self.bounds(0, 1))
          falling = false
        else
          falling = true

        physics()
          
        #TODO Reduct the # of calls to collides
        I.velocity.x.abs().times ->
          if !engine.collides(self.bounds(I.velocity.x.sign(), 0))
            I.x += I.velocity.x.sign()
          else 
            I.velocity.x = 0
    
        #TODO Reduct the # of calls to collides
        I.velocity.y.abs().times ->
          if !engine.collides(self.bounds(0, I.velocity.y.sign()))
            I.y += I.velocity.y.sign()
          else 
            I.velocity.y = 0
            jumping = false
      
        engine.eachObject (object) ->
          if object.I.open && Collision.rectangular(I, object.bounds())
            if I.active
              I.active = false
              engine.queue(nextLevel)

  self.include(Animated)
 
  self

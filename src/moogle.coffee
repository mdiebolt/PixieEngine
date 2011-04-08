Moogle = (I) ->
  I ||= {}

  $.reverseMerge I,
    color: "blue"
    solid: false
    width: 16
    height: 16
    excludedModules: ["Movable"]

  physics = ->
    if keydown.space    
      if I.bodyData.GetLinearVelocity().y > -.25   
        I.bodyData.ApplyImpulse(vec(0, -20), I.bodyData.GetPosition())        
    if keydown.right
      I.bodyData.ApplyImpulse(vec(6, 0), I.bodyData.GetPosition())
    if keydown.left
      I.bodyData.ApplyImpulse(vec(-6, 0), I.bodyData.GetPosition())

  self = GameObject(I).extend
    before:
      update: ->
        physics()

        I.x = (I.bodyData.GetPosition().x / SCALE) - (I.width / 2)
        I.y = I.bodyData.GetPosition().y / SCALE - (I.height / 2)

  self


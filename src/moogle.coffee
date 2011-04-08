Moogle = (I) ->
  I ||= {}

  $.reverseMerge I,
    color: "blue"
    solid: false
    width: 16
    height: 16
    excludedModules: ["Movable"]

  physics = ->
    if keydown.up
      I.bodyData.ApplyImpulse(vec(0, -20), I.bodyData.GetPosition())        
    if keydown.right
      I.bodyData.ApplyImpulse(vec(20, 0), I.bodyData.GetPosition())
    if keydown.left
      I.bodyData.ApplyImpulse(vec(-20, 0), I.bodyData.GetPosition())

  particleSizes = [2, 8, 4, 6]

  self = GameObject(I).extend
    before:
      update: ->
        physics()

    after:
      update: ->
        I.x = (I.bodyData.GetPosition().x / SCALE) - (I.width / 2)
        I.y = I.bodyData.GetPosition().y / SCALE - (I.height / 2)
  self


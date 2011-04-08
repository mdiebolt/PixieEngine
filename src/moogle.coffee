Moogle = (I) ->
  I ||= {}

  $.reverseMerge I,
    color: "blue"
    solid: false
    width: 16
    height: 16
    excludedModules: ["Movable"]

  shooting = false
  laserEndpoint = null

  physics = ->
    if keydown.up
      I.bodyData.ApplyImpulse(vec(0, -20), I.bodyData.GetPosition())        
    if keydown.right
      I.bodyData.ApplyImpulse(vec(20, 0), I.bodyData.GetPosition())
    if keydown.left
      I.bodyData.ApplyImpulse(vec(-20, 0), I.bodyData.GetPosition())

  laserColors = [
    "rgba(255, 0, 128, 0.75)"
    "rgba(255, 0, 128, 0.75)"
    "rgba(255, 0, 128, 0.75)"
    "rgba(255, 255, 255, 0.25)"
    "rgba(32, 190, 230, 0.25)"
  ]

  particleSizes = [2, 8, 4, 6]

  self = GameObject(I).extend
    before:
      draw: (canvas) ->
        laserStart = self.centeredBounds()
        if laserEndpoint
          5.times ->
            canvas.strokeColor laserColors.rand()
            canvas.drawLine(laserStart.x, laserStart.y, laserEndpoint.x, laserEndpoint.y, 2)

      update: ->
        physics()

        if Mouse.left
          shootDirection = Mouse.location.subtract(I)
        else if shooting
          shootDirection = Point(lastDirection, 0)

        laserEndpoint = null

        if shootDirection
          center = self.centeredBounds()
          if nearestHit = engine.rayCollides(center, shootDirection)
            laserEndpoint = nearestHit
            object = nearestHit.object

          if laserEndpoint
            engine.add
              class: "Emitter"
              duration: 10
              sprite: Sprite.EMPTY
              velocity: Point(0, 0)
              particleCount: 2
              batchSize: 5
              x: laserEndpoint.x
              y: laserEndpoint.y
              generator:
                color: Color(255, 0, 0, 0.5)
                duration: 3
                height: (n) ->
                  particleSizes.wrap(n)
                maxSpeed: 5
                velocity: (n) ->
                  Point.fromAngle(Random.angle()).scale(rand(5) + 1)
                width: (n) ->
                  particleSizes.wrap(n)

          else
            laserEndpoint = shootDirection.norm().scale(1000).add(I)

        if object?.I.destructable
          object.I.active = false
          engine.add
            class: "Emitter"
            duration: 10
            sprite: Sprite.EMPTY
            velocity: Point(0, 0)
            particleCount: 15
            batchSize: 5
            x: object.I.width / 2 + object.I.x
            y: object.I.height / 2 + object.I.y
            generator:
              color: "rgba(200, 140, 235, 0.7)"
              duration: 15
              height: (n) ->
                particleSizes.wrap(n) * 3
              maxSpeed: 35
              velocity: (n) ->
                Point.fromAngle(Random.angle()).scale(rand(5) + 5)
              width: (n) ->
                particleSizes.wrap(n) * 3

        engine.eachObject (object) ->
          if object.I.open && Collision.rectangular(I, object.bounds())
            if I.active
              I.active = false
              engine.queue(nextLevel)

    after:
      update: ->
        I.x = I.bodyData.GetPosition().x / SCALE
        I.y = I.bodyData.GetPosition().y / SCALE
  self


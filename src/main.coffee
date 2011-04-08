window.engine = Engine
  canvas: $("canvas").powerCanvas()
  FPS: 60

engine.loadState(Local.get("level"))

engine.start()

developer = false
savedState = null

objectToUpdate = null
window.updateObjectProperties = (newProperties) ->
  if objectToUpdate
    $.extend objectToUpdate, engine.construct(newProperties)

$(document).bind "contextmenu", (event) ->
  event.preventDefault()

$(document).mousedown (event) ->
  if developer

    if event.which == 3
      if object = engine.objectAt(event.pageX, event.pageY)
        parent.editProperties(object.I)

        objectToUpdate = object

$(document).bind "keydown", "esc", () ->
  developer = !developer

  if developer
    engine.pause()
  else
    engine.play()

$(document).bind "keydown", "f3 meta+s", () ->
  Local.set("level", engine.saveState())

$(document).bind "keydown", "f4 meta+l", () ->
  engine.loadState(Local.get("level"))

$(document).bind "keydown", "meta+h", () ->
  engine.reload()


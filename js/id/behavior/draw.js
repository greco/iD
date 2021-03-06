iD.behavior.Draw = function(map) {
    var event = d3.dispatch('move', 'click', 'clickWay', 'clickNode', 'clickMidpoint', 'undo', 'cancel', 'finish'),
        keybinding = d3.keybinding('draw'),
        down, surface, hover;

    function datum() {
        if (d3.event.altKey) {
            return {};
        } else {
            return d3.event.target.__data__ || {};
        }
    }

    function mousedown() {
        down = true;
    }

    function mouseup() {
        down = false;
    }

    function mousemove() {
        if (!down) {
            event.move(datum());
        }
    }

    function click() {
        var d = datum();
        if (d.type === 'way') {
            var choice = iD.geo.chooseIndex(d, d3.mouse(map.surface.node()), map);
            event.clickWay(d, choice.loc, choice.index);

        } else if (d.type === 'node') {
            event.clickNode(d);

        } else if (d.type === 'midpoint') {
            event.clickMidpoint(d);

        } else {
            event.click(map.mouseCoordinates());
        }
    }

    function keydown() {
        if (d3.event.keyCode === d3.keybinding.modifierCodes.alt) {
            surface.call(hover.off);
        }
    }

    function keyup() {
        if (d3.event.keyCode === d3.keybinding.modifierCodes.alt) {
            surface.call(hover);
        }
    }

    function backspace() {
        d3.event.preventDefault();
        event.undo();
    }

    function del() {
        d3.event.preventDefault();
        event.cancel();
    }

    function ret() {
        d3.event.preventDefault();
        event.finish();
    }

    function draw(selection) {
        surface = selection;
        hover = iD.behavior.Hover();

        keybinding
            .on('⌫', backspace)
            .on('⌦', del)
            .on('⎋', ret)
            .on('↩', ret);

        selection
            .on('mousedown.draw', mousedown)
            .on('mouseup.draw', mouseup)
            .on('mousemove.draw', mousemove)
            .on('click.draw', click)
            .call(hover);

        d3.select(document)
            .call(keybinding)
            .on('keydown.draw', keydown)
            .on('keyup.draw', keyup);

        return draw;
    }

    draw.off = function(selection) {
        selection
            .on('mousedown.draw', null)
            .on('mouseup.draw', null)
            .on('mousemove.draw', null)
            .on('click.draw', null)
            .call(hover.off);

        d3.select(document)
            .call(keybinding.off)
            .on('keydown.draw', null)
            .on('keyup.draw', null);
    };

    return d3.rebind(draw, event, 'on');
};

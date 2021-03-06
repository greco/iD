iD.modes.MoveWay = function(wayId) {
    var mode = {
        id: 'move-way'
    };

    var keybinding = d3.keybinding('move-way');

    mode.enter = function() {
        var map = mode.map,
            history = mode.history,
            graph = history.graph(),
            selection = map.surface,
            controller = mode.controller,
            projection = map.projection,
            way = graph.entity(wayId),
            origin = d3.mouse(selection.node()),
            annotation = t('operations.move.annotation.' + way.geometry(graph));

        // If intiated via keyboard
        if (!origin[0] && !origin[1]) origin = null;

        history.perform(
            iD.actions.Noop(),
            annotation);

        function move() {
            var p = d3.mouse(selection.node()),
                delta = origin ?
                    [p[0] - origin[0], p[1] - origin[1]] :
                    [0, 0];

            origin = p;

            history.replace(
                iD.actions.MoveWay(wayId, delta, projection),
                annotation);
        }

        function finish() {
            d3.event.stopPropagation();
            controller.enter(iD.modes.Select([way.id], true));
        }

        function cancel() {
            history.pop();
            controller.enter(iD.modes.Select([way.id], true));
        }

        function undone() {
            controller.enter(iD.modes.Browse());
        }

        selection
            .on('mousemove.move-way', move)
            .on('click.move-way', finish);

        history.on('undone.move-way', undone);

        keybinding
            .on('⎋', cancel)
            .on('↩', finish);

        d3.select(document)
            .call(keybinding);
    };

    mode.exit = function() {
        var map = mode.map,
            history = mode.history,
            selection = map.surface;

        selection
            .on('mousemove.move-way', null)
            .on('click.move-way', null);

        history.on('undone.move-way', null);

        keybinding.off();
    };

    return mode;
};

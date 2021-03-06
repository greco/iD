iD.behavior.Hash = function(controller, map) {
    var s0 = null, // cached location.hash
        lat = 90 - 1e-8; // allowable latitude range

    var parser = function(map, s) {
        var q = iD.util.stringQs(s);
        var args = (q.map || '').split("/").map(Number);
        if (args.length < 3 || args.some(isNaN)) {
            return true; // replace bogus hash
        } else if (s !== formatter(map).slice(1)) {
            map.centerZoom([args[2],
                Math.min(lat, Math.max(-lat, args[1]))],
                args[0]);
        }
    };

    var formatter = function(map) {
        var center = map.center(),
            zoom = map.zoom(),
            precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));
        var q = iD.util.stringQs(location.hash.substring(1));
        return '#' + iD.util.qsString(_.assign(q, {
                map: zoom.toFixed(2) +
                    '/' + center[1].toFixed(precision) +
                    '/' + center[0].toFixed(precision)
            }), true);
    };

    var move = _.throttle(function() {
        var s1 = formatter(map);
        if (s0 !== s1) location.replace(s0 = s1); // don't recenter the map!
    }, 100);

    function hashchange() {
        if (location.hash === s0) return; // ignore spurious hashchange events
        if (parser(map, (s0 = location.hash).substring(1))) {
            move(); // replace bogus hash
        }
    }

    // the hash can declare that the map should select a feature, but it can
    // do so before any features are loaded. thus wait for the feature to
    // be loaded and then select
    function willselect(id) {
        map.on('drawn.hash', function() {
            var entity = map.history().graph().entity(id);
            if (entity === undefined) return;
            else selectoff();
            controller.enter(iD.modes.Select([entity.id]));
            map.on('drawn.hash', null);
        });
        controller.on('enter.hash', function() {
            if (controller.mode.id !== 'browse') selectoff();
        });
    }

    function selectoff() {
        map.on('drawn.hash', null);
    }

    function hash() {
        map.on('move.hash', move);

        d3.select(window)
            .on('hashchange.hash', hashchange);

        if (location.hash) {
            var q = iD.util.stringQs(location.hash.substring(1));
            if (q.id) {
                willselect(q.id);
            }
            hashchange();
            hash.hadHash = true;
        }
    }

    hash.off = function() {
        map.on('move.hash', null);

        d3.select(window)
            .on('hashchange.hash', null);

        location.hash = "";
    };

    return hash;
};

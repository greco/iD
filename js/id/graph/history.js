iD.History = function() {
    var stack, index,
        imagery_used = 'Bing',
        dispatch = d3.dispatch('change', 'undone', 'redone');

    function perform(actions) {
        actions = Array.prototype.slice.call(actions);

        var annotation;

        if (!_.isFunction(_.last(actions))) {
            annotation = actions.pop();
        }

        var graph = stack[index].graph;
        for (var i = 0; i < actions.length; i++) {
            graph = actions[i](graph);
        }

        return {graph: graph, annotation: annotation, imagery_used: imagery_used};
    }

    function change(previous) {
        dispatch.change(history.graph().difference(previous));
    }

    var history = {
        graph: function () {
            return stack[index].graph;
        },

        merge: function (entities) {
            for (var i = 0; i < stack.length; i++) {
                stack[i].graph.rebase(entities);
            }
        },

        perform: function () {
            var previous = stack[index].graph;

            stack = stack.slice(0, index + 1);
            stack.push(perform(arguments));
            index++;

            change(previous);
        },

        replace: function () {
            var previous = stack[index].graph;

            // assert(index == stack.length - 1)
            stack[index] = perform(arguments);

            change(previous);
        },

        pop: function () {
            var previous = stack[index].graph;

            if (index > 0) {
                index--;
                stack.pop();
                change(previous);
            }
        },

        undo: function () {
            var previous = stack[index].graph;

            // Pop to the first annotated state.
            while (index > 0) {
                if (stack[index].annotation) break;
                index--;
            }

            // Pop to the next annotated state.
            while (index > 0) {
                index--;
                if (stack[index].annotation) break;
            }

            dispatch.undone();
            change(previous);
        },

        redo: function () {
            var previous = stack[index].graph;

            while (index < stack.length - 1) {
                index++;
                if (stack[index].annotation) break;
            }

            dispatch.redone();
            change(previous);
        },

        undoAnnotation: function () {
            var i = index;
            while (i >= 0) {
                if (stack[i].annotation) return stack[i].annotation;
                i--;
            }
        },

        redoAnnotation: function () {
            var i = index + 1;
            while (i <= stack.length - 1) {
                if (stack[i].annotation) return stack[i].annotation;
                i++;
            }
        },

        changes: function () {
            var initial = stack[0].graph,
                current = stack[index].graph;

            return {
                modified: current.modified().map(function (id) {
                    return current.entity(id);
                }),
                created: current.created().map(function (id) {
                    return current.entity(id);
                }),
                deleted: current.deleted().map(function (id) {
                    return initial.entity(id);
                })
            };
        },

        hasChanges: function() {
            return !!this.numChanges();
        },

        numChanges: function() {
            return d3.sum(d3.values(this.changes()).map(function(c) {
                return c.length;
            }));
        },

        imagery_used: function(source) {
            if (source) imagery_used = source;
            else return _.without(
                    _.unique(_.pluck(stack.slice(1, index + 1), 'imagery_used')),
                    undefined, 'Custom');
        },

        reset: function () {
            stack = [{graph: iD.Graph()}];
            index = 0;
            dispatch.change();
        }
    };

    history.reset();

    return d3.rebind(history, dispatch, 'on');
};

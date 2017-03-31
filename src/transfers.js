(function($, window, document, undefined) {

    "use strict";

    // Create the defaults once
    var pluginName = "transfers",
        defaults = {
            data: false,
            urlProductos: "http://localhost:3000/productos",
            urlSucursales: "http://localhost:3000/sucursales",
            dataProductos: {},
            dataSucursales: {},
            jqgrid: {
                datatype: "json",
                loadonce: true,
                altRows: true,
                autowidth: true,
                shrinkToFit: true,
                viewrecords: true,
                loadui: true,
                autoresizeOnLoad: true,
                colNames: ["", "ID", "Nombre", "Marca", "sucursal", "Origen", "Destino", "Cantidad"],
                colModel: [{
                    name: "act",
                    template: "actions",
                    formatoptions: {
                        delbutton: false
                    }
                }, {
                    name: "id",
                    hidden: true,
                    editable: false
                }, {
                    name: "producto",
                    align: "left",
                    editable: false
                }, {
                    name: "marca",
                    align: "left",
                    editable: false
                }, {
                    name: "branch",
                    template: "number",
                    autoResizableMinColSize: 80,
                    editable: false,
                    autoResizing: {
                        minColWidth: 80,
                        resetWidthOrg: false,
                        compact: false,
                        fixWidthOnShrink: true
                    }
                }, {
                    name: "origen",
                    template: "select",
                    autoResizableMinColSize: 80,
                    editable: true,
                    autoResizing: {
                        minColWidth: 80
                    },
                    sortable: false
                }, {
                    name: "destino",
                    template: "select",
                    autoResizableMinColSize: 80,
                    editable: true,
                    autoResizing: {
                        minColWidth: 80
                    },
                    sortable: false
                }, {
                    name: "cantidad",
                    template: "select",
                    autoResizableMinColSize: 80,
                    editable: true,
                    autoResizing: {
                        minColWidth: 80
                    },
                    sortable: false
                }, ],
                cmTemplate: {
                    autoResizable: true,
                    editable: true
                },
                guiStyle: "bootstrap",
                iconSet: "fontAwesome",
                rowNum: 10,
                autoResizing: {
                    compact: true
                },
                rowList: [5, 10, 20, "10000:todos"],
                viewrecords: true,
                autoencode: true,
                sortable: true,
                pager: true,
                inlineEditing: {
                    keys: true,
                    defaultFocusField: "origen",
                    focusField: "origen"
                },
                rownumbers: false,
                sortname: "id",
                sortorder: "desc",
                caption: "Tranferencias entre sucursales.",
                /*grouping: true,
                groupingView: {
                	groupField: ["marca"],
                	groupColumnShow: [true],
                	groupText: [""],
                	groupOrder: ["asc"],
                	groupSummary: [false],
                	groupSummaryPos: ['header'],
                	groupCollapse: false
                }*/
            }
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        // jQuery has an extend method which merges the contents of two or
        // more objects, storing the result in the first object. The first object
        // is generally empty as we don't want to alter the default options for
        // future instances of the plugin
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    function camelCase(string) {
        return string.replace(/-([a-z])/ig, function(all, letter) {
            return letter.toUpperCase();
        });
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function() {
            var $grid = $(this.element),
                onSelectRow = function(rowid, status, e) {
                    var $self = $(this),
                        savedRow = $self.jqGrid("getGridParam", "savedRow");

                    if (savedRow.length > 0 && savedRow[0].id !== rowid) {
                        $self.jqGrid("restoreRow", savedRow[0].id);
                    }

                    //$self.jqGrid("editRow", rowid, { focusField: e.target });
                },
                ondblClickRow = function(rowid, iRow, iCol, e) {
                    var $self = $(this),
                        savedRow = $self.jqGrid("getGridParam", "savedRow");
                    /*if (savedRow.length > 0 && savedRow[0].id !== rowid) {
                    	$self.jqGrid("restoreRow", savedRow[0].id);
                    }*/
                    $self.jqGrid("editRow", rowid, {
                        focusField: e.target
                    });
                };
            $.extend(this.settings.jqgrid, {
                url: this.settings.urlProductos,
                ondblClickRow: ondblClickRow,
                onSelectRow: onSelectRow
            });
            $grid.jqGrid(this.settings.jqgrid).jqGrid("inlineNav", {
                    add: false
                }).jqGrid("gridResize").jqGrid('bindKeys')
                .jqGrid('setGroupHeaders', {
                    useColSpanStyle: false,
                    groupHeaders: [{
                        startColumnName: 'producto',
                        numberOfColumns: 2,
                        titleText: 'Producto'
                    }, {
                        startColumnName: 'branch',
                        numberOfColumns: 1,
                        titleText: 'Existencias'
                    }, {
                        startColumnName: 'origen',
                        numberOfColumns: 3,
                        titleText: 'Transferencias'
                    }]
                });
            $(window).resize(function() {
                $grid.setGridWidth($grid.closest(".ui-jqgrid").parent().innerWidth());
            }).trigger('resize');

            //this.helloW("hola mundo");
        },
        help: function() {
            var funcs = $.map(this, function(elem, i) {
                if (typeof elem === "function") {
                    return i;
                }
            });
            console.log("defaults");
            console.log(defaults);
            console.log("métodos disponibles");
            console.log(funcs);
            console.log("------------");
            return [JSON.stringify(defaults), JSON.stringify(funcs)];
        },
        getProducts: function(conf) {},
        getBranches: function(conf) {},
        helloW: function(text) {
            // some logic
            return "text: " + text + ", my index: " + $(this.element).text(text).index();
        }
    });

    // preventing against multiple instantiations,
    // allowing set an action to do at the initialization
    $.fn[pluginName] = function(action, options) {
        var toReturn;
        if (typeof action !== "string") {
            options = action;
            toReturn = this.each(function(i, elem) {
                if (!$.data(elem, "plugin_" + pluginName)) {
                    $.data(elem, "plugin_" +
                        pluginName, new Plugin(elem, options));
                }
            });
        } else {
            toReturn = this.map(function(i, elem) {
                var plugin = $.data(elem, "plugin_" + pluginName);
                var tR;
                if (!plugin) {
                    plugin = new Plugin(elem, options);
                    $.data(elem, "plugin_" + pluginName, plugin);
                }
                if (typeof plugin[camelCase(action)] === "function") {
                    tR = plugin[camelCase(action)](options);
                }
                return tR;
            }).get();
            switch (toReturn.length) {
                case 0:
                    toReturn = null;
                    break;
                case 1:
                    toReturn = toReturn[0];
                    break;
                default:
            }
        }
        return toReturn;
    };

})(jQuery, window, document);
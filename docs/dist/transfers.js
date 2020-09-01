/*
 *  transfers - v4.1.0
 *  A jump-start for jQuery plugins development.
 *  
 *
 *  Made by JD-R2
 *  Under MIT License
 */
( function( $, window, document, undefined ) {
    "use strict";
    // Create the defaults once
    var pluginName = "transfers",
        defaults = {
            marca: true,
            title: "Transferencias entre sucursales",
            jqgrid: {
                url: "http://localhost:3000/transferencias",
                jsonReader: {
                    root: "productos",
                },
                colNames: [ "", "Producto", "Marca", "Origen", "Destino", "Cantidad", "" ],
                colModel: [ {
                    name: "id",
                    hidden: true,
                    editable: false,
                    search: false
                }, {
                    name: "producto",
                    align: "left",
                    editable: false
                }, {
                    name: "marca",
                    align: "left",
                    editable: false
                }, {
                    name: "origen",
                    autoResizing: {
                        minColWidth: 80
                    },
                    editable: false,
                    search: false,
                    sortable: false
                }, {
                    name: "destino",
                    autoResizing: {
                        minColWidth: 80
                    },
                    editable: false,
                    search: false,
                    sortable: false
                }, {
                    name: "cantidad",
                    autoResizing: {
                        minColWidth: 80
                    },
                    sortable: false,
                    editable: true,
                    search: false
                }, {
                    name: "act",
                    width: 80,
                    template: "actions",
                    formatoptions: { delbutton: false }
                } ],
                datatype: "json",
                hidegrid: false,
                loadonce: true,
                navOptions: {
                    reloadGridOptions: {
                        fromServer: true
                    }
                },
                altRows: true,
                autowidth: true,
                shrinkToFit: true,
                viewrecords: true,
                loadui: true,
                autoresizeOnLoad: true,
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
                rowList: [ 10, 20, 50 /*, "10000:todos"*/ ],
                autoencode: true,
                sortable: true,
                pager: true,
                inlineEditing: {
                    keys: true,
                    defaultFocusField: "origen",
                    focusField: "origen"
                },
                rownumbers: false,
                caption: "",
                grouping: false,
                groupingView: { //no hace nada si grouping false
                    groupField: [ "sucursal" ],
                    groupColumnShow: [ true ],
                    groupText: [ "" ],
                    groupOrder: [ "asc" ],
                    groupSummary: [ false ],
                    groupSummaryPos: [ "header" ],
                    groupCollapse: true
                }
            },
            select2: {
                language: "es",
                minimumInputLength: 0,
                multiple: false,
                ajax: {
                    url: "http://localhost:3000/sucursales",
                    dataType: "json",
                    delay: 250,
                    cache: true
                }
            }
        };
    // The actual plugin constructor
    function Plugin( element, options ) {
        this.element = element;
        // jQuery has an extend method which merges the contents of two or
        // more objects, storing the result in the first object. The first object
        // is generally empty as we don't want to alter the default options for
        // future instances of the plugin
        this.settings = $.extend( true, {}, {
            jqgrid: {
                ondblClickRow: ondblClickRow,
                onSelectRow: onSelectRow,
                beforeProcessing: beforeProcessing
            },
            select2: {
                ajax: {
                    data: dataSelect2,
                    processResults: processResults
                },
                escapeMarkup: escapeMarkup, // let our custom formatter work
                templateResult: formatRepo, // omitted for brevity, see the source of this page
                templateSelection: formatRepoSelection // omitted for brevity, see the source of this page
            }
        }, defaults, options );
        this.settings.jqgrid.colModel.filter( function( elem ) {
            if ( elem.name === "origen" || elem.name === "destino" ) {
                elem.formatter = formatterSelect;
                elem.unformat = unformatSelect;
                return elem;
            }
        } );
        this._defaults = defaults;
        this._name = pluginName;
        this.init( );
    }

    function camelCase( string ) {
        return string.replace( /-([a-z])/ig, function( all, letter ) {
            return letter.toUpperCase( );
        } );
    }

    function formatRepo( repo ) {
        //se puede colocar html en return
        return repo.sucursal;
    }

    function formatRepoSelection( repo ) {
        return repo.sucursal;
    }

    function dataSelect2( params ) {
        return {
            q: params.term, // search term
            page: params.page
        };
    }

    function processResults( data, params ) {
        // parse the results into the format expected by Select2
        // since we are using custom formatting functions we do not need to
        // alter the remote JSON data, except to indicate that infinite
        // scrolling can be used
        params.page = params.page || 1;
        console.log( data, params );
        return {
            results: data,
            pagination: {
                more: ( params.page * 30 ) < data.total_count
            }
        };
    }

    function escapeMarkup( markup ) {
        return markup;
    }

    function onSelectRow( rowid, status, e ) {
        var $self = $( this ),
            savedRow = $self.jqGrid( "getGridParam", "savedRow" );
        if ( savedRow.length > 0 && savedRow[ 0 ].id !== rowid ) {
            $self.jqGrid( "restoreRow", savedRow[ 0 ].id );
        }
    }

    function ondblClickRow( rowid, iRow, iCol, e ) {
        var $self = $( this );
        $self.jqGrid( "editRow", rowid, {
            focusField: e.target
        } );
    }

    function beforeProcessing( data ) {
        $.each( data.productos, function( i, elem ) {
            elem.origen = elem.inventario;
            var auxArr = [ ].concat( elem.inventario, data.sucursales );
            var existingIDs = [ ];
            auxArr = $.grep( auxArr, function( v ) {
                if ( $.inArray( v.id, existingIDs ) !== -1 || $.inArray( v.sucursal, existingIDs ) !== -1 ) {
                    return false;
                } else {
                    existingIDs.push( v.id );
                    existingIDs.push( v.sucursal );
                    return true;
                }
            } );
            elem.destino = auxArr;
        } );
    }

    function formatterSelect( cellvalue, options, rowObject ) {
        console.log( rowObject );
        var $select2Wrap = $( "<div>" );
        var $select2 = $( "<select>", { class: "form-control" } );
        $.each( cellvalue, function( i, elem ) {
            var text = elem.sucursal + ( elem.cantidad ? " - " + elem.cantidad : "" );
            var $option = $( "<option>", { value: elem.id } ).text( text );
            $select2.append( $option );
        } );
        $select2Wrap.append( $select2 );
        return $select2Wrap.html( );
    }

    function unformatSelect( cellvalue, options, cell ) {
        return "";
    }
    // Avoid Plugin.prototype conflicts
    $.extend( Plugin.prototype, {
        init: function( ) {
            var transfers = this;
            /**
             * remove from jqgrid settings "marca" if marca==false;
             */
            if ( !transfers.settings.marca ) {
                transfers.settings.jqgrid.colNames.splice( 2, 1 );
                transfers.settings.jqgrid.colModel.splice( 2, 1 );
            }
            /**
             * initialize elements
             */
            var $container = $( "<div>", { "class": "card-box transfers" } );
            var $title = $( "<h4>", {
                "class": "header-title m-t-0 m-b-30"
            } ).text( transfers.settings.title );
            var $rowFilters = $( "<div>", { "class": "row" } ).append( "<div class = 'col-sm-12' ></div>" );
            var $col4P = $( "<div>", { "class": "form-group col-sm-4" } );
            var $labelP = $( "<label>", { for: "productsFilter", "class": "control-label" } ).text( "Producto" );
            var $inputProductsFilter = $( "<input>", { type: "text", "class": "form-control", id: "productsFilter" } );
            var $col4C = $col4P.clone( );
            var $inputClearFilter = $( "<input>", { type: "button", "class": "form-control btn btn-primary disabled", id: "clearFilter", value: "Limpiar filtros", disabled: "disabled", css: { marginTop: 25 } } ).click( function( ) { transfers.filterClear( ); } );
            var $grid = $( "<table>" );
            $container.append( $title, $rowFilters, $grid );
            $rowFilters.find( "div" ).append( $col4P, $col4C );
            $col4P.append( $labelP, $inputProductsFilter );
            $col4C.append( $inputClearFilter );
            $( transfers.element ).append( $container );
            transfers.$grid = $grid;
            transfers.$inputProductsFilter = $inputProductsFilter;
            transfers.$inputClearFilter = $inputClearFilter;
            $grid.jqGrid( transfers.settings.jqgrid )
                .jqGrid( "gridResize" ).jqGrid( "bindKeys" )
                .jqGrid( "navGrid", {
                    edit: false,
                    add: false,
                    del: false,
                    search: true,
                    refresh: true
                }, {}, {}, {}, {
                    closeAfterSearch: true,
                    multipleSearch: true,
                    multipleGroup: true
                } );
            /*.jqGrid( "setGroupHeaders", {
                                useColSpanStyle: false,
                                groupHeaders: [ {
                                    startColumnName: "producto",
                                    numberOfColumns: 2,
                                    titleText: "Producto"
                                }, {
                                    startColumnName: "origen",
                                    numberOfColumns: 3,
                                    titleText: "Transferencias"
                                } ]
                            } )*/
            /**
             * Events
             */
            $inputProductsFilter.on( "keyup", function( ) {
                if ( !transfers.keyupDelay ) {
                    transfers.keyupDelay = setTimeout( function( ) {
                        var st = $inputProductsFilter.val( );
                        transfers.filterByProducts( st );
                        transfers.keyupDelay = false;
                    }, 300 );
                }
                return false;
            } );
            $( ".ui-jqgrid-title" ).click( function( ) {
                $( this ).parent( ).find( ".ui-jqgrid-titlebar-close" ).click( );
            } );
            $( ".ui-jqgrid-titlebar-close, .ui-pg-button" ).click( function( ) {
                setTimeout( function( ) {
                    $( window ).resize( );
                }, 200 );
            } );
            $grid.on( "jqGridInlineAfterSaveRow", function( e, rowID ) {
                var data = $grid.jqGrid( "getRowData", rowID );
                $( transfers.element ).trigger( "transfers.saveRow", data );
            } );
            $grid.on( "jqGridInlineEditRow", function( e, rowid, iRow ) {
                $( "#" + rowid ).find( "input" ).addClass( "form-control" );
            } );
            $( window ).resize( function( ) {
                $grid.setGridWidth( $grid.closest( ".ui-jqgrid" ).parent( ).innerWidth( true ) );
            } ).trigger( "resize" );
            $grid.on( "jqGridFilterBeforeShow", function( e, $form ) {
                $form.closest( ".ui-jqdialog" ).addClass( "transfers" );
            } );
            $grid.on( "jqGridFilterReset", function( e ) {
                //.closest(".modal").modal('toggle');
            } );
            $grid.on( "jqGridAfterLoadComplete", function( ) {
                if ( !transfers.$grid.jqGrid( "getGridParam", "search" ) ) {
                    transfers.filterDomClear( );
                }
            } );
        },
        filterGet: function( ) {
            var postData = this.$grid.jqGrid( "getGridParam", "postData" ),
                filters;
            try {
                filters = JSON.parse( postData.filters );
            } catch ( e ) {
                return false;
            }
            if ( typeof filters.groups !== "object" ) {
                filters.groups = [ ];
            }
            return filters;
        },
        filterObj: function( ) {
            return {
                groupOp: "AND",
                groups: [ ]
            };
        },
        filterSet: function( filters ) {
            /*var old = this.filterGet();
            if (old) {
                filters = $.extend(true, {}, old, filters);
			}*/
            var postData = this.$grid.jqGrid( "getGridParam", "postData" );
            postData.filters = JSON.stringify( filters );
            this.$grid.jqGrid( "setGridParam", {
                search: true
            } );
            this.$grid.trigger( "reloadGrid", [ {
                page: 1,
                current: true
            } ] );
            this.$inputClearFilter.removeClass( "disabled" ).prop( "disabled", false );
            return true;
        },
        filterClear: function( ) {
            var postData = this.$grid.jqGrid( "getGridParam", "postData" );
            postData.filters = "";
            this.$grid.jqGrid( "setGridParam", {
                search: false
            } );
            this.$grid.trigger( "reloadGrid", [ {
                page: 1,
                current: true
            } ] );
            this.filterDomClear( );
            return true;
        },
        filterDomClear: function( ) {
            this.$inputProductsFilter.val( "" );
            this.$inputClearFilter.addClass( "disabled" ).prop( "disabled", true );
        },
        filterByProducts: function( searchText ) {
            var filters = this.filterGet( );
            if ( !filters ) {
                filters = this.filterObj( );
            }
            var productsObj = filters.groups.filter( function( elem ) {
                if ( elem.criteria === "products" ) {
                    elem.rules = [ {
                        field: "producto",
                        op: "cn",
                        data: searchText
                    } ];
                    return elem;
                }
            } );
            if ( productsObj.length < 1 ) {
                filters.groups.push( {
                    criteria: "products",
                    groupOp: "OR",
                    rules: [ {
                        field: "producto",
                        op: "cn",
                        data: searchText
                    } ]
                } );
            }
            this.filterSet( filters );
            return true;
        },
        filterRmProduct: function( ) {
            var filters = this.filterGet( );
            if ( !filters ) {
                return true;
            }
            filters = filters.groups.filter( function( elem ) {
                if ( elem.criteria === "products" ) {
                    return;
                }
                return elem;
            } );
            this.filterSet( filters );
            return true;
        },
        help: function( ) {
            var funcs = $.map( this, function( elem, i ) {
                if ( typeof elem === "function" ) {
                    return i;
                }
            } );
            console.log( "defaults" );
            console.log( defaults );
            console.log( "métodos disponibles" );
            console.log( funcs );
            console.log( "------------" );
            return [ JSON.stringify( defaults ), JSON.stringify( funcs ) ];
        },
        helloW: function( text ) {
            // some logic
            return "text: " + text + ", my index: " + $( this.element ).text( text ).index( );
        }
    } );
    // preventing against multiple instantiations,
    // allowing set an action to do at the initialization
    $.fn[ pluginName ] = function( action, options ) {
        var toReturn;
        if ( typeof action !== "string" ) {
            options = action;
            toReturn = this.each( function( i, elem ) {
                if ( !$.data( elem, "plugin_" + pluginName ) ) {
                    $.data( elem, "plugin_" +
                        pluginName, new Plugin( elem, options ) );
                }
            } );
        } else {
            toReturn = this.map( function( i, elem ) {
                var plugin = $.data( elem, "plugin_" + pluginName );
                var tR;
                if ( !plugin ) {
                    plugin = new Plugin( elem, options );
                    $.data( elem, "plugin_" + pluginName, plugin );
                }
                if ( typeof plugin[ camelCase( action ) ] === "function" ) {
                    tR = plugin[ camelCase( action ) ]( options );
                }
                return tR;
            } ).get( );
            switch ( toReturn.length ) {
                case 0:
                    toReturn = null;
                    break;
                case 1:
                    toReturn = toReturn[ 0 ];
                    break;
                default:
            }
        }
        return toReturn;
    };
} )( jQuery, window, document );

"use strict";
import {get_data, getDtParams, checkKey} from "../views/globals";

webix.ui.datafilter.customFilterLnkSpr = webix.extend ({
    render:function(master, config){
        if (this.init) this.init(config);
        config.css = "my_filter";
        return "<input "+(config.placeholder?('placeholder="'+config.placeholder+'" '):"")+"type='text'>";
        },
    _on_key_down:function(e, node, value){
        var id = this._comp_id;
        if ((e.which || e.keyCode) == 9) return;
        if (!checkKey(e.keyCode)) return;
        if (this._filter_timer) window.clearTimeout(this._filter_timer);
        this._filter_timer=window.setTimeout(function(){
            let ui = webix.$$(id);
            if (ui) {
                let params = getDtParams(ui);
                get_data({
                    view: id,
                    navBar: "__nav_ll",
                    start: 1,
                    count: params[1],
                    searchBar: "_link_search",
                    method: "getLnkSprs",
                    field: params[2],
                    direction: params[3],
                    filter: params[0]
                    });
                };
            //if (ui) ui.filterByAll();
            },webix.ui.datafilter.textWaitDelay);
        }
    },  webix.ui.datafilter.textFilter);

"use strict";
import {get_data, getDtParams} from "../views/globals";
webix.protoUI({
    name: "daterangeCustom",
    _footer_row: function(config, width){
        var button = { view:"button", value:"ПРИМЕНИТЬ",
            minWidth:100, maxWidth:230,
            align:"center", height:30, click:function(){
                if (this._filter_timer) window.clearTimeout(this._filter_timer);
                this._filter_timer=window.setTimeout(function(){
                    let ui = webix.$$("__ttl");
                    if (ui) {
                        let params = getDtParams(ui);
                        get_data({
                            view: "__ttl",
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
                    },webix.ui.datafilter.textWaitDelay);
                this.getParentView().getParentView().hide();
                }
            };
        var icons = this._icons_template(config.icons);
        var row = { css:"webix_range_footer",  cols:[
            { width:icons.width }
        ]};
        if((config.button || config.icons) && (icons.width*2+button.minWidth) > width)
            row.cols[0].width = 0;
        row.cols.push(config.button ? button : {});
        row.cols.push(icons);
        return row;
        },
    }, webix.ui.daterange);

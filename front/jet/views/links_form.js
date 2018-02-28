//"use strict";

import {JetView} from "webix-jet";
import History from "../views/history";
import NewformView from "../views/new_form";
import {get_spr} from "../views/globals";
import {get_data} from "../views/globals";
import {last_page, checkKey, getDtParams} from "../views/globals";
import UnlinkView from "../views/unlink";

export default class LinksView extends JetView{
    config(){
        
        var getActDt = function() {
            return ($$("_spr_ch").getValue() === 1) ? "__tt" : "__ttl"
            }

        var getNavL = function() {
            if ($$("_spr_ch").getValue() === 1) return "__nav_l";
            else return "__nav_ll";
            }

        var getMethod = function() {
            if ($$("_spr_ch").getValue() === 1) return "getSprLnks";
            else return "getLnkSprs";
            }
        
        return {view: "cWindow",
            id: "__cw",
            width: document.documentElement.clientWidth * 0.8,
            height: document.documentElement.clientHeight * 0.8,
            modal: true,
            on: {
                onHide: () => {
                    $$(getActDt()).unselectAll();
                    $$("_break").disable();
                    $$("_spr_search").focus();
                    }
                },
            body: { view: "layout",
                rows: [
                        {cols: [
                            {view: "text", label: "", placeholder: "Строка поиска", id: "_link_search", height: 40, fillspace: true,
                                tooltip: "поиск от двух символов", //keyPressTimeout: 900, 
                                on: {
                                    //onTimedKeyPress: function(code, event) {
                                        //let th = this.$scope;
                                        //let count = $$("__tt").config.posPpage;
                                        //let field = $$("__tt").config.fi;
                                        //let direction = $$("__tt").config.di;
                                        //get_data({
                                            //th: th,
                                            //view: "__tt",
                                            //navBar: getNavL(),
                                            //start: 1,
                                            //count: count,
                                            //searchBar: "_link_search",
                                            //method: getMethod(),
                                            //field: field,
                                            //direction: direction
                                            //});
                                        //},
                                    onKeyPress: function(code, event) {
                                        clearTimeout(this.config._keytimed);
                                        if (checkKey(code)) {
                                            this.config._keytimed = setTimeout(function () {
                                            let ui = webix.$$(getActDt());
                                            if (ui) {
                                                let params = getDtParams(ui);
                                                get_data({
                                                    view: getActDt(),
                                                    navBar: getNavL(),
                                                    start: 1,
                                                    count: params[1],
                                                    searchBar: "_link_search",
                                                    method: getMethod(),
                                                    field: params[2],
                                                    direction: params[3],
                                                    filter: params[0]
                                                    });
                                                    }
                                                }, this.$scope.app.config.searchDelay);
                                            }
                                        }
                                    },
                                },
                            {view: "button", type: 'htmlbutton', width: 40,
                                label: "<span class='webix_icon fa-history'></span><span style='line-height: 20px;'></span>",
                                click: () => {
                                    let hist = webix.storage.session.get(getActDt());
                                    this.pophistory.show(hist, $$("_link_search"));
                                    },
                                },
                            {view: "checkbox", labelRight: "Поиск по справочнику", labelWidth: 0, value: this.app.config.lch, disabled: !true, width: 150, id: "_spr_ch",
                                on: {
                                    onChange: () => {
                                        $$("_link_search").setValue('');
                                        let value = $$("_spr_ch").getValue();
                                        if (value===0) {
                                            this.app.config.lch = 0
                                            this.getRoot().getHead().getChildViews()[0].setValue('Поиск по связкам');
                                            }
                                        else if (value===1) {
                                            this.app.config.lch = 1
                                            this.getRoot().getHead().getChildViews()[0].setValue('Поиск по эталонам');
                                            }
                                        this.show((this.app.config.lch===1) ? 'links_form_spr' : 'links_form_lnk');
                                        }
                                    }
                                },
                            {view:"button", type: 'htmlbutton', disabled: !true,
                                label: "<span style='line-height: 20px;'>Сбросить фильтры</span>", width: 220,
                                click: () => {
                                    var cv = getActDt();
                                    var columns = $$(cv).config.columns;
                                    columns.forEach(function(item){
                                        if ($$(cv).isColumnVisible(item.id)) {
                                            if (item.header[1]) {
                                                if (typeof($$(cv).getFilter(item.id).setValue) === 'function') {
                                                    $$(cv).getFilter(item.id).setValue('');
                                                } else {
                                                    $$(cv).getFilter(item.id).value = '';
                                                    };
                                                }
                                            }
                                        });
                                    $$("_link_search").callEvent("onKeyPress", [13,]);
                                    }
                                },
                            {view:"button", type: 'htmlbutton', id: "_break", disabled: true,
                                label: "<span class='webix_icon fa-unlink'></span><span style='line-height: 20px;'>  Разорвать (Ctrl+D)</span>", width: 220,
                                click: () => {
                                    $$(getActDt()).callEvent("onItemDblClick");
                                    }
                                },
                            ]},
                        {height: 10},
                        {$subview: true},
                    ],
                }
            }
        }
        
    showWindow(new_head){
        this.getRoot().getHead().getChildViews()[0].setValue((this.app.config.lch===1) ? 'Поиск по эталонам' : 'Поиск по связкам');
        this.getRoot().show();
        this.show((this.app.config.lch===1) ? 'links_form_spr' : 'links_form_lnk');
        }
    hide(){
        this.getRoot().hide()
        }
    init() {
        this.popnew = this.ui(NewformView);
        this.popunlink = this.ui(UnlinkView);
        this.pophistory = this.ui(History);
        }
    }



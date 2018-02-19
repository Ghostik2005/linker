//"use strict";

import {JetView} from "webix-jet";
import History from "../views/history";
import NewformView from "../views/new_form";
import {get_spr} from "../views/globals";
import {get_data} from "../views/globals";
import {last_page, checkKey} from "../views/globals";
import UnlinkView from "../views/unlink";
import LinksViewSpr from "../views/links_form_spr";

export default class LinksView extends JetView{
    config(){
        function linksTempl(obj, common, value) {
            let ni = "<div>" + value + "</div>";
            //ni = (obj.c_zavod_s) ? ni   + "<br>" + obj.c_zavod_s + "</div>" : ni  + "</div>";
            let ret = common.treetable(obj, common) + ni;
            //console.log(obj, value);
            return ret
            }
        
        function delLnk() {
            let cid = $$("__tt").getSelectedItem().id;
            $$("__tt").remove(cid);
            }
        
        return {view: "cWindow",
            width: document.documentElement.clientWidth * 0.8,
            height: document.documentElement.clientHeight * 0.8,
            modal: true,
            on: {
                onShow: () => {
                        $$("_link_search").focus();
                        get_data({
                            th: this,
                            view: "__tt",
                            navBar: "__nav_l",
                            start: 1,
                            count: 20,
                            searchBar: "_link_search",
                            method: "getSprLnks",
                            field: 'c_tovar',
                            direction: 'asc'
                            });
                    },
                onHide: () => {
                    $$("__tt").unselectAll();
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
                                            //navBar: "__nav_l",
                                            //start: 1,
                                            //count: count,
                                            //searchBar: "_link_search",
                                            //method: "getSprLnks",
                                            //field: field,
                                            //direction: direction
                                            //});
                                        //},
                                    onKeyPress: function(code, event) {
                                        clearTimeout(this.config._keytimed);
                                        if (checkKey(code)) {
                                            this.config._keytimed = setTimeout(function () {
                                            let th = this.$scope;
                                            let count = $$("__tt").config.posPpage;
                                            let field = $$("__tt").config.fi;
                                            let direction = $$("__tt").config.di;
                                            get_data({
                                                th: th,
                                                view: "__tt",
                                                navBar: "__nav_l",
                                                start: 1,
                                                count: count,
                                                searchBar: "_link_search",
                                                method: "getSprLnks",
                                                field: field,
                                                direction: direction
                                                });
                                                }, this.$scope.app.config.searchDelay);
                                            }
                                        }
                                    },
                                },
                            {view: "button", type: 'htmlbutton', width: 40,
                                label: "<span class='webix_icon fa-history'></span><span style='line-height: 20px;'></span>",
                                click: () => {
                                    let hist = webix.storage.session.get("__tt");
                                    this.pophistory.show(hist, $$("_link_search"));
                                    },
                                },
                            {view: "checkbox", labelRight: "Поиск по справочнику", labelWidth: 0, value: 1, disabled: true, width: 150, id: "_spr_ch"},
                            {view:"button", type: 'htmlbutton', id: "_break", disabled: true,
                                label: "<span class='webix_icon fa-unlink'></span><span style='line-height: 20px;'>  Разорвать (Ctrl+D)</span>", width: 220,
                                click: () => {
                                    $$("__tt").callEvent("onItemDblClick");
                                    }
                                },
                            ]},
                        {height: 10},
                        {$subview: LinksViewSpr},
                    ],
                }
            }
        }
        
    show(new_head){
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        this.getRoot().show()
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



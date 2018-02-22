//"use strict";

import {JetView} from "webix-jet";
import History from "../views/history";
import NewformView from "../views/new_form";
import {get_spr} from "../views/globals";
import {get_data} from "../views/globals";
import {last_page, checkKey} from "../views/globals";
import UnlinkView from "../views/unlink";
import LinksViewSpr from "../views/links_form_spr";
import LinksViewLnk from "../views/links_form_lnk";

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
            let cid = $$(getActDt).getSelectedItem().id;
            $$(getActDt).remove(cid);
            }
        
        var getActView = (this.app.config.lch===1) ? {$subview: LinksViewSpr} : {$subview: LinksViewLnk};
        //var getActView = {$subview: LinksViewSpr};

        var getActDt = function() {
            if ($$("_spr_ch").getValue() === 1) return "__tt";
            else return "__ttl";
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
                onShow: () => {
                        $$("_link_search").focus();
                        get_data({
                            th: this,
                            view: getActDt(),
                            navBar: getNavL(),
                            start: 1,
                            count: 20,
                            searchBar: "_link_search",
                            method: getMethod(),
                            field: 'c_tovar',
                            direction: 'asc'
                            });
                    },
                onHide: () => {
                    $$(getActDt).unselectAll();
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
                                            let th = this.$scope;
                                            let count = $$(getActDt).config.posPpage;
                                            let field = $$(getActDt).config.fi;
                                            let direction = $$(getActDt).config.di;
                                            get_data({
                                                th: th,
                                                view: getActDt(),
                                                navBar: getNavL(),
                                                start: 1,
                                                count: count,
                                                searchBar: "_link_search",
                                                method: getMethod(),
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
                                    let hist = webix.storage.session.get(getActDt);
                                    this.pophistory.show(hist, $$("_link_search"));
                                    },
                                },
                            {view: "checkbox", labelRight: "Поиск по справочнику", labelWidth: 0, value: this.app.config.lch, disabled: !true, width: 150, id: "_spr_ch",
                                on: {
                                    onChange: () => {
                                        let value = $$("_spr_ch").getValue();
                                        if (value===0) {
                                            this.app.config.lch = 0
                                            //getActView = {$subview: LinksViewLnk};
                                            }
                                        else if (value===1) {
                                            this.app.config.lch = 1
                                            //getActView = {$subview: LinksViewSpr};
                                            }
                                        console.log('this', this)
                                        this.init();
                                        }
                                    }
                                },
                            {view:"button", type: 'htmlbutton', id: "_break", disabled: true,
                                label: "<span class='webix_icon fa-unlink'></span><span style='line-height: 20px;'>  Разорвать (Ctrl+D)</span>", width: 220,
                                click: () => {
                                    $$(getActDt).callEvent("onItemDblClick");
                                    }
                                },
                            ]},
                        {height: 10},
                        //{$subview: true},
                        getActView,
                    ],
                }
            }
        }
        
    show(new_head){
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        //this._urlChange('../LinksViewLnk');
        this.getRoot().show();
        console.log('this', this);
        console.log('this.root', this.getRoot());
        
        //this.getRoot().show(LinksViewLnk)
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



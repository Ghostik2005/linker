//"use strict";

import {JetView} from "webix-jet";
import History from "../views/history";
import NewformView from "../views/new_form";
import {get_data_test, checkKey, getDtParams} from "../views/globals";
import UnlinkView from "../views/unlink";

export default class LinksBarView extends JetView{
    config(){
        
        var getActDt = () => {
            return this.getRoot().getChildViews()[2].getChildViews()[0];
            }

        var getNavL = () => {
            return this.getRoot().getChildViews()[2].getChildViews()[1];
            }

        var getMethod = () => {
            return this.getRoot().getChildViews()[2].getChildViews()[0].config.searchMethod
            }

        let sprv = {view: "toolbar",
            css: {"border-top": "0px"},
            cols: [
            {view: "text", label: "", placeholder: "Строка поиска", height: 40, fillspace: true, localId: "_ls", 
                on: {
                    onKeyPress: function(code, event) {
                        clearTimeout(this.config._keytimed);
                        if (checkKey(code)) {
                            this.config._keytimed = setTimeout( () => {
                            let ui = getActDt();
                            if (ui) {
                                let params = getDtParams(ui);
                                get_data_test({
                                    view: ui,
                                    navBar: getNavL(),
                                    start: 1,
                                    count: params[1],
                                    searchBar: this.$scope.$$("_ls").config.id,
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
                    let hist = webix.storage.session.get(getActDt().config.name);
                    this.pophistory.show(hist, this.$$("_ls"));
                    },
                },
            {view: "checkbox", labelRight: "<span style='color: white'>Поиск по справочнику</span>", labelWidth: 0, value: this.app.config.lch, width: 150, localId: "_spr_ch",
                on: {
                    onChange: () => {
                        this.$$("_ls").setValue('');
                        let value = this.$$("_spr_ch").getValue();
                        let hh = this.getRoot().getParentView().getParentView().getChildViews()[1].config.options; //headers
                        let header_val;
                        if (value===0) {
                            this.app.config.lch = 0;
                            header_val = "<span class='webix_icon fa-stumbleupon'></span><span style='line-height: 20px;'>Связки</span>";
                        } else if (value===1) {
                            this.app.config.lch = 1;
                            header_val = "<span class='webix_icon fa-stumbleupon'></span><span style='line-height: 16px; font-size: 80%'>Связки:Эталоны</span>"
                            }
                        //for(var i = 0; i < hh.length; i++) {
                            //if (hh[i].id.toString().indexOf('links_bar') > -1){
                                //hh[i].value = header_val;
                                //}
                            //};
                        //this.getRoot().getParentView().getParentView().getChildViews()[1].refresh();
                        this.show((this.app.config.lch===1) ? 'links_form_spr' : 'links_form_lnk');
                        this.$$("_ls").callEvent("onKeyPress", [13,]);
                        }
                    }
                },
            {view:"button", width: 40,
                tooltip: "Сбросить фильтры", type:"imageButton", image: './addons/img/unfilter.svg',
                click: () => {
                    this.$$("_br").hide();
                    var cv = getActDt();
                    var columns = $$(cv).config.columns;
                    columns.forEach(function(item){
                        if (cv.isColumnVisible(item.id)) {
                            if (item.header[1]) {
                                if (typeof(cv.getFilter(item.id).setValue) === 'function') {
                                    cv.getFilter(item.id).setValue('');
                                } else {
                                    let qq = cv.getFilter(item.id);
                                    if (!qq.readOnly) qq.value = '';
                                    };
                                }
                            }
                        });
                    this.$$("_ls").callEvent("onKeyPress", [13,]);
                    }
                },
            {view:"button", type: 'htmlbutton', hidden: !true, localId: "_br", 
                label: "<span style='color: red', class='webix_icon fa-unlink'></span><span style='line-height: 20px;'>  Разорвать</span>", width: 140,
                click: () => {
                    getActDt().callEvent("onItemDblClick");
                    }
                },
            ]}

        var _view = {
            view: "layout", type: "clean",
            css: {'border-left': "1px solid #dddddd !important"},
            rows: [
                sprv,
                {height: 1},
                {$subview: true},
                ]}
        return _view
        }

    ready() {
        let hh = this.getRoot().getParentView().getParentView().getChildViews()[1].config.options;
        let show_t = (this.app.config.lch===1) ? 'links_form_spr' : 'links_form_lnk';
        this.show(show_t);
        this.$$("_ls").callEvent("onKeyPress", [13,]);
        }

    init() {
        this.popnew = this.ui(NewformView);
        this.popunlink = this.ui(UnlinkView);
        this.pophistory = this.ui(History);
        }
    }


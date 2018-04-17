//"use strict";

import {JetView} from "webix-jet";
import History from "../views/history";
import NewformView from "../views/new_form";
import {get_data} from "../views/globals";
import {get_data_test} from "../views/globals";
import {checkKey, getDtParams} from "../views/globals";
import UnlinkView from "../views/unlink";

export default class LinksBarView extends JetView{
    config(){
        
        var getActDt = () => {
            //console.log(this.getRoot().getChildViews());
            return this.getRoot().getChildViews()[2].getChildViews()[0];
            }

        var getNavL = () => {
            return this.getRoot().getChildViews()[2].getChildViews()[1];
            }

        var getMethod = () => {
            return this.getRoot().getChildViews()[2].getChildViews()[0].config.searchMethod
            }

        let sprv = {cols: [
            {view: "text", label: "", placeholder: "Строка поиска", id: "_link_search", height: 40, fillspace: true,
                tooltip: "поиск от двух символов", 
                on: {
                    onKeyPress: function(code, event) {
                        clearTimeout(this.config._keytimed);
                        if (checkKey(code)) {
                            this.config._keytimed = setTimeout(function () {
                            let ui = getActDt();
                            if (ui) {
                                let params = getDtParams(ui);
                                get_data_test({
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
                    let hist = webix.storage.session.get(getActDt().config.name);
                    this.pophistory.show(hist, $$("_link_search"));
                    },
                },
            {view: "checkbox", labelRight: "Поиск по справочнику", labelWidth: 0, value: this.app.config.lch, disabled: !true, width: 150, id: "_spr_ch",
                on: {
                    onChange: () => {
                        $$("_link_search").setValue('');
                        let value = $$("_spr_ch").getValue();
                        let hh = this.getRoot().getParentView().getParentView().getChildViews()[1].config.options; //headers
                        for(var i = 0; i < hh.length; i++) {
                            if ('links_bar' === hh[i].id){
                                console.log('id', hh[i].id);
                                if (value===0) {
                                    this.app.config.lch = 0;
                                    hh[i].value = "<span style='line-height: 20px;'>Связки</span>";
                                } else if (value===1) {
                                    this.app.config.lch = 1;
                                    hh[i].value = "<span style='line-height: 20px;'>Связки:Эталоны</span>"
                                    }
                                }
                            };
                        this.getRoot().getParentView().getParentView().getChildViews()[1].refresh();
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
                    $$("_link_search").callEvent("onKeyPress", [13,]);
                    }
                },
            {view:"button", type: 'htmlbutton', id: "_break", disabled: true, hidden: true,
                label: "<span class='webix_icon fa-unlink'></span><span style='line-height: 20px;'>  Разорвать (Ctrl+D)</span>", width: 220,
                click: () => {
                    getActDt().callEvent("onItemDblClick");
                    }
                },
            ]}

        var _view = {
            id: "links_bar",
            view: "layout",
            rows: [
                sprv,
                {height: 10},
                {$subview: true},
                ]}
        return _view
        }

    ready() {
        let hh = this.getRoot().getParentView().getParentView().getChildViews()[1].config.options;
        for(var i = 0; i < hh.length; i++) {
            if ('links_bar' === hh[i].id){
                hh[i].value = (this.app.config.lch===1) ? "<span style='line-height: 20px;'>Связки:Эталоны</span>" : "<span style='line-height: 20px;'>Связки</span>";
                }
            }
        this.getRoot().getParentView().getParentView().getChildViews()[1].refresh();
        this.show((this.app.config.lch===1) ? 'links_form_spr' : 'links_form_lnk');
        }

    init() {
        this.popnew = this.ui(NewformView);
        this.popunlink = this.ui(UnlinkView);
        this.pophistory = this.ui(History);
        }
    }



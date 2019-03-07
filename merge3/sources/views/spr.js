"use strict";

import {JetView} from "webix-jet";
import PagerView from "../views/pager"
//import NewformView from "../views/new_form";
import {checkKey, getDtParams, get_data_test, request, checkVal} from "../views/globals";
import History from "../views/history";
import SprHistory from "../views/spr_history"

export default class SprView extends JetView{
    config(){
        var app = this.app;
        
        var header = {view: 'toolbar', height: 40,
            cols: [
                {view: "text", label: "", labelWidth: 1, placeholder: "Поиск по названию", 
                _keytimed: undefined, localId: "_spr_search",
                    on: {
                        onKeyPress: function(code, event) {
                            clearTimeout(this.config._keytimed);
                            if (checkKey(code)) {
                                this.config._keytimed = setTimeout(() => {
                                    let uu = this.$scope.getRoot().getChildViews();
                                    let ui = uu[2];
                                    if (ui) {
                                        let params = getDtParams(ui);
                                        get_data_test({
                                            view: ui,
                                            navBar: uu[3],
                                            start: 1,
                                            searchBar: ui.config.searchBar,
                                            method: ui.config.searchMethod,
                                            field: params[2],
                                            direction: params[3],
                                            filter: params[0],
                                            count: params[1],
                                        });
                                    }
                                }, this.$scope.app.config.searchDelay);
                            }
                        }
                    },
                },
                {view:"button", width: 38,
                    tooltip: "Сбросить фильтры", type:"imageButton", image: './library/img/unfilter.svg',
                    localId: "_unfilt",
                    label: "",
                    click: () => {
                        this.$$("_spr_search").setValue('');
                        this.$$("_spr_search").callEvent("onKeyPress", [13,]);
                    }
                },
                {view: "button", //type: 'htmlbutton', 
                    width: 38, hidden: !true,
                    tooltip: "история поиска",
                    //label: "<span class='webix_icon fas fa-history'></span><span style='line-height: 20px;'></span>",
                    type:"imageButton", image: './library/img/history.svg',
                    click: () => {
                        let nm = this.$$("__table").config.name;
                        let hist = webix.storage.session.get(nm);
                        this.pophistory.show(hist, this.$$("_spr_search"));
                    },
                },
            ]
        }

        var sprv = {view: "datatable",
            name: "_spr",
            localId: "__table",
            navigation: "row",
            select: true,
            resizeColumn:true,
            fixedRowHeight:false,
            resizeRow: true,
            //autoheight:true,
            rowLineHeight:30, 
            rowHeight:60,
            editable: false,
            multiselect: false,
            headermenu:{
                autowidth: true, 
                },
            startPos: 1,
            posPpage: app.config.posPpage,
            totalPos: 0,
            fi: 'c_tovar',
            di: 'asc',
            old_stri: "",
            searchBar: "_spr_search",
            searchMethod: "getSprSearch",
            css: "spr_table",
            type:{
                itemIcon: () => {
                    let img = "<div class='webix_image', style='width:30px;height:30px;background-image:url(./library/img/log.svg);'</div>"
                    let but = "<div class='webix_el_button posi'><button class='webix_img_btn_abs spr_button', style='background:transparent'>" + img + "</button> </div>";
                    //but = "<div class='webix_el_button spr_button'> <button class='webixtype_base'>C</button> </div>";
                    return but
                },
            }, 
            onClick:{
                spr_button:function(ev, id, html){
                    let item = this.getItem(id);
                    this.$scope.popsprh.show_w(item);
                }
            },
            columns: [
                {id: "id_spr", width: 80, sort: "server",
                    header: [{text: "IDSPR"},
                    ],
                    headermenu:!false,
                    hidden: true
                },
                { id: "c_tovar", fillspace: 1, sort: "server",
                    header: [{text: "Название"},
                    ],
                    template: (obj, common, value)=>{
                        let butt = common.itemIcon();
                        let first_row = "<span class='first_row'>" + value + "</span>";
                        let second_row = "<span style='color: darkgrey !important'>" + obj.c_zavod + ","  + obj.c_strana  + "</span>";
                        let col = "<div class='right_col'>" + first_row +  "<br>" + second_row + "</div>"
                        return "<div class = 'spr_hover'>" + butt + col + "</div>";
                    },
                    //template: "{common.itemIcon()}#c_tovar#<br><span style='color: darkgrey !important'>#c_zavod#, #c_strana#</span>",
                    headermenu:false,
                },
            ],
            on: {
                "onresize": webix.once(function(){ 
                    this.adjustRowHeight(); 
                }),
                "data->onParse":function(i, data){
                    this.clearAll();
                },
                onBeforeSort: (field, direction) => {
                    this.$$("__table").config.fi = field;
                    this.$$("__table").config.di = direction;
                    this.getRoot().getChildViews()[3].$scope.$$("__page").setValue(0);
                    this.getRoot().getChildViews()[3].$scope.$$("__page").refresh();
                    return
                },
                onBeforeRender: function() {
                    webix.extend(this, webix.ProgressBar);
                },
                onItemDblClick: function(item) {
                    //окно свойств товара
                },
                onAfterLoad: function() {
                    this.hideProgress();
                    },
                onAfterUnSelect: function() {
                    let rows = this.data.order;
                    let check = false;
                    rows.forEach( (item) => {
                        if (this.isSelected(item)) {
                            check = true;
                        }
                    })
                    if (!check) {
                        this.$scope.parent.inactive_table.unselectAll();
                    }
                },
                onAfterSelect: function() {
                    // загружаем данные с сервера
                    let item = this.getSelectedItem();
                    if (item) {
                        let url = app.config.r_url + "?getVnd";
                        let customers = this.$scope.getRoot().getParentView().getParentView().getChildViews()[0].$scope.$$("_iList").config.label;
                        customers += this.$scope.getRoot().getParentView().getParentView().getChildViews()[0].$scope.$$("_iList").config.tooltip;
                        let active_table = this.$scope.parent.active_table;
                        customers = customers.split(', ');
                        let inns = [];
                        this.$scope.parent.w.forEach( (item) => {
                            inns.push(item.inn);
                        })
                        active_table.showProgress({
                            //type: "icon",
                            type: "top",
                            });
                        active_table.clearAll();
                        let params = {"user": app.config.user, "id_spr": item.id_spr, "customers": inns}
                        request(url, params).then(function(data) {
                            data = checkVal(data, 'a');
                            if (data) {
                                active_table.parse(data.active);
                                active_table.hideProgress();
                            }
                        });
                    };
                },
                onKeyPress: function(code, e){
                    if (13 === code) {
                        if (this.getSelectedItem()) this.callEvent("onItemDblClick");
                    }
                },
            }
        }
        var view = {
            view: "layout",
            //width: document.documentElement.clientWidth*.3,
            gravity: 3,
            // css: {'border-top': "1px solid #dadee0 !important", "background": "#f4f5f9"},
            css: "spr_header",
            rows: [
                {view: "label", label: "Эталоны", 
                    align:"center",
                    css: {'border-left': "1px solid #dadee0 !important", 'border-right': "1px solid #dadee0 !important",}
                },
                header,
                sprv,
                {$subview: PagerView},
            ]
        }

        return view
        }

    ready(view) {
        this.parent = view.getParentView().$scope;
        this.$$("__table").markSorting(this.$$("__table").config.fi,this.$$("__table").config.di);
        this.$$("_spr_search").callEvent('onKeyPress', [13,]);

    }

    init() {
        this.pophistory = this.ui(History);
        this.popsprh = this.ui(SprHistory)
        
    }
}
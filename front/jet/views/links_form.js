//"use strict";

import {JetView} from "webix-jet";
import NewformView from "../views/new_form";
import {get_spr} from "../views/globals";
import {prcs} from "../views/globals";
import {get_data} from "../views/globals";
import {last_page} from "../views/globals";
import ConfirmView from "../views/yes-no";

export default class LinksView extends JetView{
    config(){
        function linksTempl(obj, common, value) {
            let ni = "<div>" + value + "</div>";
            //ni = (obj.c_zavod_s) ? ni   + "<br>" + obj.c_zavod_s + "</div>" : ni  + "</div>";
            let ret = common.treetable(obj, common) + ni;
            console.log(obj, value);
            return ret
            }
            
        return {view: "cWindow",
            width: document.documentElement.clientWidth * 0.8,
            height: document.documentElement.clientHeight * 0.8,
            modal: true,
            on: {
                onShow: () => {
                        get_data({
                            th: this,
                            view: "__tt",
                            navBar: "__nav_l",
                            start: 1,
                            count: 20,
                            searchBar: "_link_search",
                            method: "getSprLnks"
                            });
                    },
                onHide: () => {
                    $$("__tt").clearAll();
                    $$("_link_search").setValue('');
                    $$("_break").disable();
                    }
                },
            body: { view: "form",
                margin: 0,
                elements: [
                    { view: "form",
                        margin: 0,
                        elements: [
                            {rows: [
                                {cols: [
                                    {view: "text", label: "", placeholder: "Строка поиска", width: 500, id: "_link_search",
                                        keyPressTimeout: 900, tooltip: "!слово - исключить из поиска",
                                        on: {
                                            onTimedKeyPress: function(code, event) {
                                                let th = this.$scope;
                                                let count = $$("__tt").config.posPpage;
                                                get_data({
                                                    th: th,
                                                    view: "__tt",
                                                    navBar: "__nav_l",
                                                    start: 1,
                                                    count: count,
                                                    searchBar: "_link_search",
                                                    method: "getSprLnks"
                                                    });
                                                }
                                            },
                                        },
                                    {view: "checkbox", labelRight: "Поиск по словарю", labelWidth: 0},
                                    {view:"button", type: 'htmlbutton', id: "_break", disabled: true,
                                        label: "<span class='webix_icon fa-unlink'></span><span style='line-height: 20px;'>  Разорвать (Ctrl+D)</span>", width: 220,
                                        click: () => {
                                            this.popconfirm.show('Разорвать?');
                                            }
                                        },
                                    ]},
                                {height: 10},
                                {view: "treetable",
                                    id: "__tt",
                                    startPos: 1,
                                    posPpage: 20,
                                    totalPos: 1250,
                                    select: true,
                                    borderless: true,
                                    rowHeight: 30,
                                    fixedRowHeight:false,
                                    columns: [
                                        {id: "c_tovar", header: "Наименование" , fillspace: true,
                                            template:"<span>{common.treetable()} #c_tovar#</span>" 
                                            //template: linksTempl
                                            },
                                        {id: "c_zavod", header: "Производитель", width: 250},
                                        {id: "c_vnd", header: "Поставщик", width: 200},
                                        {id: "id_tovar", header: "Код", width: 100},
                                        {id: "dt", header: "Дата", width: 160},
                                        {id: "owner", header: "Создал", width: 120}
                                        ],
                                    on: {
                                        onBeforeRender: function() {
                                            webix.extend(this, webix.ProgressBar);
                                            if (!this.count) {
                                                this.showProgress({
                                                    type: "icon",
                                                    icon: '<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i>'
                                                    });
                                                }
                                            },
                                        onItemDblClick: function (item, ii, iii) {
                                            console.log(item);
                                            let level = this.getSelectedItem().$level;
                                            if (level === 1) {
                                                item = item.row;
                                                item = get_spr(this.$scope, item);
                                                item["s_name"] = "Страна: " + item.c_strana;
                                                item["t_name"] = "Название товара: " + item.c_tovar;
                                                item["v_name"] = "Производитель: " + item.c_zavod;
                                                item["dv_name"] = "Действующее вещество: " + item.c_dv;
                                                this.$scope.popnew.show("Редактирование записи " + item.id_spr, item);
                                            } else if (level === 2) {
                                                this.$scope.popconfirm.show('Разорвать?');
                                                };
                                            },
                                        onKeyPress: function(code, e){
                                            if (13 === code) {
                                                this.callEvent("onItemDblClick");
                                                }
                                            },
                                        onBeforeSelect: function (item) {
                                            },
                                        onAfterSelect: function (item) {
                                            let level = this.getSelectedItem().$level;
                                            if (level === 1) {
                                                $$("_break").disable();
                                            } else if (level === 2) {
                                                $$("_break").enable();
                                                };
                                            }
                                        },
                                    },
                                {view: "toolbar",
                                    id: "__nav_l",
                                    height: 36,
                                    cols: [
                                        {view: "button", type: 'htmlbutton',
                                            label: "<span class='webix_icon fa-angle-double-left'></span>", width: 50,
                                            click: () => {
                                                let start = 1;
                                                let count = $$("__tt").config.posPpage;
                                                get_data({
                                                    th: this,
                                                    view: "__tt",
                                                    navBar: "__nav_l",
                                                    start: start,
                                                    count: count,
                                                    searchBar: "_link_search",
                                                    method: "getSprLnks"
                                                    });
                                                }
                                            },
                                        {view: "button", type: 'htmlbutton',
                                            label: "<span class='webix_icon fa-angle-left'></span>", width: 50,
                                            click: () => {
                                                let start = $$("__tt").config.startPos - $$("__tt").config.posPpage;
                                                start = (start < 0) ? 1 : start;
                                                let count = $$("__tt").config.posPpage;
                                                get_data({
                                                    th: this,
                                                    view: "__tt",
                                                    navBar: "__nav_l",
                                                    start: start,
                                                    count: count,
                                                    searchBar: "_link_search",
                                                    method: "getSprLnks"
                                                    });
                                                }
                                            },
                                        {view: "label", label: "Страница 1 из 1", width: 200},
                                        {view: "button", type: 'htmlbutton',
                                            label: "<span class='webix_icon fa-angle-right'></span>", width: 50,
                                            click: () => {
                                                let start = $$("__tt").config.startPos + $$("__tt").config.posPpage;
                                                start = (start > $$("__tt").config.totalPos) ? last_page("__tt"): start;
                                                let count = $$("__tt").config.posPpage;
                                                get_data({
                                                    th: this,
                                                    view: "__tt",
                                                    navBar: "__nav_l",
                                                    start: start,
                                                    count: count,
                                                    searchBar: "_link_search",
                                                    method: "getSprLnks"
                                                    });
                                                }
                                            },
                                        {view: "button", type: 'htmlbutton',
                                            label: "<span class='webix_icon fa-angle-double-right'></span>", width: 50,
                                            click: () => {
                                                let start = last_page("__tt");
                                                let count = $$("__tt").config.posPpage;
                                                get_data({
                                                    th: this,
                                                    view: "__tt",
                                                    navBar: "__nav_l",
                                                    start: start,
                                                    count: count,
                                                    searchBar: "_link_search",
                                                    method: "getSprLnks"
                                                    });
                                                }
                                            },
                                        {},
                                        {view: "label", label: "Всего записей: 0", width: 180},
                                        ]
                                    },
                                ]}
                            ],
                        },
                    ]
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
        this.popconfirm = this.ui(ConfirmView);
        }
    }



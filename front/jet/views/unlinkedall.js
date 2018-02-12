"use strict";

import {JetView} from "webix-jet";
import {get_data} from "../views/globals";
import {last_page} from "../views/globals";
import {parse_unlinked_item, prcs} from "../views/globals";

export default class AllUnlinkedView extends JetView{
    config(){

        function getParams(ui) {
            let c_filter = {
                        'c_tovar'   : $$(ui).getFilter('c_tovar').value,
                        'c_vnd'     : $$(ui).getFilter('c_vnd').value,
                        'c_zavod'   : $$(ui).getFilter('c_zavod').value,
                        'c_user'    : $$(ui).getFilter('c_user').value
                        }
            let count = ui.config.posPpage;
            let field = ui.config.fi;
            let direction = ui.config.di;
            return [c_filter, count, field, direction]
            }

        webix.ui.datafilter.customFilter = webix.extend ({
            render:function(master, config){
                if (this.init) this.init(config);
                config.css = "my_filter";
                return "<input "+(config.placeholder?('placeholder="'+config.placeholder+'" '):"")+"type='text'>";
                },
            _on_key_down:function(e, node, value){
                var id = this._comp_id;
                if ((e.which || e.keyCode) == 9) return;
                if (this._filter_timer) window.clearTimeout(this._filter_timer);
                this._filter_timer=window.setTimeout(function(){
                    let ui = webix.$$(id);
                    if (ui) {
                        let params = getParams(ui);
                        get_data({
                            view: id,
                            navBar: "__nav_a",
                            start: 1,
                            count: params[1],
                            searchBar: undefined,
                            method: "getPrcsAll",
                            field: params[2],
                            direction: params[3],
                            filter: params[0]
                            });
                        };
                    //if (ui) ui.filterByAll();
                    },webix.ui.datafilter.textWaitDelay);
                }
            },  webix.ui.datafilter.textFilter);

        var top = {//view: 'toolbar',
                    height: 40,
                    cols: [
                        {view: "text", label: "", value: "", labelWidth: 1, placeholder: "Строка поиска", id: "_search_all",
                            keyPressTimeout: 900, tooltip: "!слово - исключить из поиска",
                            on: {
                                onTimedKeyPress: (code, event) => {
                                    let count = $$("__dt_a").config.posPpage;
                                    let field = $$("__dt_a").config.fi;
                                    let direction = $$("__dt_a").config.di;
                                    get_data({
                                        th: this,
                                        view: "__dt_a",
                                        navBar: "__nav_a",
                                        start: 1,
                                        count: count,
                                        searchBar: "_search_all",
                                        method: "getPrcsAll",
                                        field: field,
                                        direction: direction
                                        });
                                    }
                                },
                            },
                        ]
                    }

        var bottom = {
            view: "toolbar",
            id: "__nav_a",
            height: 36,
            cols: [
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-double-left'></span>", width: 50,
                    click: () => {
                        var id = "__dt_a";
                        let ui = webix.$$(id);
                        if (ui) {
                            let params = getParams(ui);
                            get_data({
                                view: id,
                                navBar: "__nav_a",
                                start: 1,
                                count: params[1],
                                searchBar: undefined,
                                method: "getPrcsAll",
                                field: params[2],
                                direction: params[3],
                                filter: params[0]
                                });
                            };
                        }
                    },
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-left'></span>", width: 50,
                    click: () => {
                        let start = $$("__dt_a").config.startPos - $$("__dt_a").config.posPpage;
                        start = (start < 0) ? 1 : start;
                        var id = "__dt_a";
                        let ui = webix.$$(id);
                        if (ui) {
                            let params = getParams(ui);
                            get_data({
                                view: id,
                                navBar: "__nav_a",
                                start: start,
                                count: params[1],
                                searchBar: undefined,
                                method: "getPrcsAll",
                                field: params[2],
                                direction: params[3],
                                filter: params[0]
                                });
                            };
                        }
                    },
                {view: "label", label: "Страница 1 из 1", width: 200, id: "__pager_a"},
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-right'></span>", width: 50,
                    click: () => {
                        var id = "__dt_a";
                        let ui = webix.$$(id);
                        if (ui) {
                            let start = ui.config.startPos + ui.config.posPpage;
                            start = (start > ui.config.totalPos) ? last_page(id): start;
                            let params = getParams(ui);
                            get_data({
                                view: id,
                                navBar: "__nav_a",
                                start: start,
                                count: params[1],
                                searchBar: undefined,
                                method: "getPrcsAll",
                                field: params[2],
                                direction: params[3],
                                filter: params[0]
                                });
                            };
                        }
                    },
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-double-right'></span>", width: 50,
                    click: () => {
                        var id = "__dt_a";
                        let ui = webix.$$(id);
                        if (ui) {
                            let start = last_page(id);
                            let params = getParams(ui);
                            get_data({
                                view: id,
                                navBar: "__nav_a",
                                start: start,
                                count: params[1],
                                searchBar: undefined,
                                method: "getPrcsAll",
                                field: params[2],
                                direction: params[3],
                                filter: params[0]
                                });
                            };
                        }
                    },
                {},
                {view: "label", label: "Всего записей: 0", width: 180, id: "__count_a"},
                ]
            };

        var sprv = {view: "datatable",
            id: "__dt_a",
            navigation: "row",
            select: true,
            resizeColumn:true,
            fixedRowHeight:false,
            rowLineHeight:32,
            rowHeight:32,
            editable: false,
            headermenu:true,
            startPos: 1,
            posPpage: 20,
            totalPos: 1250,
            fi: 'c_tovar',
            di: 'asc',
            old_stri: " ",
            columns: [
                {id: "id_tovar", width: 80, //sort: "server",
                    hidden: true,
                    header: [{text: "ID товара"},
                        ],
                    },
                { id: "c_tovar", fillspace: 1, sort: "server",
                    headermenu:false,
                    header: [{text: "Название"},
                        {content: "customFilter"},
                        ]
                    },
                { id: "c_vnd", sort: "server",
                    width: 200,
                    header: [{text: "Поставщик"},
                        {content: "customFilter"},
                        ]
                    },
                { id: "c_zavod", sort: "server",
                    width: 200,
                    header: [{text: "Производитель"},
                        {content: "customFilter"},
                        ]
                    },
                { id: "c_user", sort: "server",
                    width: 160,
                    header: [{text: "Пользователь"},
                        {content: "customFilter"},
                        ]
                    },
                ],
            on: {
                "data->onParse":function(i, data){
                    this.clearAll();
                    },
                onBeforeRender: function() {
                    webix.extend(this, webix.ProgressBar);
                    if (!this.count) {
                        this.showProgress({
                            type: "icon",
                            icon: '<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i>'
                            });
                        }
                    },
                onBeforeSort: (field, direction) => {
                    var id = "__dt_a";
                    let ui = webix.$$(id);
                    if (ui) {
                        let start = ui.config.startPos;
                        let params = getParams(ui);
                        get_data({
                            view: id,
                            navBar: "__nav_a",
                            start: start,
                            count: params[1],
                            searchBar: undefined,
                            method: "getPrcsAll",
                            field: params[2],
                            direction: params[3],
                            filter: params[0]
                            });
                        };
                    },
                onItemDblClick: () => {
                    let item = $$("__dt_a").getSelectedItem();
                    if (this.app.config.role === this.app.config.admin || item.c_user === this.app.config.user) {
                        //разрешено редактирование только админами или текущий пользовватель совпадает с ответственным
                        let suppl_dt = $$("_suppl").getList()
                        let data = suppl_dt.data.order;
                        let cid;
                        //console.log('item', item);
                        data.forEach(function(d_item, i, data) {
                            if (suppl_dt.getItem(d_item).c_vnd === item.c_vnd) {
                                cid = suppl_dt.getItem(d_item).id;
                                };
                            });
                        if (cid) {
                            suppl_dt.getItem(cid).count += 1;
                            $$("_suppl").setValue(cid);
                            setTimeout(function() {
                                prcs.add(item, 0);
                                prcs.setCursor(cid);
                                //console.log(prcs.data.order);
                                parse_unlinked_item(this, item);
                                }, 800);
                        } else {
                            let p_item = {"id": 'new', "count": 1, "c_vnd": item.c_vnd, "id_vnd": item.id_vnd}
                            suppl_dt.add(p_item);
                            $$("_suppl").setValue('new');
                            setTimeout(function() {
                                prcs.clearAll();
                                prcs.add(item, 0);
                                let iid = prcs.data.order[0];
                                prcs.setCursor(iid);
                                //console.log(prcs.data.order);
                                parse_unlinked_item(this, item);
                                }, 800);
                            };
                        this.getRoot().hide();
                    } else {
                        webix.message({"text": "Упс. Нет доступа.", "type": "debug"});
                        }
                    },
                onKeyPress: function(code, e){
                    if (13 === code) {
                        this.callEvent("onItemDblClick");
                        }
                    },
                onAfterLoad: function() {
                    this.hideProgress();
                    },
                onBeforeSelect: () => {
                    }
                }
            }
        var _view = {view: "cWindow",
            width: document.documentElement.clientWidth * 0.8,
            height: document.documentElement.clientHeight * 0.8,
            modal: true,
            on: {
                onShow: () => {
                    var id = "__dt_a";
                    let ui = webix.$$(id);
                    if (ui) {
                        let params = getParams(ui);
                        get_data({
                            view: id,
                            navBar: "__nav_a",
                            start: 1,
                            count: params[1],
                            searchBar: undefined,
                            method: "getPrcsAll",
                            field: params[2],
                            direction: params[3],
                            filter: params[0]
                            });
                        };
                    }
                },
            body: {
                view: "layout",
                rows: [
                    //top,
                    sprv,
                    bottom,
                    ]}
                }
        return _view
        }

    show(new_head){
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        this.getRoot().show()
        }
    hide(){
        this.getRoot().hide()
        }
    init() {
        $$("__dt_a").getFilter('c_user').value = this.app.config.user;
        }
    }

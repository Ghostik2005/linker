//"use strict";

import {JetView} from "webix-jet";
import NewstriView from "../views/new_stri";
import NewbarView from "../views/new_bar";
import NewtgView from "../views/new_tg";
import {strana, vendor, dv} from "../views/globals";
import {sezon, nds, group, hran} from "../views/globals";
import {request, checkVal, prcs, delPrc, barcodes} from "../views/globals";

export default class NewformView extends JetView{
    config(){
        function strana_filter(item, value) {
            value = value.toString().toLowerCase()
            value = new RegExp(".*" + value.replace(/ /g, ".*") + ".*");
            return item.c_strana.toString().toLowerCase().search(value) != -1;
            };
        function zavod_filter(item, value) {
            value = value.toString().toLowerCase()
            value = new RegExp(".*" + value.replace(/ /g, ".*") + ".*");
            return item.c_zavod.toString().toLowerCase().search(value) != -1;
            };
        function dv_filter(item, value) {
            value = value.toString().toLowerCase()
            value = new RegExp(".*" + value.replace(/ /g, ".*") + ".*");
            return item.act_ingr.toString().toLowerCase().search(value) != -1;
            };
        function gr_filter(item, value) {
            value = value.toString().toLowerCase()
            value = new RegExp(".*" + value.replace(/ /g, ".*") + ".*");
            return item.group.toString().toLowerCase().search(value) != -1;
            };
        function sez_filter(item, value) {
            value = value.toString().toLowerCase()
            value = new RegExp(".*" + value.replace(/ /g, ".*") + ".*");
            return item.sezon.toString().toLowerCase().search(value) != -1;
            };
        function hran_filter(item, value) {
            value = value.toString().toLowerCase()
            value = new RegExp(".*" + value.replace(/ /g, ".*") + ".*");
            return item.usloviya.toString().toLowerCase().search(value) != -1;
            };

        function check(item){
            if (item) {
                if (item.toString().length > 0 ) return true
                else return false
            } else {
                return false
                }
            }
        function addZavod(item) {
            vendor.add(item, 0);
            }
            
        function addDv(item) {
            dv.add(item, 0);
            }

        return {view: "cWindow",
            modal: true,
            on: {
                onHide: function() {
                    barcodes.clearAll();
                    this.$scope.$$("new_form").clear();
                    this.$scope.$$("new_form").reconstruct();
                    }
                },
            body: { view: "form",
                localId: "new_form",
                margin: 0,
                spr: false,
                search_bar: undefined,
                rules:{
                    "c_tovar": webix.rules.isNotEmpty,
                    "id_strana": webix.rules.isNotEmpty,
                    "id_zavod": webix.rules.isNotEmpty,
                    "id_dv": webix.rules.isNotEmpty
                    },
                elements: [
                    {rows: [
                        {view: "label", label:"Название товара:", name: 't_name'},
                        {view: "text", label: "", value: "", name: "c_tovar", required: true},
                        {height: 10, width: 700},
                        {cols: [
                            {rows: [
                                {view: "label", label:"Страна:", name: "s_name"},
                                {view:"combo", width: 400, value: "", name: 'id_strana', required: true,
                                    options:  {
                                        filter: strana_filter,
                                        body: {
                                            template:"#c_strana#",
                                            yCount:7,
                                            //data: strana
                                            }
                                        },
                                    on: {
                                        onAfterRender: function() {
                                            this.getList().sync(strana);
                                            }
                                        },
                                    },
                                {view: "label", label:"Производитель:", name: "v_name"},
                                {cols: [
                                    {view:"combo", label: "", value: "", name: "id_zavod", required: true,
                                        options:  {
                                            filter: zavod_filter,
                                            body: {
                                                template:"#c_zavod#",
                                                yCount:7,
                                                //data: vendor
                                                }
                                            },
                                        on: {
                                            onAfterRender: function() {
                                                this.getList().sync(vendor);
                                                }
                                            },
                                        },
                                    {view: "button", type: "base", label: "+", width: 30, disabled: true,
                                        on: {
                                            onAfterRender: function () {
                                                if (this.$scope.app.config.role === this.$scope.app.config.admin) this.enable();
                                                }
                                            },
                                        click: () => {
                                            let params = {'new_name': 'c_zavod', 'url': "Zavod", "callback": addZavod}
                                            this.popstri.show("Добавление производителя", params);
                                            }
                                        },
                                    ]},
                                {view: "label", label:"Действующее вещество:", name: 'dv_name'},
                                {cols: [
                                    {view:"combo", label: "", value: "", name: "id_dv", required: true,
                                        options:  {
                                            filter: dv_filter,
                                            body: {
                                                autoheight:false,
                                                view:"list",
                                                type:{ height:"auto" },
                                                template: "<div class='comboList'>#act_ingr#</div>",
                                                height: 200,
                                                yCount:0,
                                                //data: dv
                                                }
                                            },
                                        on: {
                                            onAfterRender: function() {
                                                this.getList().sync(dv);
                                                }
                                            },
                                        },
                                    {view: "button", type: "base", label: "+", width: 30, disabled: true,
                                        on: {
                                            onAfterRender: function () {
                                                if (this.$scope.app.config.role === this.$scope.app.config.admin) this.enable();
                                                }
                                            },
                                        click: () => {
                                            let params = {'new_name': 'act_ingr', 'url': "Dv1", "callback": addDv}
                                            this.popstri.show("Добавление д.вещества", params);
                                            }
                                        },
                                    ]},
                                {view:"text", label: "Штрих-код:", value: "", labelPosition:"top", readonly: true, name: "barcode", localId: "_barc",
                                    click: () => {
                                        let id_spr = this.$$("new_form").getValues().id_spr;
                                        this.popbar.show("Редактирование ш.кодов", id_spr, this);
                                        }
                                    },
                                {view: "text", label: "Товарная группа:", labelPosition:"top", value: "", name: "c_tgroup", localId: "_c_tgroup",
                                    readonly: true,
                                    click: () => {
                                        let id_spr = this.$$("new_form").getValues().id_spr;
                                        this.poptg.show("Редактирование товарных групп", id_spr, this);
                                        }
                                    }
                                ]},
                            {width: 5,},
                            {rows: [
                                {view: "form", css: "borders",
                                    localId: "new_f_right",
                                    elements: [
                                        {view: "checkbox", labelRight: "Рецептурный", labelWidth: 0, align: "left", name: "_prescr"},
                                        {view: "checkbox", labelRight: "Обязательный", labelWidth: 0, align: "left", name: "_mandat"},
                                        {view:"combo", label: "Сезон:", labelPosition:"top", value: "", name: "id_sezon", css: "small",
                                            options:  {
                                                filter: sez_filter,
                                                body: {
                                                    //autoheight:false,
                                                    //view:"list",
                                                    //type:{ height:"auto" },
                                                    template: "#sezon#",
                                                    //height: 400,
                                                    yCount:5,
                                                    //data: sezon
                                                    }
                                                },
                                            on: {
                                                onAfterRender: function() {
                                                    this.getList().sync(sezon);
                                                    }
                                                },
                                            },
                                        {view:"combo", label: "Условия хранения:", labelPosition:"top", value: "", name: "id_usloviya", css: "small",
                                            options:  {
                                                filter: hran_filter,
                                                body: {
                                                    //autoheight:false,
                                                    //view:"list",
                                                    //type:{ height:"auto" },
                                                    template: "#usloviya#",
                                                    //height: 400,
                                                    yCount:5,
                                                    //data: hran
                                                    }
                                                },
                                            on: {
                                                onAfterRender: function() {
                                                    this.getList().sync(hran);
                                                    }
                                                },
                                            },
                                        {view:"combo", label: "Группа:", labelPosition:"top", value: "", name: "id_group", css: "small",
                                            options:  {
                                                filter: gr_filter,
                                                body: {
                                                    autoheight:false,
                                                    view:"list",
                                                    type:{ height:"auto" },
                                                    template: "<div class='comboList'>#group#</div>",
                                                    height: 200,
                                                    yCount:0,
                                                    //data: group
                                                    }
                                                },
                                            on: {
                                                onAfterRender: function() {
                                                    this.getList().sync(group);
                                                    }
                                                },
                                            },
                                        {view:"combo", label: "НДС:", labelPosition:"top", value: "", name: "id_nds", css: "small",
                                            options:  {
                                                body: {
                                                    template:"#nds#",
                                                    yCount:5,
                                                    //data: nds
                                                    }
                                                },
                                            on: {
                                                onAfterRender: function() {
                                                    this.getList().sync(nds);
                                                    }
                                                },
                                            },
                                    ]}
                                ]}
                            ]},
                        {cols: [
                            {view: "button", type: "base", label: "Отменить", width: 120, height: 32,
                                click: () => {
                                    this.hide();
                                    }
                                },
                            {},
                            {view: "button", type: "base", label: "Сохранить", width: 120, height: 32, disabled: true,
                                on: {
                                    onAfterRender: function () {
                                        if (this.$scope.app.config.role === this.$scope.app.config.admin) this.enable();
                                        }
                                    },
                                click: () => {
                                    let valid = this.$$("new_form").validate({hidden:false, disabled:false});
                                    if (valid) {
                                        let left_f = this.$$("new_form").getValues();
                                        let right_f = this.$$("new_f_right").getValues();
                                        let params = {};
                                        params["id_spr"] = (left_f.id_spr) ? left_f.id_spr : -1;
                                        params["barcode"] = left_f.barcode;
                                        params["c_tovar"] = left_f.c_tovar;
                                        params["id_strana"] = left_f.id_strana;
                                        params["id_zavod"] = left_f.id_zavod;
                                        params["id_dv"] = left_f.id_dv;
                                        params["c_opisanie"] = left_f.c_opisanie;
                                        params["prescr"] = (right_f._prescr ===  1) ? true : false;
                                        params["mandat"] = (right_f._mandat ===  1) ? true : false;
                                        params["id_sezon"] = right_f.id_sezon;
                                        params["id_usloviya"] = right_f.id_usloviya;
                                        params["id_group"] = right_f.id_group;
                                        params["id_nds"] = right_f.id_nds;
                                        params["sh_prc"] = (this.$$("new_form").config.spr) ? prcs.getItem(prcs.getCursor()).sh_prc
                                                                                            : undefined;
                                        params["c_tgroup"] = left_f.c_tgroup;
                                        params["user"] = this.app.config.user;
                                        let url = this.app.config.r_url + "?setSpr";
                                        console.log(params);
                                        let res = request(url, params, !0).response;
                                        res = checkVal(res, 's');
                                        if (res && res.new && this.$$("new_form").config.spr) {
                                            delPrc(params, this);
                                            //связываем со справочником
                                            //let pars = {"user": params["user"], "sh_prc": params["sh_prc"], "id_spr": res.datas[0]};
                                            //url = this.app.config.r_url + "?setLnk";
                                            //this.hide();
                                            //request(url, pars).then(function(data) {
                                                //data = checkVal(data, 'a');
                                                //if (data) {
                                                    //delPrc(params, this)
                                                    //};
                                                //})
                                        } else {
                                            console.log("bar", this.$$("new_form").config.search_bar)
                                            this.$$("new_form").config.search_bar.callEvent('onKeyPress', [13,]);
                                            };
                                        this.$$("new_form").config.spr = false;
                                        this.hide();
                                        };
                                    }
                                }
                            ]}
                        ]}
                    ],
                }
            }
        }
    show(new_head, search_bar, item){
        this.$$("new_form").config.search_bar = search_bar;
        if (item) {
            this.$$("new_form").parse(item);
            this.$$("new_f_right").parse(item);
            this.$$("new_form").config.spr = true;
            //this.getRoot().getBody().parse(item);
            //console.log('parse', item);
            }
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        this.getRoot().show()
        }
    hide(){
        this.getRoot().hide()
        }
    init() {
        this.popstri = this.ui(NewstriView);
        this.popbar = this.ui(NewbarView);
        this.poptg = this.ui(NewtgView);
        }
    }


